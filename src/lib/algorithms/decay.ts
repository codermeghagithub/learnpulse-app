// Forgetting-curve model: computes mastery retention based on time elapsed since last attempt

export const DUE_THRESHOLD = 70;
const BASE_STABILITY = 4;
const STABILITY_GAIN_PER_REP = 3;

export interface DecayInput {
  masteryScore: number;
  lastAttemptAt: Date;
  timesCorrect: number;
  totalAttempts: number;
}

export interface DecayResult {
  retentionScore: number;
  isDue: boolean;
  daysSinceReview: number;
}

// Calculate retained mastery using exponential decay: R = M * exp(-t / stability)
export function calculateRetention(input: DecayInput, now: Date): DecayResult {
  const msElapsed = now.getTime() - input.lastAttemptAt.getTime();
  const daysSinceReview = Math.max(0, msElapsed / (1000 * 60 * 60 * 24));

  // Each successful repetition extends stability
  const stability = BASE_STABILITY + input.timesCorrect * STABILITY_GAIN_PER_REP;
  const retentionScore = input.masteryScore * Math.exp(-daysSinceReview / stability);
  const clampedRetention = Math.max(0, Math.min(100, retentionScore));

  return {
    retentionScore: clampedRetention,
    isDue: clampedRetention < DUE_THRESHOLD,
    daysSinceReview,
  };
}
