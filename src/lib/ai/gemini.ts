/**
 * gemini.ts — Gemini AI layer
 *
 * RULES:
 * - Called server-side ONLY (Route Handlers, Server Actions).
 * - GEMINI_API_KEY is NEVER exposed to the client.
 * - All responses are Zod-validated before returning to callers.
 * - Every function has a deterministic fallback — the app NEVER crashes.
 * - Retry with a smaller prompt on primary failure before using fallback.
 */

import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";
import {
  diagnosisOutputSchema,
  misconceptionOutputSchema,
  dagSynthesisOutputSchema,
  type DiagnosisInput,
  type DiagnosisOutput,
  type MisconceptionOutput,
  type DagSynthesisOutput,
} from "./schemas";
import {
  buildDiagnosisPrompt,
  buildFallbackPrompt,
  buildMisconceptionPrompt,
  buildDagSynthesisPrompt,
} from "./prompts";

// ─── Config ───────────────────────────────────────────────────────────────────

const MODEL_NAME = "gemini-2.5-flash";
/** If mastery hasn't shifted by this many points, skip AI regen and use cache. */
const CACHE_THRESHOLD = 5;

// ─── Shared Helpers ───────────────────────────────────────────────────────────

/** Initialise the Gemini client (throws if API key is missing). */
function getClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY environment variable is not set");
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Get a configured Gemini model instance.
 * Centralising this avoids repeating generation config across every function.
 */
function getModel(temperature = 0.3, maxOutputTokens = 1500): GenerativeModel {
  return getClient().getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      temperature,
      maxOutputTokens,
      // @ts-expect-error - Gemini 2.5 Flash thinking budget optimisation
      thinkingConfig: { thinkingBudget: 0 },
    },
  });
}

/**
 * Call Gemini and return raw parsed JSON, or null on any failure.
 * Strips accidental markdown fences before parsing.
 */
