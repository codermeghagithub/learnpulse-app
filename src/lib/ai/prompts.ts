/**
 * prompts.ts — Gemini prompt construction
 *
 * RULES:
 * - Each function builds ONE specific prompt string — no side effects.
 * - Keep prompts focused; Gemini should ONLY return the requested JSON.
 * - Fallback prompts are shorter/simpler versions for retry calls.
 */

import { type DiagnosisInput } from "./schemas";

// ─── Diagnosis Prompts ────────────────────────────────────────────────────────

export function buildDiagnosisPrompt(input: DiagnosisInput): string {
  const prereqLines = input.prerequisites
    .map(
      (p) =>
        `- ${p.concept}: mastery=${p.mastery.toFixed(0)}%, root cause score=${p.rootCauseScore.toFixed(2)}`
    )
    .join("\n");

  const mistakesLines =
    input.recentMistakes.length > 0
      ? input.recentMistakes.map((m) => `- ${m}`).join("\n")
      : "- No specific mistakes recorded";

  return `You are a learning diagnostics AI. A student is struggling with "${input.targetConcept}" (mastery: ${input.targetMastery.toFixed(0)}%).

Their prerequisite concepts and mastery levels are:
${prereqLines}

Recent mistakes they made:
${mistakesLines}

Analyze the data and identify the most likely root cause of their struggle. The root cause is almost always a weak prerequisite, not the target concept itself.

Respond with ONLY a JSON object in this exact format (no markdown, no extra text):
{
  "rootCause": "One concise sentence identifying the core issue",
  "blockingConcept": "Name of the prerequisite concept that is blocking progress",
  "confidence": 0.85,
  "explanation": "Two to three sentences explaining why this specific concept is the blocker and how it connects to the target concept",
  "actionPlan": [
    {
      "title": "Step title",
      "description": "Clear, actionable description of this recovery step",
      "estimatedMinutes": 15
    }
  ]
}

Rules:
- confidence must be a decimal between 0 and 1
- actionPlan must have 3-5 items
- estimatedMinutes must be realistic (10-45 per step)
- blockingConcept must be one of the prerequisite concept names listed above
- Keep explanations grounded in the specific data provided`;
}

export function buildFallbackPrompt(input: DiagnosisInput): string {
  const topPrereq = input.prerequisites[0];
  const blockingName = topPrereq?.concept ?? input.targetConcept;
  const blockingMastery = topPrereq?.mastery ?? input.targetMastery;

  return `Diagnose a student struggling with "${input.targetConcept}" (mastery: ${input.targetMastery.toFixed(0)}%). Their weakest prerequisite is "${blockingName}" (mastery: ${blockingMastery.toFixed(0)}%).

Respond ONLY with this JSON (no markdown):
{"rootCause":"Student has insufficient mastery of ${blockingName} which is needed to understand ${input.targetConcept}","blockingConcept":"${blockingName}","confidence":0.7,"explanation":"Strengthening ${blockingName} foundational knowledge will directly improve understanding of ${input.targetConcept}.","actionPlan":[{"title":"Review ${blockingName} basics","description":"Go through the core concepts of ${blockingName} and practice fundamental examples.","estimatedMinutes":20},{"title":"Practice ${blockingName} problems","description":"Complete at least 5 practice problems focused on ${blockingName} before returning to ${input.targetConcept}.","estimatedMinutes":30},{"title":"Re-attempt ${input.targetConcept}","description":"With improved ${blockingName} skills, attempt ${input.targetConcept} problems again.","estimatedMinutes":20}]}`;
}

// ─── Misconception + Cognitive Dissonance Prompt ──────────────────────────────

/**
 * Builds the "Mental Mirror" prompt.
 *
 * If the student provided an optional reasoning note (why they thought
 * their answer was right), Gemini uses that to make the cognitive
 * dissonance counter-example extremely targeted.
 */
