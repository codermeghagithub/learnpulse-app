// EWMA-based mastery scoring with coverage and accuracy bonuses

export type Difficulty = "easy" | "medium" | "hard";

const ALPHA = 0.2;

const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
  easy: 0.8,
  medium: 1.0,
  hard: 1.2,
};

// Updates student mastery after an attempt using EWMA: new = α * value + (1 - α) * prev
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

// Replays an ordered list of attempts to compute cumulative mastery
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

// Computes mastery scaled by question coverage (80%) and attempt accuracy (20%)
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
