/**
 * risk.ts — Learning Risk Indicator
 *
 * Score = 0.40 * weakness + 0.25 * decline + 0.20 * repeatedErrors + 0.15 * inactivity
 * Buckets: Healthy | Monitor | At Risk | Critical
 *
 * Label in UI: "Learning Risk Indicator" — never "AI predicts failure"
 */

export type RiskBucket = "Healthy" | "Monitor" | "At Risk" | "Critical";

export interface RiskInput {
  /** Current mastery score [0, 100] */
  masteryScore: number;
  /** Mastery decline over last N attempts (positive = declined). Normalized [0, 1]. */
  decline: number;
  /** Ratio of repeated errors on same question [0, 1] */
  repeatedErrors: number;
  /** Days since last attempt, normalized [0, 1] where 1 = 30+ days idle */
  inactivity: number;
}

export interface RiskResult {
  score: number;
  bucket: RiskBucket;
  label: "Learning Risk Indicator";
}

const WEIGHTS = {
  weakness: 0.40,
  decline: 0.25,
  repeatedErrors: 0.20,
  inactivity: 0.15,
} as const;

const THRESHOLDS = {
  healthy: 0.3,
  monitor: 0.5,
  atRisk: 0.7,
} as const;

/**
 * Compute the risk score for a student on a concept.
 * All inputs should be normalized to [0, 1].
 */
export function computeRiskScore(input: RiskInput): number {
  const weakness = 1 - Math.max(0, Math.min(input.masteryScore, 100)) / 100;
  const decline = Math.max(0, Math.min(input.decline, 1));
  const repeatedErrors = Math.max(0, Math.min(input.repeatedErrors, 1));
  const inactivity = Math.max(0, Math.min(input.inactivity, 1));

  return (
    WEIGHTS.weakness * weakness +
    WEIGHTS.decline * decline +
    WEIGHTS.repeatedErrors * repeatedErrors +
    WEIGHTS.inactivity * inactivity
  );
}

/**
 * Bucket a raw risk score into a named risk level.
 */
export function bucketRisk(score: number): RiskBucket {
  if (score < THRESHOLDS.healthy) return "Healthy";
  if (score < THRESHOLDS.monitor) return "Monitor";
  if (score < THRESHOLDS.atRisk) return "At Risk";
  return "Critical";
}

/**
 * Compute full risk result including label.
 */
export function computeRisk(input: RiskInput): RiskResult {
  const score = computeRiskScore(input);
  return {
    score,
    bucket: bucketRisk(score),
    label: "Learning Risk Indicator",
  };
}

/**
 * Compute inactivity score from days since last attempt.
 * 0 days = 0.0, 30+ days = 1.0
 */
export function inactivityScore(daysSinceLastAttempt: number): number {
  return Math.min(daysSinceLastAttempt / 30, 1);
}

/**
 * Compute decline score from mastery history.
 * Compares average of last 3 scores vs previous 3.
 * Positive decline = mastery went down.
 */
export function declineScore(masteryHistory: number[]): number {
  if (masteryHistory.length < 2) return 0;
  const recent = masteryHistory.slice(-3);
  const older = masteryHistory.slice(-6, -3);
  if (older.length === 0) return 0;
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
  const declineAmount = olderAvg - recentAvg; // positive = declined
  return Math.max(0, Math.min(declineAmount / 100, 1));
}
