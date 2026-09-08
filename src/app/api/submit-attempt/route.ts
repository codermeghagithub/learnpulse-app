import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { computeScaledMastery } from "@/lib/algorithms/mastery";
import { z } from "zod";

const requestSchema = z.object({
  questionId: z.string().uuid(),
  selectedAnswer: z.string().min(1),
  conceptId: z.string().uuid(),
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
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { questionId, selectedAnswer, conceptId } = parsed.data;

    // Fetch the question (server-side, includes correct answer)
    const { data: question } = await supabase
      .from("questions")
      .select("correct_answer, difficulty, concept_id")
      .eq("id", questionId)
      .single();

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    // Verify concept matches
    if (question.concept_id !== conceptId) {
      return NextResponse.json({ error: "Concept mismatch" }, { status: 400 });
    }

    const isCorrect = selectedAnswer.trim() === question.correct_answer.trim();

    // Insert attempt
    await supabase.from("attempts").insert({
      user_id: user.id,
      question_id: questionId,
      selected_answer: selectedAnswer,
      is_correct: isCorrect,
    });

    // Fetch all questions for this concept to determine total bank size
    const { data: conceptQuestions } = await supabase
      .from("questions")
      .select("id")
      .eq("concept_id", conceptId);

    const totalConceptQuestions = conceptQuestions?.length ?? 1;
    const questionIds = (conceptQuestions ?? []).map((q) => q.id);

    // Fetch all attempts by this user for this concept's questions
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
    const uniqueQuestionsCorrect = uniqueCorrectIds.size;

    // Fetch previous mastery score
    const { data: currentMastery } = await supabase
      .from("mastery")
      .select("score, attempts_count, correct_count")
      .eq("user_id", user.id)
      .eq("concept_id", conceptId)
      .maybeSingle();

    const previousScore = currentMastery?.score ?? 0;

    // Compute scaled mastery score
    const newScore = computeScaledMastery({
      totalConceptQuestions,
      uniqueQuestionsCorrect,
      totalAttempts,
      totalCorrect,
    });

    // Upsert mastery
    await supabase.from("mastery").upsert(
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

    // Revalidate cached paths so updated mastery reflects immediately across views
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/gaps", "layout");
    revalidatePath(`/dashboard/gaps/${conceptId}`);
    revalidatePath("/dashboard/practice");
    revalidatePath("/teacher");

    return NextResponse.json({
      isCorrect,
      previousScore: Math.round(previousScore),
      newScore: Math.round(newScore),
      gain: Math.round(newScore - previousScore),
      uniqueQuestionsCorrect,
      totalConceptQuestions,
      isConceptCompleted: uniqueQuestionsCorrect >= totalConceptQuestions,
    });
  } catch (err) {
    console.error("[/api/submit-attempt]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
