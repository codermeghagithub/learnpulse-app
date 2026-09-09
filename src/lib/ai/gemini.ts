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
  conceptBiteSchema,
  type DiagnosisInput,
  type DiagnosisOutput,
  type MisconceptionOutput,
  type DagSynthesisOutput,
  type ConceptBiteOutput,
  type BilingualChallenge,
} from "./schemas";
import {
  buildDiagnosisPrompt,
  buildFallbackPrompt,
  buildMisconceptionPrompt,
  buildDagSynthesisPrompt,
  buildConceptBitePrompt,
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
    vernacularAnchor: `याद रखें: ${input.conceptName} में दोनों options के काम अलग हैं — हमेशा देखें कि कौन काम शुरू करता है और कौन प्रोसेस करता है।`,
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

// ─── Concept Bite Remediation ─────────────────────────────────────────────────

/**
 * Fallback concept bite when Gemini is unavailable, containing bilingual
 * content and a pool of challenging, tricky real-world conceptual scenario questions.
 */
export function buildDeterministicConceptBiteFallback(
  conceptName: string,
  description?: string,
  preferredIndex?: number
): ConceptBiteOutput {
  const lower = (conceptName + " " + (description ?? "")).toLowerCase();

  // 1. Computer Networks / Routing Algorithms / Protocols
  if (
    lower.includes("rout") ||
    lower.includes("network") ||
    lower.includes("packet") ||
    lower.includes("dijkstra") ||
    lower.includes("distance vector") ||
    lower.includes("bgp") ||
    lower.includes("ospf") ||
    lower.includes("ip ") ||
    lower.includes("subnet")
  ) {
    const anchorEn =
      "Remember: Routing Algorithms act as the distributed GPS of the internet, dynamically calculating the optimal hop-by-hop detour around congested or severed links.";
    const anchorHi =
      "याद रखें: Routing Algorithms इंटरनेट का स्मार्ट GPS हैं — जो जाम या टूटे रास्तों के बावजूद डेटा को सबसे सुरक्षित और छोटे रास्ते से पहुँचाते हैं।";

    const intuitionEn =
      "When you stream video or send data, packets traverse dozens of independent networks. Routing algorithms dynamically calculate the optimal next-hop router so data reaches its destination even when links congest or hardware fails.";
    const intuitionHi =
      "जब आप इंटरनेट पर डेटा भेजते हैं, तो वह कई अलग-अलग नेटवर्क्स से होकर गुजरता है। रूटिंग एल्गोरिदम लगातार यह तय करते हैं कि अगला सबसे तेज़ कदम (hop) कौन सा होगा ताकि केबल कटने या ट्रैफिक जाम पर भी डेटा सुरक्षित पहुंचे।";

    const analogyEn =
      "Like a live GPS navigation app (Waze/Google Maps): when an accident blocks an expressway, it dynamically re-routes thousands of cars through parallel avenues before gridlock freezes the city.";
    const analogyHi =
      "जैसे गूगल मैप्स या एक समझदार ट्रैफिक पुलिस: अगर आगे मुख्य सड़क पर जाम है, तो वह तुरंत गाड़ियों को समानांतर गलियों से मोड़ देता है ताकि शहर में चक्का जाम न हो।";

    const challengePool: BilingualChallenge[] = [
      {
        en: {
          question:
            "An ISP configures routing metrics where link cost equals real-time traffic volume. Link A gets busy, so routers switch traffic to Link B. Link B instantly saturates while Link A becomes empty, causing all routers to switch back to Link A every 3 seconds ('route flapping'). Why does classic shortest-path routing fail under load-sensitive metrics?",
          options: [
            {
              key: "A",
              text: "All routers independently and simultaneously compute the same new path from stale global state, shifting 100% of demand at once.",
            },
            {
              key: "B",
              text: "Dijkstra's algorithm is mathematically incapable of running on graphs with cycles.",
            },
            {
              key: "C",
              text: "Network cables physically throttle throughput when routing tables update frequently.",
            },
          ],
          correctAnswer: "A",
          explanation:
            "When cost depends on load, moving traffic shifts the cost, making the 'shortest' path immediately the worst path. Real systems use damping hysteresis or multipath (ECMP) to prevent oscillation.",
        },
        hi: {
          question:
            "एक ISP ने नियम बनाया जहाँ लिंक की कॉस्ट उसके वर्तमान ट्रैफिक लोड के बराबर है। जैसे ही लिंक A भरता है, सभी राऊटर सारा ट्रैफिक लिंक B पर भेज देते हैं। फिर लिंक B भर जाता है और A खाली हो जाता है, और यह चक्र हर 3 सेकंड में दोहराता रहता है ('रूट फ्लैपिंग')। लोड-आधारित मीट्रिक पर शॉर्टेस्ट पाथ रूटिंग क्यों विफल होती है?",
          options: [
            {
              key: "A",
              text: "सभी राऊटर एक साथ पुराने डेटा के आधार पर वही नया रास्ता चुन लेते हैं, जिससे सारा ट्रैफिक एक साथ दूसरी तरफ शिफ्ट हो जाता है।",
            },
            {
              key: "B",
              text: "डायक्स्ट्रा एल्गोरिदम लूप वाले नेटवर्क को हल करने में असमर्थ है।",
            },
            {
              key: "C",
              text: "राऊटर की मेमोरी भर जाने से केबल की गति धीमी हो जाती है।",
            },
          ],
          correctAnswer: "A",
          explanation:
            "जब कॉस्ट लोड पर निर्भर होती है, तो ट्रैफिक बदलने से कॉस्ट भी बदल जाती है। असली इंटरनेट में इसके लिए हिस्टेरेसिस (hysteresis) या ECMP का उपयोग किया जाता है।",
        },
      },
      {
        en: {
          question:
            "In a Distance-Vector network, Link A-B suddenly fails. Node B updates distance to A as ∞. But neighbor C previously learned a route to A via B with cost 2, and advertises this back to B. B now mistakenly thinks it can reach A via C with cost 3. Why does 'Split Horizon with Poison Reverse' fail to prevent count-to-infinity in 3-node ring loops?",
          options: [
            {
              key: "A",
              text: "Poison reverse only suppresses routes to the immediate predecessor, but cannot detect cyclic loops involving 3 or more nodes.",
            },
            {
              key: "B",
              text: "Routers drop all packets once the TTL hop count exceeds 15.",
            },
            {
              key: "C",
              text: "Link State advertisements override Distance Vector distance metrics.",
            },
          ],
          correctAnswer: "A",
          explanation:
            "Split horizon only hides routes from the 1-hop neighbor it learned them from. In a triangle (A-B-C-A), routing misinformation circulates around the third node unhindered.",
        },
        hi: {
          question:
            "डिस्टेंस-वेक्टर नेटवर्क में लिंक A-B कट जाता है। B दूरी को ∞ मान लेता है। लेकिन पड़ोसी C अभी भी B को बताता है कि वह B के ज़रिए 2 स्टेप में A तक पहुँच सकता है। B अब सोचता है कि वह C के ज़रिए 3 स्टेप में पहुँच जाएगा। 3 नोड्स वाले रिंग लूप में 'स्प्लिट होराइजन' काउंट-टू-इन्फिनिटी को क्यों नहीं रोक पाता?",
          options: [
            {
              key: "A",
              text: "स्प्लिट होराइजन सिर्फ सीधे 1-कदम पड़ोसी से छुपाता है, लेकिन 3 नोड्स के चक्रीय लूप में सूचना घूमकर वापस आ जाती है।",
            },
            {
              key: "B",
              text: "हॉप काउंट 15 से ऊपर जाते ही सभी पैकेट स्वतः नष्ट हो जाते हैं।",
            },
            {
              key: "C",
              text: "लिंक स्टेट विज्ञापन डिस्टेंस वेक्टर तालिकाओं को मिटा देते हैं।",
            },
          ],
          correctAnswer: "A",
          explanation:
            "स्प्लिट होराइजन केवल सीधे पूर्ववर्ती को विज्ञापन देने से रोकता है; त्रिकोणीय लूप में जानकारी तीसरे नोड से घूमकर आ जाती है।",
        },
      },
      {
        en: {
          question:
            "A transit provider (AS-1) receives a packet destined for a customer in AS-2. AS-1 routes the packet out of its network at the closest possible peering exchange ('hot-potato routing'), even though carrying it across its own private backbone would reduce customer latency by 40ms. Why do autonomous systems do this?",
          options: [
            {
              key: "A",
              text: "To minimize internal transit backbone utilization and infrastructure operating expenses.",
            },
            {
              key: "B",
              text: "Because BGP RFC specifications strictly forbid carrying transit traffic across more than one internal router.",
            },
            {
              key: "C",
              text: "Because routers lack the CPU capability to calculate latency across autonomous system boundaries.",
            },
          ],
          correctAnswer: "A",
          explanation:
            "Inter-domain routing prioritizes business policy and internal cost minimization: autonomous systems eject transit traffic as early as possible to minimize their own carrying costs.",
        },
        hi: {
          question:
            "इंटरनेट ट्रांजिट नेटवर्क (AS-1) के पास एक पैकेट आता है जिसे AS-2 के ग्राहक तक जाना है। AS-1 उस पैकेट को सबसे नजदीकी गेटवे से ही AS-2 को सौंप देता है ('हॉट पोटैटो रूटिंग'), भले ही AS-1 के अपने सुपरफास्ट बैकबोन से ले जाने पर 40ms कम लेटेंसी मिलती। AS-1 ऐसा क्यों करता है?",
          options: [
            {
              key: "A",
              text: "अपने नेटवर्क के संसाधनों और वित्तीय लागत को बचाने के लिए, ताकि ट्रैफिक ढोने का खर्च दूसरे नेटवर्क पर चला जाए।",
            },
            {
              key: "B",
              text: "क्योंकि BGP प्रोटोकॉल दो से ज्यादा अंदरूनी राऊटर से गुजरने की अनुमति नहीं देता।",
            },
            {
              key: "C",
              text: "क्योंकि राऊटर में लेटेंसी नापने की क्षमता नहीं होती।",
            },
          ],
          correctAnswer: "A",
          explanation:
            "इंटर-डोमेन रूटिंग यूजर की लेटेंसी से ज्यादा व्यावसायिक लागत और पॉलिसी को प्राथमिकता देती है — ISP ट्रैफिक को तुरंत अपने नेटवर्क से बाहर निकालना चाहते हैं।",
        },
      },
      {
        en: {
          question:
            "A regional ISP accidentally advertises a /24 route for an IP block owned by a cloud provider announcing a /16 prefix. Why does global internet traffic for that /24 subnet instantly redirect to the rogue ISP, causing a black hole?",
          options: [
            {
              key: "A",
              text: "Routers strictly evaluate destination IP addresses using Longest Prefix Match before evaluating AS-path or route cost.",
            },
            {
              key: "B",
              text: "The /24 prefix grants automated cryptographic priority in BGP protocol.",
            },
            {
              key: "C",
              text: "Smaller subnets are always assumed to be high-priority fiber connections.",
            },
          ],
          correctAnswer: "A",
          explanation:
            "Longest Prefix Match is the inviolable rule of IP routing: the most specific subnet mask (/24 > /16) always wins, regardless of path quality or distance.",
        },
        hi: {
          question:
            "एक क्षेत्रीय ISP ने गलती से किसी अन्य कंपनी के /16 आईपी ब्लॉक में से एक छोटा /24 ब्लॉक घोषित (announce) कर दिया। सारा ग्लोबल ट्रैफिक तुरंत उस अनाधिकृत ISP पर क्यों मुड़ जाता है?",
          options: [
            {
              key: "A",
              text: "राऊटर हमेशा सबसे पहले 'लॉन्गेस्ट प्रीफिक्स मैच' (सबसे सटीक सबनेट) चुनते हैं, उसके बाद ही हॉप्स या स्पीड देखते हैं।",
            },
            {
              key: "B",
              text: "/24 सबनेट को BGP में विशेष सुरक्षा प्राथमिकता मिलती है।",
            },
            {
              key: "C",
              text: "छोटे सबनेट हमेशा तेज़ फाइबर लाइन माने जाते हैं।",
            },
          ],
          correctAnswer: "A",
          explanation:
            "आईपी रूटिंग का पहला नियम है 'लॉन्गेस्ट प्रीफिक्स मैच' — जो सबनेट जितना विशिष्ट होगा (/24 > /16), पैकेट वहीं जाएगा।",
        },
      },
    ];

    const chosenIndex =
      typeof preferredIndex === "number"
        ? Math.abs(preferredIndex) % challengePool.length
        : Math.floor(Math.random() * challengePool.length);
    const chosenChallenge = challengePool[chosenIndex];

    return {
      conceptName,
      intuition: intuitionEn,
      analogy: analogyEn,
      anchorEn,
      anchorHi,
      vernacularAnchor: anchorHi,
      quickCheck: chosenChallenge.en,
      en: {
        intuition: intuitionEn,
        analogy: analogyEn,
        anchor: anchorEn,
        quickCheck: chosenChallenge.en,
      },
      hi: {
        intuition: intuitionHi,
        analogy: analogyHi,
        anchor: anchorHi,
        quickCheck: chosenChallenge.hi,
      },
      challengePool,
    };
  }

  // 2. B-Tree & Indexing
  if (lower.includes("b-tree") || lower.includes("index")) {
    const anchorEn =
      "Remember: A B-Tree index trades write performance and disk space for O(log N) lookup speed by keeping wide, block-sized sorted nodes.";
    const anchorHi =
      "याद रखें: B-Tree इंडेक्स डिस्क ब्लॉक के आकार में डेटा रखता है, जिससे करोड़ों रिकॉर्ड्स में से खोज सिर्फ 3-4 डिस्क रीड्स में पूरी हो जाती है।";

    const intuitionEn =
      "Without an index, finding a row in a million-row database requires a Full Table Scan reading every disk block. A B-Tree index maintains sorted hierarchical blocks, shrinking lookups from O(N) to O(log N) disk reads.";
    const intuitionHi =
      "बिना इंडेक्स के लाखों रिकॉर्ड्स वाली टेबल में कोई पंक्ति खोजना पूरी किताब का हर पन्ना पढ़ने जैसा है। B-Tree इंडेक्स पेजों को एक पेड़ के रूप में व्यवस्थित रखता है ताकि 3-4 डिस्क रीड्स में उत्तर मिल जाए।";

    const analogyEn =
      "Like a thumb-tabbed dictionary: instead of reading all 50,000 pages to find 'Zebra', you jump straight to the 'Z' section tab, opening only 3 pages.";
    const analogyHi =
      "जैसे डिक्शनरी में अक्षरों के साइड-टैब: 'Zebra' ढूंढने के लिए 50,000 पन्ने पलटने के बजाय आप सीधे 'Z' वाले टैब पर अंगूठा रखते हैं।";

    const challengePool: BilingualChallenge[] = [
      {
        en: {
          question:
            "An e-commerce database switches its primary key from auto-incrementing integers to random UUIDv4. At 50 million records, insert throughput plunges by 85% and disk I/O hits 100%. What physical B-Tree behavior causes this collapse?",
          options: [
            {
              key: "A",
              text: "Random keys insert into arbitrary leaf pages across the tree, causing massive page splits and cache-eviction random writes.",
            },
            {
              key: "B",
              text: "UUID strings cannot be stored in B-Tree internal nodes.",
            },
            {
              key: "C",
              text: "B-Trees require O(N) rebalancing whenever an alphanumeric key is added.",
            },
          ],
          correctAnswer: "A",
          explanation:
            "Sequential IDs always append to the rightmost leaf page. Random UUIDs fragment pages throughout the entire tree, forcing the engine to flush and reload disk blocks constantly.",
        },
        hi: {
          question:
            "एक बड़े डेटाबेस ने अपनी प्राइमरी-की को ऑटो-इंक्रीमेंट नंबर से बदलकर रैंडम UUIDv4 कर दिया। 5 करोड़ रिकॉर्ड्स पर नया डेटा डालने की स्पीड 85% गिर गई और डिस्क I/O 100% हो गया। B-Tree की कौन सी प्रक्रिया इसकी मुख्य वजह है?",
          options: [
            {
              key: "A",
              text: "रैंडम कीज़ पूरे पेड़ में कहीं भी घुसती हैं, जिससे बार-बार पेज स्प्लिट (Page Split) और रैंडम डिस्क राइट्स होते हैं।",
            },
            {
              key: "B",
              text: "UUID स्ट्रिंग्स को B-Tree में स्टोर नहीं किया जा सकता।",
            },
            {
              key: "C",
              text: "B-Tree में अल्फान्यूमेरिक की जोड़ने पर हर बार पूरा डेटाबेस रीबैलेंस होता है।",
            },
          ],
          correctAnswer: "A",
          explanation:
            "सीक्वेंस नंबर हमेशा सबसे आखिरी पेज पर जुड़ते हैं, जबकि रैंडम UUID बीच के भरे हुए पेजों को फाड़कर (split) नए पेज बनाते हैं, जिससे भारी डिस्क I/O होता है।",
        },
      },
      {
        en: {
          question:
            "A table has a composite index on (status, created_at). A query runs: WHERE created_at > '2026-01-01' without mentioning 'status'. Why does the query planner reject the index and execute a slow Full Table Scan?",
          options: [
            {
              key: "A",
              text: "B-Trees sort composite keys lexicographically; skipping the leading column prevents binary searching the tree.",
            },
            {
              key: "B",
              text: "Date types cannot be evaluated in composite indexes.",
            },
            {
              key: "C",
              text: "Composite indexes are only valid for exact equality (=) matches.",
            },
          ],
          correctAnswer: "A",
          explanation:
            "Like a phone book sorted by (LastName, FirstName), you cannot use the index to find everyone named 'John' without knowing their last name.",
        },
        hi: {
          question:
            "एक टेबल में (status, created_at) पर कंपोजिट इंडेक्स है। क्वेरी चलती है: WHERE created_at > '2026-01-01' (बिना status बताए)। डेटाबेस इंडेक्स को छोड़कर स्लो फुल टेबल स्कैन क्यों करता है?",
          options: [
            {
              key: "A",
              text: "B-Tree कंपोजिट कीज़ को पहले कॉलम के अनुसार छांटता है; पहला कॉलम छोड़े बिना पेड़ में बाइनरी सर्च असंभव है।",
            },
            {
              key: "B",
              text: "तारीख (Date) को कंपोजिट इंडेक्स में नहीं खोजा जा सकता।",
            },
            {
              key: "C",
              text: "कंपोजिट इंडेक्स केवल सटीक बराबर (=) पर ही काम करता है।",
            },
          ],
          correctAnswer: "A",
          explanation:
            "जैसे फोन डायरेक्टरी में नाम (उपनाम, नाम) के अनुसार छपे होते हैं; अगर उपनाम न पता हो, तो 'अमित' नाम के सभी लोगों को ढूंढने के लिए पूरी डायरेक्टरी छाननी पड़ेगी।",
        },
      },
    ];

    const chosenIndex =
      typeof preferredIndex === "number"
        ? Math.abs(preferredIndex) % challengePool.length
        : Math.floor(Math.random() * challengePool.length);
    const chosenChallenge = challengePool[chosenIndex];

    return {
      conceptName,
      intuition: intuitionEn,
      analogy: analogyEn,
      anchorEn,
      anchorHi,
      vernacularAnchor: anchorHi,
      quickCheck: chosenChallenge.en,
      en: {
        intuition: intuitionEn,
        analogy: analogyEn,
        anchor: anchorEn,
        quickCheck: chosenChallenge.en,
      },
      hi: {
        intuition: intuitionHi,
        analogy: analogyHi,
        anchor: anchorHi,
        quickCheck: chosenChallenge.hi,
      },
      challengePool,
    };
  }

  // 3. Deadlock & Concurrency
  if (lower.includes("deadlock") || lower.includes("concurrency")) {
    const anchorEn =
      "Remember: Deadlocks only occur when all four Coffman conditions align — break just one (like enforcing global lock hierarchy) and deadlock is mathematically impossible.";
    const anchorHi =
      "याद रखें: Deadlock तभी होता है जब चारों Coffman शर्तें पूरी हों — सिर्फ एक शर्त (जैसे लॉकिंग का क्रम तय करना) तोड़ते ही डेडलॉक असंभव हो जाता है।";

    const intuitionEn =
      "Deadlock is a permanent freeze where two or more threads each hold a lock the other thread needs to proceed. Operating systems eliminate deadlocks by systematically dismantling circular wait hierarchies.";
    const intuitionHi =
      "डेडलॉक तब होता है जब दो या अधिक प्रोसेस एक-दूसरे के ताले (Lock) खुलने का इंतजार करते हुए हमेशा के लिए जम जाते हैं। सिस्टम सर्कुलर वेट को तोड़कर डेडलॉक को पूरी तरह रोकता है।";

    const analogyEn =
      "Two stubborn drivers meet head-on on a one-lane mountain bridge: neither can go forward, neither will back up. Both freeze indefinitely until one yields.";
    const analogyHi =
      "एक-लेन वाले संकरे पुल पर दो गाड़ियां आमने-सामने आकर रुक गईं: कोई भी पीछे हटने को तैयार नहीं है। जब तक कोई एक पीछे नहीं हटेगा, दोनों हमेशा के लिए फंसे रहेंगे।";

    const challengePool: BilingualChallenge[] = [
      {
        en: {
          question:
            "A banking system eliminates deadlocks between account transfers by enforcing global lock ordering: lock(min(acc1, acc2)) then lock(max(acc1, acc2)). Which Coffman condition is mathematically eliminated by this rule?",
          options: [
            {
              key: "A",
              text: "Circular Wait, because directed lock request cycles cannot exist in a strictly ordered directed acyclic graph.",
            },
            { key: "B", text: "Mutual Exclusion, because locks can now be shared." },
            { key: "C", text: "No Preemption, because threads are forcibly terminated." },
          ],
          correctAnswer: "A",
          explanation:
            "By enforcing strict ascending resource acquisition, no circular wait chain (A waiting for B waiting for A) can ever form.",
        },
        hi: {
          question:
            "एक बैंक खाता ट्रांसफर में डेडलॉक रोकने के लिए नियम बनाता है: हमेशा छोटे खाता नंबर को पहले लॉक करो, फिर बड़े को: lock(min(A, B)) फिर lock(max(A, B))। यह नियम किस Coffman शर्त को पूरी तरह खत्म करता है?",
          options: [
            {
              key: "A",
              text: "सर्कुलर वेट (Circular Wait), क्योंकि सख्त बढ़ते क्रम में कभी गोल घेरे का लूप नहीं बन सकता।",
            },
            { key: "B", text: "म्यूचुअल एक्सक्लूजन, क्योंकि अब ताले साझा हो जाते हैं।" },
            { key: "C", text: "नो प्रीएम्प्शन, क्योंकि प्रोसेस को जबरन रोका जाता है।" },
          ],
          correctAnswer: "A",
          explanation:
            "नंबर के बढ़ते क्रम में संसाधन मांगने से सर्कुलर वेट की संभावना गणितीय रूप से शून्य हो जाती है।",
        },
      },
      {
        en: {
          question:
            "In Dijkstra's Banker's Algorithm, a state is classified as 'unsafe'. Does this mean the system is currently deadlocked?",
          options: [
            {
              key: "A",
              text: "No; an unsafe state means future requests could lead to deadlock if all processes demand their maximum declared resources simultaneously.",
            },
            {
              key: "B",
              text: "Yes; all processes are already in circular wait and must be killed.",
            },
            {
              key: "C",
              text: "Yes; the operating system kernel has run out of physical RAM.",
            },
          ],
          correctAnswer: "A",
          explanation:
            "Unsafe does not equal deadlocked: it merely means the system cannot guarantee safe completion under the worst-case maximum claim scenario.",
        },
        hi: {
          question:
            "बैंकर एल्गोरिदम में किसी स्थिति को 'असुरक्षित' (Unsafe) घोषित किया जाता है। क्या इसका मतलब यह है कि सिस्टम में वर्तमान में डेडलॉक हो चुका है?",
          options: [
            {
              key: "A",
              text: "नहीं; असुरक्षित का मतलब है कि अगर सभी प्रोसेस एक साथ अपने अधिकतम संसाधन मांग लें, तो भविष्य में डेडलॉक हो सकता है।",
            },
            {
              key: "B",
              text: "हाँ; सभी प्रोसेस सर्कुलर वेट में फंस चुके हैं।",
            },
            {
              key: "C",
              text: "हाँ; सिस्टम की रैम पूरी तरह खत्म हो गई है।",
            },
          ],
          correctAnswer: "A",
          explanation:
            "असुरक्षित स्थिति डेडलॉक नहीं होती, बल्कि यह एक चेतावनी है कि सबसे खराब स्थिति में डेडलॉक से बचने की गारंटी नहीं है।",
        },
      },
    ];

    const chosenIndex =
      typeof preferredIndex === "number"
        ? Math.abs(preferredIndex) % challengePool.length
        : Math.floor(Math.random() * challengePool.length);
    const chosenChallenge = challengePool[chosenIndex];

    return {
      conceptName,
      intuition: intuitionEn,
      analogy: analogyEn,
      anchorEn,
      anchorHi,
      vernacularAnchor: anchorHi,
      quickCheck: chosenChallenge.en,
      en: {
        intuition: intuitionEn,
        analogy: analogyEn,
        anchor: anchorEn,
        quickCheck: chosenChallenge.en,
      },
      hi: {
        intuition: intuitionHi,
        analogy: analogyHi,
        anchor: anchorHi,
        quickCheck: chosenChallenge.hi,
      },
      challengePool,
    };
  }

  // 4. CPU & Process Scheduling
  if (lower.includes("schedul") || lower.includes("process")) {
    const anchorEn =
      "Remember: CPU Scheduling balances responsiveness vs throughput — small time quantums reduce UI latency at the expense of context-switch thrashing.";
    const anchorHi =
      "याद रखें: CPU शेड्यूलर फेयरनेस और स्पीड का संतुलन है — छोटा टाइम क्वांटम यूजर को स्मूथ अनुभव देता है लेकिन बार-बार कॉन्टेक्स्ट स्विच का खर्च बढ़ाता है।";

    const intuitionEn =
      "CPU Scheduling decides which ready thread executes on hardware cores to prevent starvation, maximize CPU utilization, and guarantee responsive user interactions.";
    const intuitionHi =
      "CPU शेड्यूलर तय करता है कि तैयार प्रोसेस में से किसे प्रोसेसर कोर मिलेगा ताकि कोई काम भूखा (starve) न रहे और यूजर को बिना रुके तेज रिस्पांस मिले।";

    const analogyEn =
      "Like a hospital emergency triage nurse: cardiac arrest patients (interactive I/O tasks) are attended to ahead of routine blood test analyses (background batch tasks).";
    const analogyHi =
      "अस्पताल के इमरजेंसी वार्ड की तरह: दिल के मरीज (तत्काल यूजर इनपुट) को पहले देखा जाता है, जबकि रूटीन चेकअप (बैकग्राउंड गणना) को इंतजार कराया जाता है।";

    const challengePool: BilingualChallenge[] = [
      {
        en: {
          question:
            "Under Round Robin scheduling, what is the disastrous consequence of setting the time quantum extremely small (e.g., 5 microseconds)?",
          options: [
            {
              key: "A",
              text: "CPU efficiency collapses because the system spends most of its clock cycles saving and restoring registers (context switch overhead).",
            },
            { key: "B", text: "Interactive tasks will completely starve." },
            { key: "C", text: "The scheduling algorithm transforms into First-Come-First-Served." },
          ],
          correctAnswer: "A",
          explanation:
            "If the quantum approaches the context switch time, the CPU spends 50-80% of its time executing kernel dispatch routines rather than user instructions.",
        },
        hi: {
          question:
            "राउंड रॉबिन शेड्यूलिंग में यदि टाइम क्वांटम बहुत ही छोटा (जैसे 5 माइक्रो-सेकंड) रख दिया जाए, तो क्या गंभीर समस्या होगी?",
          options: [
            {
              key: "A",
              text: "CPU की क्षमता बर्बाद होगी क्योंकि अधिकांश समय केवल रजिस्टर सेव और रीलोड करने (कॉन्टेक्स्ट स्विच) में खर्च हो जाएगा।",
            },
            { key: "B", text: "इंटरैक्टिव काम पूरी तरह रुक जाएंगे।" },
            { key: "C", text: "यह एल्गोरिदम अपने आप FCFS में बदल जाएगा।" },
          ],
          correctAnswer: "A",
          explanation:
            "अगर क्वांटम कॉन्टेक्स्ट स्विच के बराबर हो जाए, तो CPU असली काम करने के बजाय केवल प्रोसेस बदलने में ही व्यस्त रहेगा।",
        },
      },
    ];

    const chosenIndex =
      typeof preferredIndex === "number"
        ? Math.abs(preferredIndex) % challengePool.length
        : Math.floor(Math.random() * challengePool.length);
    const chosenChallenge = challengePool[chosenIndex];

    return {
      conceptName,
      intuition: intuitionEn,
      analogy: analogyEn,
      anchorEn,
      anchorHi,
      vernacularAnchor: anchorHi,
      quickCheck: chosenChallenge.en,
      en: {
        intuition: intuitionEn,
        analogy: analogyEn,
        anchor: anchorEn,
        quickCheck: chosenChallenge.en,
      },
      hi: {
        intuition: intuitionHi,
        analogy: analogyHi,
        anchor: anchorHi,
        quickCheck: chosenChallenge.hi,
      },
      challengePool,
    };
  }

  // 5. Database Normalization
  if (lower.includes("normaliz") || lower.includes("relation")) {
    const anchorEn =
      "Remember: Normalization eliminates write anomalies by ensuring each fact lives in exactly one place; denormalization is an intentional read-speed trade-off.";
    const anchorHi =
      "याद रखें: Normalization डेटा दोहराव और विसंगति मिटाता है — हर जानकारी सिर्फ एक ही जगह दर्ज होनी चाहिए।";

    const intuitionEn =
      "Database Normalization organizes relational schemas to eliminate insert, update, and deletion anomalies by ensuring non-key attributes depend strictly on candidate keys.";
    const intuitionHi =
      "डेटाबेस नॉर्मलाइज़ेशन टेबल्स को ऐसे व्यवस्थित करता है कि एक ही जानकारी बार-बार न लिखनी पड़े, ताकि अपडेट करते समय डेटा विसंगति से बचा जा सके।";

    const analogyEn =
      "Like organizing a messy toolbox: putting wrenches, screws, and drills into dedicated labeled compartments so updating a part number doesn't miss old inventory.";
    const analogyHi =
      "जैसे अलमारी को व्यवस्थित करना: हर चीज़ की अपनी तय जगह होती है ताकि एक जगह बदलाव करने पर पूरी अलमारी में भ्रम न फैले।";

    const challengePool: BilingualChallenge[] = [
      {
        en: {
          question:
            "A schema is decomposed from 3NF into Boyce-Codd Normal Form (BCNF). What critical capability might be lost during this transition?",
          options: [
            {
              key: "A",
              text: "Dependency preservation: validating certain functional dependencies may now require expensive joins across multiple tables.",
            },
            { key: "B", text: "Lossless join decomposition is impossible in BCNF." },
            { key: "C", text: "Tables in BCNF cannot support foreign keys." },
          ],
          correctAnswer: "A",
          explanation:
            "BCNF guarantees zero redundancy from functional dependencies, but unlike 3NF, BCNF cannot always preserve all functional dependencies without cross-table joins.",
        },
        hi: {
          question:
            "एक रिलेशनल स्कीमा को 3NF से BCNF में बदला जाता है। इस प्रक्रिया में कौन सी महत्वपूर्ण क्षमता खो सकती है?",
          options: [
            {
              key: "A",
              text: "डिपेंडेंसी प्रिजर्वेशन: कुछ फंक्शनल डिपेंडेंसी को जांचने के लिए अब कई टेबल्स को जॉइन करना पड़ सकता है।",
            },
            { key: "B", text: "BCNF में लॉसलेस जॉइन असंभव हो जाता है।" },
            { key: "C", text: "BCNF टेबल्स में फॉरेन की नहीं बनाई जा सकती।" },
          ],
          correctAnswer: "A",
          explanation:
            "BCNF अतिरेक (redundancy) तो पूरी तरह मिटा देता है, लेकिन 3NF की तरह यह हमेशा सभी डिपेंडेंसी को बिना जॉइन के सुरक्षित रखने की गारंटी नहीं दे सकता।",
        },
      },
    ];

    const chosenIndex =
      typeof preferredIndex === "number"
        ? Math.abs(preferredIndex) % challengePool.length
        : Math.floor(Math.random() * challengePool.length);
    const chosenChallenge = challengePool[chosenIndex];

    return {
      conceptName,
      intuition: intuitionEn,
      analogy: analogyEn,
      anchorEn,
      anchorHi,
      vernacularAnchor: anchorHi,
      quickCheck: chosenChallenge.en,
      en: {
        intuition: intuitionEn,
        analogy: analogyEn,
        anchor: anchorEn,
        quickCheck: chosenChallenge.en,
      },
      hi: {
        intuition: intuitionHi,
        analogy: analogyHi,
        anchor: anchorHi,
        quickCheck: chosenChallenge.hi,
      },
      challengePool,
    };
  }

  // 6. Generic STEM Concept Fallback with Bilingual Structure
  const anchorEn = `Remember: ${conceptName} establishes the invariant rules that downstream systems assume to be permanently true.`;
  const anchorHi = `याद रखें: ${conceptName} एक बुनियादी नियम की तरह है — अगर यह मजबूत है तो आगे का पूरा विषय आसान हो जाएगा।`;
  const intuitionEn = description
    ? `${conceptName} solves foundational engineering challenges: ${description}. Understanding its internal contract is critical before building higher abstractions.`
    : `${conceptName} provides the structural foundation required for downstream systems. Mastering its core rules prevents subtle edge-case failures in production.`;
  const intuitionHi = description
    ? `${conceptName} महत्वपूर्ण इंजीनियरिंग समस्याओं का समाधान करता है: ${description}। आगे के विषयों को समझने से पहले इसकी बुनियादी कार्यप्रणाली को समझना अनिवार्य है।`
    : `${conceptName} उच्च-स्तरीय प्रणालियों के लिए आवश्यक नींव प्रदान करता है। इसके मुख्य नियमों को समझना सिस्टम में होने वाली अप्रत्याशित गलतियों को रोकता है।`;
  const analogyEn = `Think of ${conceptName} like the bedrock foundation pillars of a skyscraper: any hidden flaw here propagates upward and compromises the entire structure.`;
  const analogyHi = `इसे एक बहुमंजिला इमारत की नींव के खंभे की तरह समझें: यदि नींव में कोई कमजोरी रह जाए, तो ऊपर बनी पूरी इमारत अस्थिर हो जाती है।`;

  const genericChallenge: BilingualChallenge = {
    en: {
      question: `In a production system built upon ${conceptName}, an engineer observes failure under unexpected load. What is the most likely architectural root cause?`,
      options: [
        {
          key: "A",
          text: `A violation of an invariant assumption or boundary constraint guaranteed by ${conceptName}.`,
        },
        { key: "B", text: "The programming language compiler generated incorrect bytecode." },
        { key: "C", text: "Theoretical principles do not apply to real production software." },
      ],
      correctAnswer: "A",
      explanation: `Foundational concepts define the invariant contracts; edge-case failures almost always trace back to unhandled boundary conditions.`,
    },
    hi: {
      question: `${conceptName} पर आधारित एक लाइव सिस्टम में भारी लोड के दौरान विफलता देखी जाती है। इसका सबसे संभावित मूल कारण क्या है?`,
      options: [
        {
          key: "A",
          text: `${conceptName} द्वारा तय की गई सीमा शर्तों (Boundary Constraints) या बुनियादी नियमों का उल्लंघन होना।`,
        },
        { key: "B", text: "कंपाइलर ने कोड को गलत तरीके से ट्रांसलेट किया।" },
        { key: "C", text: "सैद्धांतिक नियम असल सॉफ्टवेयर में काम नहीं करते।" },
      ],
      correctAnswer: "A",
      explanation: `बुनियादी सिद्धांत ही सिस्टम के नियम तय करते हैं; सिस्टम में आने वाली गलतियाँ लगभग हमेशा अनियंत्रित सीमाओं (boundary cases) से उत्पन्न होती हैं।`,
    },
  };

  return {
    conceptName,
    intuition: intuitionEn,
    analogy: analogyEn,
    anchorEn,
    anchorHi,
    vernacularAnchor: anchorHi,
    quickCheck: genericChallenge.en,
    en: {
      intuition: intuitionEn,
      analogy: analogyEn,
      anchor: anchorEn,
      quickCheck: genericChallenge.en,
    },
    hi: {
      intuition: intuitionHi,
      analogy: analogyHi,
      anchor: anchorHi,
      quickCheck: genericChallenge.hi,
    },
    challengePool: [genericChallenge],
  };
}

/**
 * Generate a 60-Second Concept Bite (Bilingual Intuition + Analogy + Tricky Challenge Pool)
 * using Gemini 2.5 Flash, with deterministic zero-downtime fallback.
 */
export async function generateConceptBite(
  conceptName: string,
  description?: string,
  preferredIndex?: number
): Promise<ConceptBiteOutput & { isAiGenerated: boolean }> {
  try {
    const raw = await callGeminiRaw(buildConceptBitePrompt(conceptName, description), 0.3, 2000);
    const validated = raw ? conceptBiteSchema.safeParse(raw) : null;

    if (validated?.success) {
      const data = validated.data;
      // Enrich with bilingual guarantees
      const anchorEn = data.anchorEn || data.en?.anchor || "Remember: Master the core intuition.";
      const anchorHi = data.anchorHi || data.hi?.anchor || data.vernacularAnchor || "याद रखें: मूल सिद्धांत को समझें।";

      // If challengePool exists, pick a random challenge for the root quickCheck
      const pool = data.challengePool && data.challengePool.length > 0 ? data.challengePool : undefined;
      let activeChallenge = pool
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

