/**
 * mastery.ts — EWMA-based mastery score computation
 *
 * Formula: new_score = alpha * correct_value + (1 - alpha) * previous_score
 * alpha = 0.2 (learning rate)
 * correct_value = 100 * difficulty_multiplier if correct, 0 if wrong
 * difficulty_multiplier: easy = 0.8, medium = 1.0, hard = 1.2
 * Result clamped to [0, 100]
 */

export type Difficulty = "easy" | "medium" | "hard";

const ALPHA = 0.2;

const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
  easy: 0.8,
  medium: 1.0,
  hard: 1.2,
};

/**
 * Compute the new mastery score after a single attempt.
 *
 * @param previous - Previous mastery score [0, 100]
 * @param isCorrect - Whether the answer was correct
 * @param difficulty - Question difficulty
 * @returns New mastery score clamped to [0, 100]
 */
export function updateMastery(
  previous: number,
  isCorrect: boolean,
  difficulty: Difficulty
): number {
  const multiplier = DIFFICULTY_MULTIPLIER[difficulty];
  const correctValue = isCorrect ? 100 * multiplier : 0;
  const newScore = ALPHA * correctValue + (1 - ALPHA) * previous;
  return Math.max(0, Math.min(100, newScore));
}

/**
 * Compute mastery score from scratch given a full list of attempts.
 * Used in the seed script and for verification.
 *
 * @param attempts - Ordered list of {isCorrect, difficulty} records
 * @returns Final mastery score
 */
export function computeMasteryFromAttempts(
  attempts: Array<{ isCorrect: boolean; difficulty: Difficulty }>
): number {
  let score = 0;
  for (const attempt of attempts) {
    score = updateMastery(score, attempt.isCorrect, attempt.difficulty);
  }
  return score;
}

export interface ScaledMasteryParams {
  totalConceptQuestions: number;
  uniqueQuestionsCorrect: number;
  totalAttempts: number;
  totalCorrect: number;
}

/**
 * Compute scaled mastery based on completing all available questions in a concept.
 *
 * - If a concept has 1 question and it is answered correctly: 100%
 * - If a concept has 2 questions and both answered correctly: 100% (1/2 gives 50%)
 * - If a student makes mistakes along the way, accuracy gently modifies the bonus:
 *   Base coverage = 80 points * (uniqueCorrect / totalQuestions)
 *   Accuracy bonus = 20 points * (uniqueCorrect / totalQuestions) * (totalCorrect / totalAttempts)
 *   Sum is clamped to [0, 100].
 */
export function computeScaledMastery({
  totalConceptQuestions,
  uniqueQuestionsCorrect,
  totalAttempts,
  totalCorrect,
}: ScaledMasteryParams): number {
  if (totalConceptQuestions <= 0 || uniqueQuestionsCorrect <= 0 || totalAttempts <= 0) {
    return 0;
  }

  const coverage = Math.min(1, Math.max(0, uniqueQuestionsCorrect / totalConceptQuestions));
  const accuracy = Math.min(1, Math.max(0, totalCorrect / totalAttempts));

  const basePoints = 80 * coverage;
  const accuracyBonus = 20 * coverage * accuracy;

  const finalScore = Math.round(basePoints + accuracyBonus);
  return Math.max(0, Math.min(100, finalScore));
}
