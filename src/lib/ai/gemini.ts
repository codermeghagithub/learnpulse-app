// Gemini AI service: diagnostics, remediation, and DAG synthesis

import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";
import {
  diagnosisOutputSchema,
  misconceptionOutputSchema,
  dagSynthesisOutputSchema,
  conceptBiteSchema,
  type DiagnosisInput,
  type DiagnosisOutput,
  type MisconceptionOutput,
  type DagSynthesisOutput,
  type ConceptBiteOutput,
} from "./schemas";
import {
  buildDiagnosisPrompt,
  buildFallbackPrompt,
  buildMisconceptionPrompt,
  buildDagSynthesisPrompt,
  buildConceptBitePrompt,
} from "./prompts";
import {
  buildDeterministicDiagnosisFallback,
  buildDeterministicMisconceptionFallback,
  buildDeterministicDagFallback,
  buildDeterministicConceptBiteFallback,
} from "./fallbacks";

export {
  buildDeterministicDiagnosisFallback,
  buildDeterministicMisconceptionFallback,
  buildDeterministicDagFallback,
  buildDeterministicConceptBiteFallback,
};

// Model configuration
const PRIMARY_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const FALLBACK_MODELS = [PRIMARY_MODEL, "gemini-3.6-flash"].filter(
  (model, index, arr) => arr.indexOf(model) === index
);
const CACHE_THRESHOLD = 5;

// Shared client helpers
function getClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY environment variable is not set");
  return new GoogleGenerativeAI(apiKey);
}

// Returns configured Gemini generative model instance
function getModel(modelName: string, temperature = 0.3, maxOutputTokens = 4000): GenerativeModel {
  return getClient().getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      temperature,
      maxOutputTokens,
    },
  });
}

// Repairs JSON truncated mid-stream by token limit boundaries
function repairTruncatedJson(jsonStr: string): string {
  let inString = false;
  let isEscaped = false;
  const stack: string[] = [];

  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];
    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (char === "\\") {
        isEscaped = true;
      } else if (char === '"') {
        inString = false;
      }
    } else {
      if (char === '"') {
        inString = true;
      } else if (char === "{" || char === "[") {
        stack.push(char);
      } else if (char === "}" && stack[stack.length - 1] === "{") {
        stack.pop();
      } else if (char === "]" && stack[stack.length - 1] === "[") {
        stack.pop();
      }
    }
  }

  let repaired = jsonStr.trim();
  if (inString) {
    repaired += '"';
  }

  // Remove trailing dangling commas e.g. {"key": "val",
  repaired = repaired.replace(/,\s*$/, "");

  while (stack.length > 0) {
    const last = stack.pop();
    if (last === "{") repaired += "}";
    else if (last === "[") repaired += "]";
  }

  return repaired;
}

// Executes Gemini request with model fallback and JSON structure repair
async function callGeminiRaw(
  prompt: string,
  temperature?: number,
  maxOutputTokens?: number
): Promise<unknown> {
  for (const modelName of FALLBACK_MODELS) {
    try {
      const model = getModel(modelName, temperature, maxOutputTokens);
      const result = await model.generateContent(prompt);
      const text = result.response
        .text()
        .trim()
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      try {
        return JSON.parse(text);
      } catch {
        // Attempt repair if response was cut off mid-string or mid-structure
        const repaired = repairTruncatedJson(text);
        return JSON.parse(repaired);
      }
    } catch (err) {
      console.warn(`[gemini] Call failed on model "${modelName}":`, err instanceof Error ? err.message : err);
    }
  }

  return null;
}


export interface DiagnoseOptions {
  lastMasterySnapshot?: number;
}

// Diagnose prerequisite root-cause gaps using Gemini with deterministic fallback
export async function diagnose(
  input: DiagnosisInput,
  options: DiagnoseOptions = {}
): Promise<DiagnosisOutput & { isAiGenerated: boolean }> {
  if (options.lastMasterySnapshot !== undefined) {
    const change = Math.abs(input.targetMastery - options.lastMasterySnapshot);
    if (change < CACHE_THRESHOLD) throw new Error("CACHE_HIT");
  }

  // Primary attempt
  const raw = await callGeminiRaw(buildDiagnosisPrompt(input));
  const primary = raw ? diagnosisOutputSchema.safeParse(raw) : null;
  if (primary?.success) return { ...primary.data, isAiGenerated: true };

  // Retry with a shorter prompt
  console.warn("[gemini:diagnose] Primary failed, retrying with fallback prompt...");
  const rawFallback = await callGeminiRaw(buildFallbackPrompt(input));
  const retry = rawFallback ? diagnosisOutputSchema.safeParse(rawFallback) : null;
  if (retry?.success) return { ...retry.data, isAiGenerated: true };

  // Deterministic fallback — never crashes
  console.warn("[gemini:diagnose] Both calls failed, using deterministic fallback.");
  return { ...buildDeterministicDiagnosisFallback(input), isAiGenerated: false };
}


