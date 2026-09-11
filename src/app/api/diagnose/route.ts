import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { diagnose } from "@/lib/ai/gemini";
import { rankRootCauses, type RootCauseCandidate } from "@/lib/algorithms/rootCause";
import { z } from "zod";

const requestSchema = z.object({
  userId: z.string().uuid("Invalid user ID").optional(),
  targetConceptId: z.string().uuid("Invalid target concept ID"),
  targetConceptName: z.string().trim().min(1).max(200),
  targetMastery: z.number().min(0).max(100),
  prerequisites: z.array(
    z.object({
      conceptId: z.string().uuid("Invalid prerequisite concept ID"),
      concept: z.string().trim().min(1).max(200),
      mastery: z.number().min(0).max(100),
      edgeWeight: z.number().min(0).max(10),
    })
  ).max(50),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify student role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "student") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate request body
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request payload" },
        { status: 400 }
      );
    }

    const { targetConceptId, targetConceptName, targetMastery, prerequisites } = parsed.data;

    // Fetch recent mistakes for this concept
    const { data: recentAttempts } = await supabase
      .from("attempts")
      .select(`
        selected_answer,
        is_correct,
        questions!inner(question_text, correct_answer)
      `)
      .eq("user_id", user.id)
      .eq("is_correct", false)
      .order("created_at", { ascending: false })
      .limit(5);

    const recentMistakes = (recentAttempts ?? []).map((a) => {
      const q = a.questions as unknown as { question_text: string; correct_answer: string };
      return `${q.question_text} (answered ${a.selected_answer}, correct: ${q.correct_answer})`;
    });

    // Rank root causes
    const candidates: RootCauseCandidate[] = prerequisites.map((p) => ({
      conceptId: p.conceptId,
      conceptName: p.concept,
      masteryScore: p.mastery,
      edgeWeight: p.edgeWeight,
      failedAttempts: Math.max(0, 10 - p.mastery / 10), // estimate from mastery
      recency: p.mastery < 40 ? 0.8 : 0.3,
    }));

    const ranked = rankRootCauses(candidates);

    // Check for cached intervention
    const { data: existingIntervention } = await supabase
      .from("interventions")
      .select("id, mastery_snapshot, root_cause, blocking_concept_id, confidence, explanation, action_plan")
      .eq("user_id", user.id)
      .eq("concept_id", targetConceptId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Build diagnosis input for Gemini
    const diagnosisInput = {
      targetConcept: targetConceptName,
      targetMastery,
      prerequisites: ranked.map((c) => ({
        concept: c.conceptName,
        mastery: c.masteryScore,
        rootCauseScore: c.rootCauseScore,
      })),
      recentMistakes,
    };

    // Diagnose via Gemini
    let diagnosisResult;
    let usedCache = false;

    try {
      diagnosisResult = await diagnose(diagnosisInput, {
        lastMasterySnapshot: existingIntervention?.mastery_snapshot,
      });
    } catch (err) {
      if (err instanceof Error && err.message === "CACHE_HIT" && existingIntervention) {
        // Return cached result
        usedCache = true;
        diagnosisResult = {
          rootCause: existingIntervention.root_cause,
          blockingConcept: existingIntervention.blocking_concept_id ?? "",
          confidence: existingIntervention.confidence,
          explanation: existingIntervention.explanation,
          actionPlan: existingIntervention.action_plan as Array<{
            title: string;
            description: string;
            estimatedMinutes: number;
          }>,
          isAiGenerated: true,
        };
      } else {
        throw err;
      }
    }

    // Resolve blocking concept ID and human-readable name from prerequisites
    const matchedPrereq = prerequisites.find(
      (p) =>
        p.concept.toLowerCase().trim() ===
          diagnosisResult.blockingConcept.toLowerCase().trim() ||
        p.conceptId === diagnosisResult.blockingConcept
    );
    const blockingConceptId = matchedPrereq
      ? matchedPrereq.conceptId
      : (ranked[0]?.conceptId ?? targetConceptId);

    const blockingConceptName = matchedPrereq
      ? matchedPrereq.concept
      : (diagnosisResult.blockingConcept || (ranked[0]?.conceptName ?? targetConceptName));

    // Upsert intervention record
    if (!usedCache) {
      await supabase.from("interventions").upsert(
        {
          user_id: user.id,
          concept_id: targetConceptId,
          root_cause: diagnosisResult.rootCause,
          blocking_concept_id: blockingConceptId,
          confidence: diagnosisResult.confidence,
          explanation: diagnosisResult.explanation,
          action_plan: diagnosisResult.actionPlan,
          status: "pending",
          mastery_snapshot: targetMastery,
        },
        {
          onConflict: "user_id,concept_id",
          ignoreDuplicates: false,
        }
      );
    }

    return NextResponse.json({
      ...diagnosisResult,
      blockingConcept: blockingConceptName,
      blockingConceptId,
    });
  } catch (err) {
    console.error("[/api/diagnose]", err);
    return NextResponse.json(
      { error: "Unable to run diagnosis. Please try again." },
      { status: 500 }
    );
  }
}
