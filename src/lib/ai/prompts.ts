/**
 * prompts.ts — Gemini prompt construction
 *
 * buildDiagnosisPrompt: Full detailed prompt for primary call
 * buildFallbackPrompt: Condensed prompt for retry on primary failure
 */

import { type DiagnosisInput } from "./schemas";

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

export function buildMisconceptionPrompt({
  questionText,
  selectedOptionText,
  correctOptionText,
  conceptName,
}: {
  questionText: string;
  selectedOptionText: string;
  correctOptionText: string;
  conceptName: string;
}): string {
  return `You are a cognitive learning scientist specializing in educational psychology and diagnostic feedback.
A student answered a practice question in the concept "${conceptName}".
Question: "${questionText}"

Correct Answer: "${correctOptionText}"
The student mistakenly selected this distractor option: "${selectedOptionText}"

Your goal is to reverse-engineer why their brain fell for that specific choice:
1. "thoughtTrap": In 1-2 clear, compassionate sentences, explain why a student naturally makes this mistake (the mental confusion, false association, or definition mix-up). Address the student directly: "You likely selected this because..."
2. "mentalAnchor": In 1 punchy, memorable sentence, provide a quick rule of thumb, analogy, or contrast formula that will stick in their memory so they never confuse this again.

Respond with ONLY a JSON object in this exact format (no markdown, no extra text):
{
  "thoughtTrap": "You likely selected this because...",
  "mentalAnchor": "Rule of thumb: X does A, while Y does B."
}`;
}
