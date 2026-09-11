// Root-cause ranking: ranks upstream prerequisite gaps by weakness, weight, and error evidence

export interface RootCauseCandidate {
  conceptId: string;
  conceptName: string;
  masteryScore: number;
  edgeWeight: number;
  failedAttempts: number;
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

// Scores a candidate gap: weakness (inverted mastery) + edge weight + failed attempts + recency
export function scoreCandidate(candidate: RootCauseCandidate): number {
  const weakness = 1 - candidate.masteryScore / 100;
  const edgeWeightNorm = Math.min(candidate.edgeWeight / 5, 1);
  const evidenceNorm = Math.min(candidate.failedAttempts / 20, 1);
  const recencyNorm = Math.max(0, Math.min(candidate.recency, 1));

  return (
    WEIGHTS.weakness * weakness +
    WEIGHTS.edgeWeight * edgeWeightNorm +
    WEIGHTS.evidence * evidenceNorm +
    WEIGHTS.recency * recencyNorm
  );
}

// Returns the top 3 root causes sorted by score descending
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
