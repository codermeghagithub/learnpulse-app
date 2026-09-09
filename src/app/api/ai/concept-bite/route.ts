import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { generateConceptBite, buildDeterministicConceptBiteFallback } from "@/lib/ai/gemini";
import type { ConceptBiteOutput, BilingualChallenge, ConceptBiteSection } from "@/lib/ai/schemas";
import { z } from "zod";

const requestSchema = z.object({
  conceptId: z.string().uuid("Invalid concept ID"),
  conceptName: z.string().trim().min(1).max(200),
  description: z.string().max(2000).optional(),
  forceRefresh: z.boolean().optional(),
  challengeIndex: z.number().int().min(0).max(100).optional(),
});

interface PersistedQuickCheck {
  en?: ConceptBiteSection;
  hi?: ConceptBiteSection;
  anchorEn?: string;
  anchorHi?: string;
  challengePool?: BilingualChallenge[];
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify session
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload" },
        { status: 400 }
      );
    }

    const { conceptId, conceptName, description, forceRefresh, challengeIndex } = parsed.data;

    // 1. Check database for existing persisted concept bite (ACID read)
    let existingBite = null;
    if (!forceRefresh) {
      try {
        const { data, error: dbReadError } = await supabase
          .from("concept_bites")
          .select("id, intuition, analogy, quick_check, vernacular_anchor")
          .eq("concept_id", conceptId)
          .maybeSingle();

        if (!dbReadError && data) {
          existingBite = data;
        }
      } catch {
        // Continue gracefully if table does not exist or read fails
      }
    }

    // Check if existing bite has full bilingual challenge pool
    const existingQc = existingBite?.quick_check as PersistedQuickCheck | null;
    const hasFullPool =
      existingQc &&
      Array.isArray(existingQc.challengePool) &&
      existingQc.challengePool.length > 0 &&
      existingQc.en &&
      existingQc.hi;

    let biteResult: ConceptBiteOutput;

    if (existingBite && hasFullPool && existingQc.challengePool) {
      const pool = existingQc.challengePool;
      const chosenIdx =
        typeof challengeIndex === "number"
          ? Math.abs(challengeIndex) % pool.length
          : Math.floor(Math.random() * pool.length);
      const chosenChallenge = pool[chosenIdx];

      return NextResponse.json({
        conceptName,
        intuition: existingBite.intuition,
        analogy: existingBite.analogy,
        anchorEn: existingQc.anchorEn || existingQc.en?.anchor || "Remember: Master the core intuition.",
        anchorHi: existingBite.vernacular_anchor || existingQc.anchorHi || "याद रखें: मूल सिद्धांत को समझें।",
        vernacularAnchor: existingBite.vernacular_anchor,
        en: {
          ...existingQc.en,
          quickCheck: chosenChallenge.en,
        },
        hi: {
          ...existingQc.hi,
          quickCheck: chosenChallenge.hi,
        },
        quickCheck: chosenChallenge.en,
        challengePool: pool,
        activeChallengeIndex: chosenIdx,
        isAiGenerated: true,
        persisted: true,
      });
    }

    // 2. Generate or build fresh bilingual concept bite with rich tricky challenge pool
    try {
      biteResult = await generateConceptBite(conceptName, description, challengeIndex);
    } catch {
      biteResult = {
        ...buildDeterministicConceptBiteFallback(conceptName, description, challengeIndex),
        isAiGenerated: false,
      };
    }

    // 3. Persist to database (ACID write) so future loads are instant and shared
    try {
      const dbPayload = {
        concept_id: conceptId,
        intuition: biteResult.en?.intuition || biteResult.intuition,
        analogy: biteResult.en?.analogy || biteResult.analogy,
        vernacular_anchor: biteResult.anchorHi || biteResult.vernacularAnchor,
        quick_check: {
          ...biteResult.quickCheck,
          en: biteResult.en,
          hi: biteResult.hi,
          anchorEn: biteResult.anchorEn,
          anchorHi: biteResult.anchorHi,
          challengePool: biteResult.challengePool,
        },
      };

      await supabase.from("concept_bites").upsert(dbPayload, { onConflict: "concept_id" });
    } catch (upsertErr) {
      console.warn("[/api/ai/concept-bite] Database upsert skipped:", upsertErr);
    }

    const pool = biteResult.challengePool || [];
    const chosenIdx =
      typeof challengeIndex === "number"
        ? Math.abs(challengeIndex) % Math.max(1, pool.length)
        : Math.floor(Math.random() * Math.max(1, pool.length));

    return NextResponse.json({
      ...biteResult,
      activeChallengeIndex: chosenIdx,
      persisted: true,
    });
  } catch (err) {
    console.error("[/api/ai/concept-bite] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