export function buildMisconceptionPrompt({
  questionText,
  selectedOptionText,
  correctOptionText,
  conceptName,
  studentReasoning,
}: {
  questionText: string;
  selectedOptionText: string;
  correctOptionText: string;
  conceptName: string;
  studentReasoning?: string;
}): string {
  const reasoningSection = studentReasoning?.trim()
    ? `\nThe student explained their reasoning as: "${studentReasoning.trim()}"\nUse this specific reasoning to make your diagnosis extremely targeted.\n`
    : "";

  return `You are a cognitive learning scientist specializing in educational psychology, systems engineering, and diagnostic feedback.
A student answered a practice question in the concept "${conceptName}".
Question: "${questionText}"

Correct Answer: "${correctOptionText}"
The student mistakenly selected this distractor option: "${selectedOptionText}"
${reasoningSection}
Your goal is to deconstruct this misconception in DUAL LANGUAGES (English and Hindi/Hinglish for NEP 2020 mother-tongue reinforcement):

1. English Version ("en"):
   - "thoughtTrap": In 1-2 clear, compassionate sentences, explain WHY their brain fell for that specific choice. Start with "You likely selected this because..."
   - "mentalAnchor": In 1 punchy, memorable sentence, give a contrast rule-of-thumb or analogy starting with "Rule of thumb: ...".
   - "cognitiveDissonance": Deliver a CONCRETE counter-example — a 2-sentence mini-paradox ("paradoxScenario") where the student's wrong assumption visibly breaks down, followed by a targeted reflection question ("counterQuestion").

2. Hindi/Hinglish Version ("hi"):
   - "thoughtTrap": Same cognitive diagnosis in natural, accessible Hindi / Hinglish starting with "आपने संभवतः यह विकल्प इसलिए चुना क्योंकि...".
   - "mentalAnchor": Punchy contrast rule-of-thumb in Hindi starting with "याद रखें: ...".
   - "cognitiveDissonance": The counter-example scenario ("paradoxScenario") and counter-question ("counterQuestion") translated into clear Hindi / Hinglish.

Respond with ONLY a JSON object in this exact format (no markdown, no backticks, no extra text):
{
  "thoughtTrap": "You likely selected this because...",
  "mentalAnchor": "Rule of thumb: X does A, while Y does B.",
  "vernacularAnchor": "याद रखें: X A करता है, जबकि Y B संभालता है।",
  "cognitiveDissonance": {
    "paradoxScenario": "Imagine you apply your assumption here: [specific 2-sentence scenario].",
    "counterQuestion": "If your assumption held, what would happen when [targeted question]?"
  },
  "en": {
    "thoughtTrap": "You likely selected this because...",
    "mentalAnchor": "Rule of thumb: X does A, while Y does B.",
    "cognitiveDissonance": {
      "paradoxScenario": "Imagine you apply your assumption here: [specific 2-sentence scenario].",
      "counterQuestion": "If your assumption held, what would happen when [targeted question]?"
    }
  },
  "hi": {
    "thoughtTrap": "आपने संभवतः यह विकल्प इसलिए चुना क्योंकि...",
    "mentalAnchor": "याद रखें: X A करता है, जबकि Y B संभालता है।",
    "cognitiveDissonance": {
      "paradoxScenario": "कल्पना करें कि यदि आप अपने अनुमान को यहाँ लागू करते हैं: [विशिष्ट परिदृश्य]。",
      "counterQuestion": "यदि आपकी धारणा सही होती, तो [लक्षित प्रश्न]?"
    }
  }
}
`;
}

// ─── Concept Bite Prompt ──────────────────────────────────────────────────────

/**
 * Builds a prompt for a bilingual 60-Second Concept Bite (English + Hindi/Hinglish)
 * with a pool of challenging, tricky real-world scenario questions.
 */
