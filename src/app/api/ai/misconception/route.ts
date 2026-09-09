import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { diagnoseMisconception } from "@/lib/ai/gemini";
import { z } from "zod";

// ─── Request Validation ───────────────────────────────────────────────────────

const requestSchema = z.object({
  questionId: z.string().uuid("Invalid question ID"),
  questionText: z.string().trim().min(1).max(2000),
  selectedOptionText: z.string().trim().min(1).max(1000),
  selectedKey: z.string().trim().min(1).max(50),
  correctOptionText: z.string().trim().min(1).max(1000),
  conceptName: z.string().trim().min(1).max(200),
  /** Optional: the student's self-reported reasoning for their answer. */
  studentReasoning: z.string().trim().max(500).optional(),
});

// ─── In-Memory Cache ──────────────────────────────────────────────────────────

type MisconceptionDiagnosis = Awaited<ReturnType<typeof diagnoseMisconception>>;
const misconceptionCache = new Map<string, MisconceptionDiagnosis>();

function buildCacheKey(questionId: string, selectedKey: string, studentReasoning?: string): string {
  const reasoningSlug = studentReasoning ? `_${studentReasoning.slice(0, 50)}` : "";
  return `${questionId}_${selectedKey}${reasoningSlug}`;
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // Auth: optional — allow session-cookie OR Bearer token.
    // We never hard-block here; a missing session degrades gracefully.
    try {
      const supabase = await createClient();
      let user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        const authHeader = req.headers.get("authorization");
        if (authHeader?.startsWith("Bearer ")) {
          const token = authHeader.split(" ")[1];
          const { data: tokenUser } = await supabase.auth.getUser(token);
          user = tokenUser?.user ?? null;
        }
      }
    } catch {
      // Intentionally allow the request through even if the session is refreshing.
    }

    // Validate request body
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload" },
        { status: 400 }
      );
    }

    const {
      questionId,
      questionText,
      selectedOptionText,
      selectedKey,
      correctOptionText,
      conceptName,
      studentReasoning,
    } = parsed.data;

    // Cache lookup
    const cacheKey = buildCacheKey(questionId, selectedKey, studentReasoning);
    const cached = misconceptionCache.get(cacheKey);
    if (cached) {
      return NextResponse.json({ ...cached, cached: true });
    }

    // Call Gemini Misconception + Cognitive Dissonance Engine
    const result = await diagnoseMisconception({
      questionText,
      selectedOptionText,
      correctOptionText,
      conceptName,
      studentReasoning,
    });

    // Store in cache for subsequent requests
    misconceptionCache.set(cacheKey, result);

    return NextResponse.json({ ...result, cached: false });
  } catch (err) {
    console.error("[/api/ai/misconception] Error:", err);

    const enFallback = {
      thoughtTrap:
        "A common misconception is treating this component as responsible for the final output rather than an intermediate phase.",
      mentalAnchor: "Rule of thumb: Check each phase's distinct input and output contract.",
      cognitiveDissonance: {
        paradoxScenario:
          "Imagine swapping the two options in a real system. If they were truly interchangeable, nothing would break — but in practice, one component prepares data while the other consumes it. Swapping them would produce incorrect or empty output.",
        counterQuestion:
          "What specific output would your system produce if the two components exchanged their roles?",
      },
    };

    const hiFallback = {
      thoughtTrap:
        "एक सामान्य भ्रांति यह है कि दोनों घटकों को एक जैसा मान लिया जाता है, जबकि एक केवल डेटा तैयार करता है और दूसरा अंतिम परिणाम संभालता है।",
      mentalAnchor:
        "याद रखें: हर component का काम अलग होता है — नाम से भ्रमित न हों, उसके असली उद्देश्य (responsibility) पर ध्यान दें।",
      cognitiveDissonance: {
        paradoxScenario:
          "कल्पना करें कि लाइव सिस्टम में दोनों विकल्पों को आपस में बदल दिया जाए: यदि दोनों सच में एक जैसे होते, तो कुछ नहीं बिगड़ता। लेकिन असल में एक घटक डेटा बनाता है और दूसरा उसका उपयोग करता है। बदलने पर सिस्टम गलत परिणाम देगा।",
        counterQuestion:
          "यदि दोनों घटक अपनी भूमिकाएं बदल लें, तो आपका सिस्टम क्या विशिष्ट आउटपुट देगा?",
      },
    };

    return NextResponse.json(
      {
        ...enFallback,
        vernacularAnchor: hiFallback.mentalAnchor,
        en: enFallback,
        hi: hiFallback,
        isAiGenerated: false,
        cached: false,
      },
      { status: 200 }
    );
  }
}
