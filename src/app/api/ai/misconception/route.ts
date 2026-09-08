import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { diagnoseMisconception } from "@/lib/ai/gemini";
import { z } from "zod";

const requestSchema = z.object({
  questionId: z.string().min(1),
  questionText: z.string().min(1),
  selectedOptionText: z.string().min(1),
  selectedKey: z.string().min(1),
  correctOptionText: z.string().min(1),
  conceptName: z.string().min(1),
});

// Fast in-memory cache to ensure sub-millisecond responses for repeated option selections
const misconceptionCache = new Map<string, { thoughtTrap: string; mentalAnchor: string; isAiGenerated: boolean }>();

export async function POST(req: NextRequest) {
  try {
    // Optional auth check (supports both browser cookies and Bearer header)
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
      // Allow practice guidance even if session token is refreshing
    }

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.format() }, { status: 400 });
    }

    const { questionId, questionText, selectedOptionText, selectedKey, correctOptionText, conceptName } = parsed.data;

    // Check fast cache
    const cacheKey = `${questionId}_${selectedKey}`;
    if (misconceptionCache.has(cacheKey)) {
      return NextResponse.json({
        ...misconceptionCache.get(cacheKey)!,
        cached: true,
      });
    }

    // Call Gemini Misconception Engine
    const result = await diagnoseMisconception({
      questionText,
      selectedOptionText,
      correctOptionText,
      conceptName,
    });

    // Store in cache
    misconceptionCache.set(cacheKey, {
      thoughtTrap: result.thoughtTrap,
      mentalAnchor: result.mentalAnchor,
      isAiGenerated: result.isAiGenerated,
    });

    return NextResponse.json({
      ...result,
      cached: false,
    });
  } catch (err) {
    console.error("[/api/ai/misconception] Error:", err);
    return NextResponse.json(
      {
        thoughtTrap: "A common misconception is treating this component as responsible for the final output rather than an intermediate phase.",
        mentalAnchor: "Rule of thumb: Check each phase's distinct input and output contract.",
        isAiGenerated: false,
        cached: false,
      },
      { status: 200 }
    );
  }
}