export function buildConceptBitePrompt(conceptName: string, description?: string): string {
  return `You are a world-class STEM educator, senior systems architect, and cognitive psychologist.
Create an advanced bilingual "60-Second Concept Bite" for Indian engineering students (NEP 2020 aligned) to master the concept: "${conceptName}".
${description ? `Context: "${description}"` : ""}

CRITICAL REQUIREMENTS:
1. "en" (English Version):
   - "intuition": 2 vivid sentences explaining WHY this concept exists in real production systems and what architectural or engineering pain point it solves.
   - "analogy": A relatable physical real-world metaphor (e.g., postal hub sorting, flight altitude separation, library indexing).
   - "anchor": A memorable 1-sentence rule-of-thumb starting with "Remember: ...".
   - "quickCheck": A VERY TRICKY, conceptual real-world scenario question that challenges students on subtle failure modes or trade-offs.

2. "hi" (Hindi / Hinglish Version for NEP 2020 mother-tongue reinforcement):
   - "intuition": 2 natural, clear sentences in Hindi / Hinglish explaining the core idea.
   - "analogy": Relatable physical metaphor in Hindi / Hinglish.
   - "anchor": Memorable 1-sentence rule-of-thumb starting with "याद रखें: ...".
   - "quickCheck": The tricky scenario question translated into clear, natural Hindi / Hinglish.

3. "challengePool": Exactly 2 or 3 TRICKY, conceptual questions testing real-world engineering edge cases (not rote definitions):
   - Each item must have "en" and "hi" versions with:
     - "question": Concrete failure scenario or counter-intuitive dilemma.
     - "options": 3 options with "key" ("A", "B", "C") and "text".
     - "correctAnswer": "A", "B", or "C".
     - "explanation": 1-2 sentences explaining why this option is correct and exposing the common misconception.

Respond with ONLY a JSON object in this exact format (no markdown, no backticks, no extra text):
{
  "conceptName": "${conceptName}",
  "intuition": "...",
  "analogy": "...",
  "anchorEn": "Remember: ...",
  "anchorHi": "याद रखें: ...",
  "vernacularAnchor": "याद रखें: ...",
  "en": {
    "intuition": "...",
    "analogy": "...",
    "anchor": "Remember: ...",
    "quickCheck": {
      "question": "...",
      "options": [{ "key": "A", "text": "..." }, { "key": "B", "text": "..." }, { "key": "C", "text": "..." }],
      "correctAnswer": "A",
      "explanation": "..."
    }
  },
  "hi": {
    "intuition": "...",
    "analogy": "...",
    "anchor": "याद रखें: ...",
    "quickCheck": {
      "question": "...",
      "options": [{ "key": "A", "text": "..." }, { "key": "B", "text": "..." }, { "key": "C", "text": "..." }],
      "correctAnswer": "A",
      "explanation": "..."
    }
  },
  "quickCheck": {
    "question": "...",
    "options": [{ "key": "A", "text": "..." }, { "key": "B", "text": "..." }, { "key": "C", "text": "..." }],
    "correctAnswer": "A",
    "explanation": "..."
  },
  "challengePool": [
    {
      "en": {
        "question": "...",
        "options": [{ "key": "A", "text": "..." }, { "key": "B", "text": "..." }, { "key": "C", "text": "..." }],
        "correctAnswer": "A",
        "explanation": "..."
      },
      "hi": {
        "question": "...",
        "options": [{ "key": "A", "text": "..." }, { "key": "B", "text": "..." }, { "key": "C", "text": "..." }],
        "correctAnswer": "A",
        "explanation": "..."
      }
    }
  ]
}`;
}


// ─── DAG Synthesis Prompt ─────────────────────────────────────────────────────

/**
 * Converts course title or syllabus text into an atomic concept list
 * and prerequisite dependency graph.
 *
 * Ensures courseTitle is always an overarching academic subject name
 * (e.g., "Artificial Intelligence", "Data Mining and Warehousing", "Operating Systems")
 * and not a specific sub-topic/concept.
 */
