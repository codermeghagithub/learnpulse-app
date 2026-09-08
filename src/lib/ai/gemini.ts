/**
 * gemini.ts — Gemini AI diagnosis layer
 *
 * RULES:
 * - Called server-side ONLY (Route Handlers, Server Actions)
 * - GEMINI_API_KEY never exposed to client
 * - All responses Zod-validated before returning
 * - Retry once with smaller prompt on failure
 * - Fallback to deterministic data if both calls fail
 * - Cache: skip regen if mastery snapshot changed < 5 points
 * - App must NEVER break or show a raw error
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  diagnosisOutputSchema,
  misconceptionOutputSchema,
  type DiagnosisInput,
  type DiagnosisOutput,
  type MisconceptionOutput,
} from "./schemas";
import {
  buildDiagnosisPrompt,
  buildFallbackPrompt,
  buildMisconceptionPrompt,
} from "./prompts";

const MODEL_NAME = "gemini-2.5-flash";
const CACHE_THRESHOLD = 5; // mastery point change threshold to skip regen

function getClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Call Gemini with a prompt and return validated DiagnosisOutput, or null on failure.
 */
async function callGemini(prompt: string): Promise<DiagnosisOutput | null> {
  try {
    const genAI = getClient();
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3,
        maxOutputTokens: 1500,
        // @ts-expect-error - Gemini 2.5 Flash thinking budget optimization
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Strip any accidental markdown fences
    const jsonText = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(jsonText);
    const validated = diagnosisOutputSchema.safeParse(parsed);

    if (!validated.success) {
      console.error("[gemini] Zod validation failed:", validated.error.flatten());
      return null;
    }

    return validated.data;
  } catch (err) {
    console.error("[gemini] API call failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Build a deterministic fallback DiagnosisOutput from algorithm data.
 * Used when Gemini fails after retry.
 */
function buildDeterministicFallback(input: DiagnosisInput): DiagnosisOutput {
  const topPrereq = input.prerequisites[0];
  const blockingConcept = topPrereq?.concept ?? input.targetConcept;

  return {
    rootCause: `Insufficient mastery of ${blockingConcept} is blocking progress on ${input.targetConcept}.`,
    blockingConcept,
    confidence: 0.6,
    explanation: `Based on your attempt history, ${blockingConcept} (${topPrereq?.mastery?.toFixed(0) ?? 0}% mastery) appears to be the primary prerequisite gap. Strengthening this foundation will help you understand ${input.targetConcept} more effectively.`,
    actionPlan: [
      {
        title: `Review ${blockingConcept} fundamentals`,
        description: `Go through the core concepts of ${blockingConcept}, focusing on examples you previously got wrong.`,
        estimatedMinutes: 20,
      },
      {
        title: `Practice ${blockingConcept} problems`,
        description: `Complete 5–10 practice problems on ${blockingConcept} until you feel confident.`,
        estimatedMinutes: 30,
      },
      {
        title: `Bridge to ${input.targetConcept}`,
        description: `Work through problems that explicitly use ${blockingConcept} as a foundation for ${input.targetConcept}.`,
        estimatedMinutes: 25,
      },
    ],
  };
}

export interface DiagnoseOptions {
  /**
   * The current mastery score snapshot in the interventions table.
   * If provided and the difference from targetMastery is < CACHE_THRESHOLD,
   * we skip regenerating and return null (caller should use cached intervention).
   */
  lastMasterySnapshot?: number;
}

/**
 * Main entry point for the Gemini diagnosis layer.
 *
 * @param input - Diagnosis input built from DB data + algorithm output
 * @param options - Cache options
 * @returns DiagnosisOutput (from Gemini or deterministic fallback)
 */
export async function diagnose(
  input: DiagnosisInput,
  options: DiagnoseOptions = {}
): Promise<DiagnosisOutput & { isAiGenerated: boolean }> {
  // Cache check: skip regen if mastery hasn't changed significantly
  if (options.lastMasterySnapshot !== undefined) {
    const change = Math.abs(input.targetMastery - options.lastMasterySnapshot);
    if (change < CACHE_THRESHOLD) {
      // Return null to signal "use cached result"
      // Caller handles this case
      throw new Error("CACHE_HIT");
    }
  }

  // Primary call
  const primaryPrompt = buildDiagnosisPrompt(input);
  let result = await callGemini(primaryPrompt);

  // Retry with smaller prompt
  if (!result) {
    console.log("[gemini] Primary call failed, retrying with fallback prompt...");
    const fallbackPrompt = buildFallbackPrompt(input);
    result = await callGemini(fallbackPrompt);
  }

  // Deterministic fallback
  if (!result) {
    console.log("[gemini] Both calls failed, using deterministic fallback");
    return { ...buildDeterministicFallback(input), isAiGenerated: false };
  }

  return { ...result, isAiGenerated: true };
}

/**
 * Diagnose why a student chose a specific incorrect option.
 * Reverse-engineers the thought trap and provides a 10-second mental anchor.
 */
export async function diagnoseMisconception(input: {
  questionText: string;
  selectedOptionText: string;
  correctOptionText: string;
  conceptName: string;
}): Promise<MisconceptionOutput & { isAiGenerated: boolean }> {
  try {
    const prompt = buildMisconceptionPrompt(input);
    const genAI = getClient();
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
        maxOutputTokens: 1024,
        // @ts-expect-error - Gemini 2.5 Flash thinking budget optimization
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonText = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(jsonText);
    const validated = misconceptionOutputSchema.safeParse(parsed);
    if (validated.success) {
      return { ...validated.data, isAiGenerated: true };
    }
  } catch (err) {
    console.warn("[gemini:misconception] Failed, falling back to deterministic:", err);
  }

  // Deterministic fallback if API fails
  return {
    thoughtTrap: `You may have selected this because both options share closely related terminology within ${input.conceptName}. However, "${input.selectedOptionText}" describes a different operational phase than "${input.correctOptionText}".`,
    mentalAnchor: `Rule of thumb: Focus on the specific responsibility of ${input.conceptName} to distinguish it from related components.`,
    isAiGenerated: false,
  };
}
