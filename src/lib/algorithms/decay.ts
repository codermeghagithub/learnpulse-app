/**
 * decay.ts — Forgetting-Curve Decay Engine
 *
 * Computes how much of a student's mastery is expected to be retained
 * given the elapsed time since their last practice attempt, using an
 * SM-2-inspired exponential-decay model layered on top of the existing
 * mastery score (from mastery.ts). The stored mastery score is NEVER
 * mutated — retention is computed lazily at read time.
 *
 * Formula:
 *   stability       = BASE_STABILITY + timesCorrect × STABILITY_GAIN_PER_REP
 *   retentionScore  = masteryScore × exp(−daysSinceReview / stability)
 *   isDue           = retentionScore < DUE_THRESHOLD
 *
 * Why these defaults?
 *   - BASE_STABILITY = 4 days: without any correct answers a student
 *     should review within ~4 days before noticeable decay (<70% retention).
 *   - STABILITY_GAIN_PER_REP = 3: each successful answer extends the stable
 *     interval by 3 days, approximating SM-2's inter-repetition interval growth.
 *   - DUE_THRESHOLD = 70: aligns with the existing "Developing" mastery
 *     boundary in masteryLevels.ts (score < 70 → shown as at-risk).
 *     When retained mastery falls below this threshold the concept badge
 *     switches to "⏳ Fading — review due".
 */

// ─── Constants ────────────────────────────────────────────────────────────────

/** Days of stability before any correct repetitions. */
const BASE_STABILITY = 4;

/**
 * Additional days of stability earned per correct repetition.
 * E.g. 5 correct answers → stability = 4 + 5×3 = 19 days before decay kicks in.
 */
const STABILITY_GAIN_PER_REP = 3;

/**
 * Retention score (0-100) below which a concept is considered "due for review".
 * Aligns with the Developing threshold in masteryLevels.ts.
 */
export const DUE_THRESHOLD = 70;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DecayInput {
  /** Current mastery score [0-100], from computeScaledMastery in mastery.ts */
  masteryScore: number;
  /** Timestamp of the student's last attempt on this concept */
  lastAttemptAt: Date;
  /** How many attempts on this concept were answered correctly */
  timesCorrect: number;
  /** Total attempts on this concept (used for future extensions) */
  totalAttempts: number;
}

export interface DecayResult {
  /** Effective retained mastery score [0-100] */
  retentionScore: number;
  /**
   * True when retentionScore has fallen below DUE_THRESHOLD.
   * The UI renders a "⏳ Fading — review due" badge when this is true.
   */
  isDue: boolean;
  /** Number of calendar days elapsed since lastAttemptAt */
  daysSinceReview: number;
}

// ─── Core Function ────────────────────────────────────────────────────────────

/**
 * Calculate the time-decayed retention of a student's mastery score.
 *
 * Pure function — no side effects, no async, no DB access.
 * Safe to call on every server render without performance concerns.
 *
 * @param input - Mastery state and attempt history for the concept
 * @param now   - Current time (injectable for deterministic testing)
 * @returns     DecayResult with retentionScore, isDue, and daysSinceReview
 */
export function calculateRetention(input: DecayInput, now: Date): DecayResult {
  const msElapsed = now.getTime() - input.lastAttemptAt.getTime();
  // Clamp to 0 — negative elapsed time means the timestamp is in the future
  const daysSinceReview = Math.max(0, msElapsed / (1000 * 60 * 60 * 24));

  // SM-2-inspired stability: each correct rep extends the stable interval
  const stability = BASE_STABILITY + input.timesCorrect * STABILITY_GAIN_PER_REP;

  // Exponential decay: R = M × e^(−t/S)
  const retentionScore = input.masteryScore * Math.exp(-daysSinceReview / stability);

  // Clamp to [0, 100] to guard against floating-point edge cases
  const clampedRetention = Math.max(0, Math.min(100, retentionScore));

  return {
    retentionScore: clampedRetention,
    isDue: clampedRetention < DUE_THRESHOLD,
    daysSinceReview,
  };
}