export function buildDagSynthesisPrompt(topicText: string, courseTitle?: string): string {
  const courseContext = courseTitle?.trim()
    ? `The target course/subject name is explicitly specified as: "${courseTitle.trim()}". Use this exact course name for "courseTitle".\n`
    : "";

  return `You are an expert academic curriculum designer and knowledge graph architect for university computer science and higher education.
${courseContext}A teacher has provided the following course details, syllabus, or topic text:

"""
${topicText}
"""

Your job:
1. ACADEMIC COURSE / SUBJECT NAME ("courseTitle"):
   - Must be the formal, overarching academic course/subject name (e.g. "Artificial Intelligence", "Data Mining and Warehousing", "Operating Systems", "Database Management Systems", "Computer Networks", "Software Engineering").
   - NEVER use a narrow concept, single algorithm, or chapter name as the courseTitle (e.g. NEVER name the course "OS Deadlocks", "Database Normalization", "TCP/IP", or "Banker's Algorithm").
   - If the teacher input mentions a specific topic or module, map it to its standard overarching university subject name (e.g. Deadlocks -> "Operating Systems", Normalization -> "Database Management Systems", Minimax -> "Artificial Intelligence", OLAP -> "Data Mining and Warehousing").
2. "courseSubject": The broader department or academic discipline (e.g. "Computer Science & Engineering", "Information Technology", "Data Science").
3. Extract 4 to 10 ATOMIC, fundamental curriculum concepts that belong to this subject. Each concept should be a clear, modular unit of knowledge.
4. Infer prerequisite dependencies between the concepts. A prerequisite edge means: a student MUST understand concept A before they can meaningfully learn concept B.
5. Assign a weight (0.5 to 1.0) to each edge: 1.0 = strong direct prerequisite, 0.5 = recommended prerequisite.
6. Ensure the graph has NO cycles (it must be a valid DAG).
7. PRACTICE QUESTIONS (CRITICAL): Generate 4 to 5 diagnostic multiple-choice questions (MCQs) for EACH concept, graded and ordered by difficulty ranking from "easy" to "medium" to "hard" (e.g. 1-2 easy foundational questions, 2 medium application questions, 1 hard problem-solving question per concept). Each question must have 4 options (keys: A, B, C, D), a single correctAnswer key, an explanation of why the correct answer is right and why distractors fail, and the difficulty ("easy" | "medium" | "hard").

Respond with ONLY a JSON object in this exact format (no markdown, no extra text):
{
  "courseTitle": "Formal Course Name (e.g. Artificial Intelligence, Data Mining and Warehousing)",
  "courseSubject": "Academic Discipline (e.g. Computer Science & Engineering)",
  "concepts": [
    {
      "name": "Concept Name",
      "description": "One clear sentence describing what this concept covers.",
      "difficulty": "easy" | "medium" | "hard"
    }
  ],
  "edges": [
    {
      "prerequisiteName": "Name of the prerequisite concept (must match a concept name exactly)",
      "conceptName": "Name of the dependent concept (must match a concept name exactly)",
      "weight": 1.0
    }
  ],
  "questions": [
    {
      "conceptName": "Concept Name (must match a concept name exactly)",
      "questionText": "Clear, diagnostic MCQ question prompt",
      "options": [
        { "key": "A", "text": "First option" },
        { "key": "B", "text": "Second option" },
        { "key": "C", "text": "Third option" },
        { "key": "D", "text": "Fourth option" }
      ],
      "correctAnswer": "A",
      "explanation": "Why the correct answer is right and distractor misconceptions.",
      "difficulty": "easy" | "medium" | "hard"
    }
  ]
}

Rules:
- "courseTitle" must be the overarching subject name, never a concept or chapter.
- concept names must be unique.
- all edge names and question conceptNames MUST exactly match concept names in the concepts array.
- For EACH concept in concepts, generate 4 to 5 questions ordered from easy to hard.
- the graph must have no cycles.
- difficulty must be one of: easy, medium, hard.`;
}

