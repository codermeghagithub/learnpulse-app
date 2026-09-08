/**
 * rootCause.ts — Deterministic root cause ranking
 *
 * Score = 0.45 * weakness + 0.25 * edgeWeight + 0.20 * evidence + 0.10 * recency
 * Returns top 3 candidates sorted by score descending.
 *
 * All inputs normalized to [0, 1] before scoring.
 */

export interface RootCauseCandidate {
  conceptId: string;
  conceptName: string;
  /** Mastery score [0, 100] — will be inverted to weakness */
  masteryScore: number;
  /** Edge weight from concept_edges [0, ∞] — normalized to [0, 1] */
  edgeWeight: number;
  /** Number of failed attempts on this concept — normalized to [0, 1] */
  failedAttempts: number;
  /** How recent the last failure was — 1 = very recent, 0 = old/never */
  recency: number;
}

export interface RankedCandidate extends RootCauseCandidate {
  rootCauseScore: number;
}

const WEIGHTS = {
  weakness: 0.45,
  edgeWeight: 0.25,
  evidence: 0.20,
  recency: 0.10,
} as const;

/**
 * Score a single root-cause candidate.
 * weakness = 1 - (masteryScore / 100) so low mastery = high weakness.
 */
export function scoreCandidate(candidate: RootCauseCandidate): number {
  const weakness = 1 - candidate.masteryScore / 100;
  // Normalize edgeWeight: assume max practical weight is 5
  const edgeWeightNorm = Math.min(candidate.edgeWeight / 5, 1);
  // evidence: normalize failed attempts (assume max 20 is "full evidence")
  const evidenceNorm = Math.min(candidate.failedAttempts / 20, 1);
  const recencyNorm = Math.max(0, Math.min(candidate.recency, 1));

  return (
    WEIGHTS.weakness * weakness +
    WEIGHTS.edgeWeight * edgeWeightNorm +
    WEIGHTS.evidence * evidenceNorm +
    WEIGHTS.recency * recencyNorm
  );
}

/**
 * Rank all candidates and return the top 3 by root cause score.
 */
export function rankRootCauses(
  candidates: RootCauseCandidate[]
): RankedCandidate[] {
  const scored: RankedCandidate[] = candidates.map((c) => ({
    ...c,
    rootCauseScore: scoreCandidate(c),
  }));

  scored.sort((a, b) => b.rootCauseScore - a.rootCauseScore);
  return scored.slice(0, 3);
}