// Diagnose why student chose incorrect option and produce targeted counter-example
export async function diagnoseMisconception(input: {
  questionText: string;
  selectedOptionText: string;
  correctOptionText: string;
  conceptName: string;
  studentReasoning?: string;
}): Promise<MisconceptionOutput & { isAiGenerated: boolean }> {
  try {
    const raw = await callGeminiRaw(buildMisconceptionPrompt(input), 0.2, 3000);
    const validated = raw ? misconceptionOutputSchema.safeParse(raw) : null;

    if (validated?.success) {
      const data = validated.data;
      const fallback = buildDeterministicMisconceptionFallback(input);

      const enSection = data.en || {
        thoughtTrap: data.thoughtTrap,
        mentalAnchor: data.mentalAnchor,
        cognitiveDissonance: data.cognitiveDissonance,
      };

      const hiSection = data.hi || {
        thoughtTrap: fallback.hi!.thoughtTrap,
        mentalAnchor: data.vernacularAnchor || fallback.hi!.mentalAnchor,
        cognitiveDissonance: fallback.hi!.cognitiveDissonance,
      };

      return {
        ...data,
        en: enSection,
        hi: hiSection,
        isAiGenerated: true,
      };
    }
  } catch (err) {
    console.warn("[gemini:misconception] Failed, using deterministic fallback:", err);
  }

  return { ...buildDeterministicMisconceptionFallback(input), isAiGenerated: false };
}


// Synthesizes course concepts, prerequisite edges, and questions into a validated DAG
export async function synthesizeDag(
  topicText: string,
  courseTitle?: string
): Promise<DagSynthesisOutput & { isAiGenerated: boolean }> {
  const raw = await callGeminiRaw(buildDagSynthesisPrompt(topicText, courseTitle), 0.4, 8000);
  const validated = raw ? dagSynthesisOutputSchema.safeParse(raw) : null;

  if (validated?.success) {
    // Validate that all edge names and question concept names reference real concept names
    const conceptNames = new Set(validated.data.concepts.map((c) => c.name));
    const safeEdges = validated.data.edges.filter(
      (e) => conceptNames.has(e.prerequisiteName) && conceptNames.has(e.conceptName)
    );
    const safeQuestions = (validated.data.questions ?? []).filter((q) =>
      conceptNames.has(q.conceptName)
    );

    return {
      ...validated.data,
      // If caller provided an explicit course title, honor it
      courseTitle: courseTitle?.trim() || validated.data.courseTitle,
      edges: safeEdges,
      questions: safeQuestions,
      isAiGenerated: true,
    };
  }

  console.warn("[gemini:synthesizeDag] Failed, using deterministic fallback.");
  return { ...buildDeterministicDagFallback(topicText, courseTitle), isAiGenerated: false };
}


// Generates bilingual concept bite with intuition, analogy, and tricky quick checks
export async function generateConceptBite(
  conceptName: string,
  description?: string,
  preferredIndex?: number
): Promise<ConceptBiteOutput & { isAiGenerated: boolean }> {
  try {
    const raw = await callGeminiRaw(buildConceptBitePrompt(conceptName, description), 0.3, 4000);
    const validated = raw ? conceptBiteSchema.safeParse(raw) : null;

    if (validated?.success) {
      const data = validated.data;
      // Enrich with bilingual guarantees
      const anchorEn = data.anchorEn || data.en?.anchor || "Remember: Master the core intuition.";
      const anchorHi = data.anchorHi || data.hi?.anchor || data.vernacularAnchor || "याद रखें: मूल सिद्धांत को समझें।";

      // If challengePool exists, pick a random challenge for the root quickCheck
      const pool = data.challengePool && data.challengePool.length > 0 ? data.challengePool : undefined;
      const activeChallenge = pool
        ? (typeof preferredIndex === "number"
            ? pool[Math.abs(preferredIndex) % pool.length]
            : pool[Math.floor(Math.random() * pool.length)])
        : undefined;

      const enSection = data.en || {
        intuition: data.intuition,
        analogy: data.analogy,
        anchor: anchorEn,
        quickCheck: activeChallenge?.en || data.quickCheck,
      };

      const hiSection = data.hi || {
        intuition: data.intuition,
        analogy: data.analogy,
        anchor: anchorHi,
        quickCheck: activeChallenge?.hi || data.quickCheck,
      };

      return {
        ...data,
        anchorEn,
        anchorHi,
        vernacularAnchor: anchorHi,
        en: enSection,
        hi: hiSection,
        quickCheck: activeChallenge?.en || data.quickCheck,
        challengePool: pool,
        isAiGenerated: true,
      };
    }
  } catch (err) {
    console.warn("[gemini:conceptBite] AI call failed, falling back to deterministic bank:", err);
  }

  return {
    ...buildDeterministicConceptBiteFallback(conceptName, description, preferredIndex),
    isAiGenerated: false,
  };
}

