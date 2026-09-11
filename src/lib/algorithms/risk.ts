// Learning Risk Indicator: weighted composite of weakness, decline, repeated errors, and inactivity

export type RiskBucket = "Healthy" | "Monitor" | "At Risk" | "Critical";

export interface RiskInput {
  masteryScore: number;
  decline: number;
  repeatedErrors: number;
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

// Calculates composite risk score [0, 1]
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

// Maps continuous risk score into categorized status bucket
export function bucketRisk(score: number): RiskBucket {
  if (score < THRESHOLDS.healthy) return "Healthy";
  if (score < THRESHOLDS.monitor) return "Monitor";
  if (score < THRESHOLDS.atRisk) return "At Risk";
  return "Critical";
}

// Full evaluation returning score and bucket
export function computeRisk(input: RiskInput): RiskResult {
  const score = computeRiskScore(input);
  return {
    score,
    bucket: bucketRisk(score),
    label: "Learning Risk Indicator",
  };
}

// Normalizes inactive days to [0, 1] range (30 days = 1.0)
export function inactivityScore(daysSinceLastAttempt: number): number {
  return Math.min(daysSinceLastAttempt / 30, 1);
}

// Computes mastery drop comparing the last 3 attempts against previous 3
export function declineScore(masteryHistory: number[]): number {
  if (masteryHistory.length < 2) return 0;
  const recent = masteryHistory.slice(-3);
  const older = masteryHistory.slice(-6, -3);
  if (older.length === 0) return 0;
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
  const declineAmount = olderAvg - recentAvg;
  return Math.max(0, Math.min(declineAmount / 100, 1));
}