async function callGeminiRaw(
  prompt: string,
  temperature?: number,
  maxOutputTokens?: number
): Promise<unknown> {
  try {
    const model = getModel(temperature, maxOutputTokens);
    const result = await model.generateContent(prompt);
    const text = result.response
      .text()
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    return JSON.parse(text);
  } catch (err) {
    console.error("[gemini] Raw call failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

// ─── Diagnosis ────────────────────────────────────────────────────────────────

/** Builds a safe deterministic fallback when Gemini is unavailable. */
function buildDeterministicDiagnosisFallback(input: DiagnosisInput): DiagnosisOutput {
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
   * If provided and the mastery change from lastMasterySnapshot is below
   * CACHE_THRESHOLD, a "CACHE_HIT" error is thrown so the caller can reuse
   * the stored intervention without a new AI call.
   */
  lastMasterySnapshot?: number;
}

/**
 * Main entry point for prerequisite root-cause diagnosis.
 *
 * @throws Error("CACHE_HIT") if mastery hasn't changed enough to re-diagnose.
 */
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

// ─── Misconception + Cognitive Dissonance ─────────────────────────────────────

/** Fallback when Gemini is unavailable for misconception diagnosis. */
function buildDeterministicMisconceptionFallback(input: {
  selectedOptionText: string;
  correctOptionText: string;
  conceptName: string;
}): MisconceptionOutput {
  return {
    thoughtTrap: `You likely selected "${input.selectedOptionText}" because both options share closely related terminology within ${input.conceptName}. However, "${input.selectedOptionText}" describes a different operational phase than "${input.correctOptionText}".`,
    mentalAnchor: `Rule of thumb: Focus on the specific responsibility of ${input.conceptName} — ask yourself what the component does, not just where it lives.`,
    cognitiveDissonance: {
      paradoxScenario: `Imagine applying your assumption in a real system: if "${input.selectedOptionText}" and "${input.correctOptionText}" were interchangeable, swapping them would produce the same output. But in practice, they handle fundamentally different responsibilities — swapping them would cause the system to fail.`,
      counterQuestion: `If your assumption held, what specific output or behaviour would change if you replaced "${input.correctOptionText}" with "${input.selectedOptionText}" in a live system?`,
    },
  };
}

/**
 * Diagnose why a student chose a specific incorrect option, and produce
 * a targeted Cognitive Dissonance counter-example to fix the mental model.
 *
 * Accepts an optional `studentReasoning` string (the student's explanation
 * of why they thought their answer was correct) to make the diagnosis sharper.
 */
export async function diagnoseMisconception(input: {
  questionText: string;
  selectedOptionText: string;
  correctOptionText: string;
  conceptName: string;
  studentReasoning?: string;
}): Promise<MisconceptionOutput & { isAiGenerated: boolean }> {
  const raw = await callGeminiRaw(buildMisconceptionPrompt(input), 0.2, 1024);
  const validated = raw ? misconceptionOutputSchema.safeParse(raw) : null;

  if (validated?.success) return { ...validated.data, isAiGenerated: true };

  console.warn("[gemini:misconception] Failed, using deterministic fallback.");
  return { ...buildDeterministicMisconceptionFallback(input), isAiGenerated: false };
}

// ─── DAG Synthesis ────────────────────────────────────────────────────────────

/** Fallback DAG when Gemini is unavailable during synthesis. */
export function buildDeterministicDagFallback(
  topicText: string,
  explicitCourseTitle?: string
): DagSynthesisOutput {
  let title = explicitCourseTitle?.trim();
  if (!title) {
    const fullText = topicText.toLowerCase();
    const firstLine = topicText.split("\n")[0] ?? "";
    const prefix = firstLine.split(":")[0]?.trim() || "";

    if (
      fullText.includes("artificial") ||
      fullText.includes("machine learning") ||
      fullText.includes("heuristics") ||
      fullText.includes("minimax") ||
      fullText.includes("state space") ||
      fullText.includes(" ai")
    ) {
      title = "Artificial Intelligence";
    } else if (
      fullText.includes("data mining") ||
      fullText.includes("warehous") ||
      fullText.includes("olap") ||
      fullText.includes("apriori")
    ) {
      title = "Data Mining and Warehousing";
    } else if (
      fullText.includes("deadlock") ||
      fullText.includes("operating system") ||
      fullText.includes("semaphore") ||
      fullText.includes(" os")
    ) {
      title = "Operating Systems";
    } else if (
      fullText.includes("normaliz") ||
      fullText.includes("dbms") ||
      fullText.includes("database") ||
      fullText.includes("sql")
    ) {
      title = "Database Management Systems";
    } else if (
      fullText.includes("tcp") ||
      fullText.includes("network") ||
      fullText.includes("ip ") ||
      fullText.includes("subnet")
    ) {
      title = "Computer Networks";
    } else {
      title = prefix.slice(0, 60) || "Computer Science Course";
    }
  }

  // Pre-configured curricular concepts for standard academic subjects
  const lowerTitle = title.toLowerCase();
  let concepts: DagSynthesisOutput["concepts"] = [
    { name: "Foundational Principles", description: `Fundamental theories and models of ${title}.`, difficulty: "easy" },
    { name: "Core Architecture & Logic", description: `Primary operational frameworks and architecture in ${title}.`, difficulty: "medium" },
    { name: "Methodologies & Algorithms", description: `Key computational algorithms and workflows used in ${title}.`, difficulty: "medium" },
    { name: "Advanced Applications", description: `Complex problem solving and synthesis in ${title}.`, difficulty: "hard" },
  ];

  if (lowerTitle.includes("artificial intelligence")) {
    concepts = [
      { name: "State Space Search & Heuristics", description: "Informed and uninformed search algorithms, A* search, and heuristic design.", difficulty: "easy" },
      { name: "Knowledge Representation & Logic", description: "Propositional and first-order predicate logic for automated reasoning.", difficulty: "medium" },
      { name: "Constraint Satisfaction & Games", description: "Constraint propagation, minimax search, and alpha-beta pruning.", difficulty: "medium" },
      { name: "Machine Learning & Neural Nets", description: "Supervised learning foundations, gradient descent, and neural networks.", difficulty: "hard" },
    ];
  } else if (lowerTitle.includes("data mining") || lowerTitle.includes("warehousing")) {
    concepts = [
      { name: "Data Preprocessing & Cleaning", description: "Techniques for handling noise, normalization, data integration, and reduction.", difficulty: "easy" },
      { name: "Data Warehousing & OLAP", description: "Star/snowflake schemas, multidimensional data cubes, and slicing/dicing operations.", difficulty: "easy" },
      { name: "Association Rule Mining", description: "Discovering frequent itemsets using the Apriori algorithm and FP-growth.", difficulty: "medium" },
      { name: "Classification & Clustering", description: "Supervised decision trees, Naive Bayes, K-Means clustering, and evaluation.", difficulty: "hard" },
    ];
  } else if (lowerTitle.includes("operating systems")) {
    concepts = [
      { name: "Process Management & Scheduling", description: "Process lifecycles, context switching, and CPU scheduling algorithms.", difficulty: "easy" },
      { name: "Concurrency & Synchronization", description: "Critical sections, mutexes, semaphores, and classical synchronization problems.", difficulty: "medium" },
      { name: "Deadlock Detection & Prevention", description: "Banker's algorithm, resource allocation graphs, and recovery strategies.", difficulty: "medium" },
      { name: "Virtual Memory Management", description: "Paging, segmentation, TLBs, and page replacement policies.", difficulty: "hard" },
    ];
  }

  // Generate 4 diagnostic practice questions for EACH concept (ranked easy to hard)
  const questions: DagSynthesisOutput["questions"] = [];

  for (const c of concepts) {
    // 1. Easy: Foundational definition & core objective
    questions.push({
      conceptName: c.name,
      questionText: `What is the primary objective of "${c.name}" within ${title}?`,
      options: [
        { key: "A" as const, text: c.description },
        { key: "B" as const, text: `To bypass standard safety constraints in ${title}.` },
        { key: "C" as const, text: "To eliminate the need for algorithmic evaluation entirely." },
        { key: "D" as const, text: "A legacy formatting convention without computational effect." },
      ],
      correctAnswer: "A" as const,
      explanation: `By definition, ${c.name} is designed to: ${c.description}`,
      difficulty: "easy" as const,
    });

    // 2. Easy / Medium: Mechanism & terminology
    questions.push({
      conceptName: c.name,
      questionText: `Which of the following statements accurately characterizes the mechanism of "${c.name}"?`,
      options: [
        { key: "A" as const, text: `It operates systematically on core data structures and parameters defined for ${title}.` },
        { key: "B" as const, text: "It executes exclusively on physical hardware layers without software intervention." },
        { key: "C" as const, text: "It guarantees constant-time O(1) performance under any non-deterministic input." },
        { key: "D" as const, text: "It requires external cloud connectivity to perform fundamental logic." },
      ],
      correctAnswer: "A" as const,
      explanation: `The operational mechanism of ${c.name} relies on systematic transformations of structured parameters within ${title}.`,
      difficulty: "easy" as const,
    });

    // 3. Medium: Application, invariant rules, and trade-offs
    questions.push({
      conceptName: c.name,
      questionText: `When applying "${c.name}" in practical engineering systems, which trade-off or constraint must be considered?`,
      options: [
        { key: "A" as const, text: "Balancing computational overhead against solution precision or latency." },
        { key: "B" as const, text: "It can only be computed if the input domain contains no negative values." },
        { key: "C" as const, text: "It completely prevents any runtime exceptions across the entire architecture." },
        { key: "D" as const, text: "It requires infinite memory allocation to achieve convergence." },
      ],
      correctAnswer: "A" as const,
      explanation: `Practical deployment of ${c.name} fundamentally involves balancing time/space complexity against accuracy constraints.`,
      difficulty: "medium" as const,
    });

    // 4. Hard: Edge cases, failure modes, and deep analysis
    questions.push({
      conceptName: c.name,
      questionText: `Under which edge condition will a system relying on "${c.name}" encounter severe performance degradation or failure?`,
      options: [
        { key: "A" as const, text: "When input assumptions, scale bounds, or dependency guarantees are violated." },
        { key: "B" as const, text: "Whenever compiled with modern optimizing compilers." },
        { key: "C" as const, text: "When executed concurrently on symmetric multiprocessing architectures." },
        { key: "D" as const, text: "Whenever input data is sorted in non-decreasing order." },
      ],
      correctAnswer: "A" as const,
      explanation: `Algorithms implementing ${c.name} rely on invariant input guarantees; violating domain constraints causes degeneration or pathological states.`,
      difficulty: "hard" as const,
    });
  }

  return {
    courseTitle: title,
    courseSubject: "Computer Science",
    concepts,
    edges: [
      { prerequisiteName: concepts[0].name, conceptName: concepts[1].name, weight: 1.0 },
      { prerequisiteName: concepts[1].name, conceptName: concepts[2].name, weight: 1.0 },
      { prerequisiteName: concepts[2].name, conceptName: concepts[3].name, weight: 0.8 },
    ],
    questions,
  };
}

/**
 * Convert free-form topic/syllabus text into a validated, cycle-free
 * prerequisite DAG ready for persistence.
 *
 * Ensures the generated course title represents a formal academic subject name
 * and generates 4-5 diagnostic practice questions ranked easy to hard for each concept.
 */
export async function synthesizeDag(
  topicText: string,
  courseTitle?: string
): Promise<DagSynthesisOutput & { isAiGenerated: boolean }> {
  const raw = await callGeminiRaw(buildDagSynthesisPrompt(topicText, courseTitle), 0.4, 6000);
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
