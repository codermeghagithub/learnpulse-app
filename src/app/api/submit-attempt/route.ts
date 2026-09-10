import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { computeScaledMastery } from "@/lib/algorithms/mastery";
import { z } from "zod";

const requestSchema = z.object({
  questionId: z.string().uuid("Invalid question ID"),
  selectedAnswer: z.string().trim().min(1, "Answer cannot be empty").max(500, "Answer too long"),
  conceptId: z.string().uuid("Invalid concept ID"),
  isReviewQuestion: z.boolean().optional(),
  originConceptId: z.string().uuid("Invalid origin concept ID").optional(),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "student") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate body
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const { questionId, selectedAnswer, conceptId, isReviewQuestion, originConceptId } = parsed.data;

    // Fetch the question (server-side, includes correct answer)
    const { data: question } = await supabase
      .from("questions")
      .select("correct_answer, difficulty, concept_id")
      .eq("id", questionId)
      .single();

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    // Verify concept matches (allow review questions from forward dependents)
    if (
      question.concept_id !== conceptId &&
      (!isReviewQuestion || (question.concept_id !== originConceptId && conceptId !== originConceptId))
    ) {
      return NextResponse.json({ error: "Concept mismatch" }, { status: 400 });
    }

    // ACID Transaction Execution: Call PostgreSQL atomic stored procedure
    let isCorrect: boolean;
    let previousScore = 0;
    let newScore = 0;
    let totalConceptQuestions = 1;
    let uniqueQuestionsCorrect = 0;

    const { data: atomicResult, error: rpcError } = await supabase.rpc(
      "submit_attempt_atomic",
      {
        p_user_id: user.id,
        p_question_id: questionId,
        p_selected_answer: selectedAnswer,
        p_concept_id: conceptId,
      }
    );

    if (!rpcError && atomicResult) {
      // Successfully processed in a single atomic database transaction
      isCorrect = atomicResult.is_correct;
      previousScore = atomicResult.previous_score ?? 0;
      newScore = atomicResult.new_score ?? 0;
      totalConceptQuestions = atomicResult.total_concept_questions ?? 1;
      uniqueQuestionsCorrect = atomicResult.unique_questions_correct ?? 0;
    } else {
      // Fallback: If RPC not present in DB, enforce transactional Atomicity in application layer
      if (rpcError) {
        console.warn("[/api/submit-attempt] RPC submit_attempt_atomic failed or missing, falling back with rollback guard:", rpcError.message);
      }

      isCorrect = selectedAnswer.trim() === question.correct_answer.trim();

      // Step 1: Insert attempt and capture ID for potential rollback
      const { data: insertedAttempt, error: attemptError } = await supabase
        .from("attempts")
        .insert({
          user_id: user.id,
          question_id: questionId,
          selected_answer: selectedAnswer,
          is_correct: isCorrect,
        })
        .select("id")
        .single();

      if (attemptError || !insertedAttempt) {
        console.error("[/api/submit-attempt] Failed to insert attempt:", attemptError);
        return NextResponse.json({ error: "Failed to record attempt" }, { status: 500 });
      }

      try {
        // Step 2: Fetch all questions for this concept to determine total bank size
        const { data: conceptQuestions } = await supabase
          .from("questions")
          .select("id")
          .eq("concept_id", conceptId);

        totalConceptQuestions = conceptQuestions?.length ?? 1;
        const questionIds = (conceptQuestions ?? []).map((q) => q.id);

        // Step 3: Fetch all attempts by this user for this concept
        const { data: userAttempts } = await supabase
          .from("attempts")
          .select("question_id, is_correct")
          .eq("user_id", user.id)
          .in("question_id", questionIds);

        const attemptsList = userAttempts ?? [];
        const totalAttempts = attemptsList.length;
        const totalCorrect = attemptsList.filter((a) => a.is_correct).length;
        const uniqueCorrectIds = new Set(
          attemptsList.filter((a) => a.is_correct).map((a) => a.question_id)
        );
        uniqueQuestionsCorrect = uniqueCorrectIds.size;

        // Step 4: Fetch previous mastery score
        const { data: currentMastery } = await supabase
          .from("mastery")
          .select("score")
          .eq("user_id", user.id)
          .eq("concept_id", conceptId)
          .maybeSingle();

        previousScore = currentMastery?.score ?? 0;

        // Step 5: Compute scaled mastery score
        newScore = computeScaledMastery({
          totalConceptQuestions,
          uniqueQuestionsCorrect,
          totalAttempts,
          totalCorrect,
        });

        // Step 6: Upsert mastery
        const { error: masteryError } = await supabase.from("mastery").upsert(
          {
            user_id: user.id,
            concept_id: conceptId,
            score: newScore,
            attempts_count: totalAttempts,
            correct_count: totalCorrect,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,concept_id" }
        );

        if (masteryError) {
          throw masteryError;
        }
      } catch (upsertErr) {
        // ATOMICITY ROLLBACK: If mastery upsert failed, delete the inserted attempt
        console.error("[/api/submit-attempt] Mastery calculation/upsert failed. Executing atomic rollback on attempt:", upsertErr);
        await supabase.from("attempts").delete().eq("id", insertedAttempt.id);
        return NextResponse.json({ error: "Atomic transaction failed: rolled back attempt" }, { status: 500 });
      }
    }

    // Revalidate cached paths so updated mastery reflects immediately across views
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/gaps", "layout");
    revalidatePath(`/dashboard/gaps/${conceptId}`);
    revalidatePath("/dashboard/practice");
    revalidatePath("/teacher");

    // If this was a decay review question and the student got it wrong,
    // diagnose against originConceptId (the decayed concept) to trace the root cause
    let decayDiagnosis = null;
    if (isReviewQuestion && !isCorrect && originConceptId) {
      const { data: originConcept } = await supabase
        .from("concepts")
        .select("id, name")
        .eq("id", originConceptId)
        .maybeSingle();

      const { data: originMastery } = await supabase
        .from("mastery")
        .select("score")
        .eq("user_id", user.id)
        .eq("concept_id", originConceptId)
        .maybeSingle();

      const { data: existingIntervention } = await supabase
        .from("interventions")
        .select("root_cause, explanation, action_plan, confidence")
        .eq("user_id", user.id)
        .eq("concept_id", originConceptId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingIntervention) {
        decayDiagnosis = {
          confirmed: true,
          conceptId: originConceptId,
          conceptName: originConcept?.name ?? "Prerequisite Concept",
          masteryScore: originMastery?.score ?? 0,
          rootCause: existingIntervention.root_cause,
          explanation: existingIntervention.explanation,
          actionPlan: existingIntervention.action_plan,
        };
      } else {
        decayDiagnosis = {
          confirmed: true,
          conceptId: originConceptId,
          conceptName: originConcept?.name ?? "Prerequisite Concept",
          masteryScore: originMastery?.score ?? 0,
          rootCause: `Decayed retention on ${originConcept?.name ?? "prerequisite concept"} led to an error on downstream application.`,
          explanation: `Review attempt failed due to forgetting-curve decay on ${originConcept?.name ?? "the prerequisite concept"}. Re-practicing foundational questions will restore downstream proficiency.`,
          actionPlan: [
            { step: 1, action: `Review foundational rules of ${originConcept?.name ?? "the concept"}` },
            { step: 2, action: "Re-attempt practice questions to reset the forgetting curve" },
          ],
        };
      }
    }

    return NextResponse.json({
      isCorrect,
      previousScore: Math.round(previousScore),
      newScore: Math.round(newScore),
      gain: Math.round(newScore - previousScore),
      uniqueQuestionsCorrect,
      totalConceptQuestions,
      isConceptCompleted: uniqueQuestionsCorrect >= totalConceptQuestions,
      decayDiagnosis,
    });
  } catch (err) {
    console.error("[/api/submit-attempt]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
