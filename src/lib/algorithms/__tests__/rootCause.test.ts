import { describe, it, expect } from "vitest";
import { scoreCandidate, rankRootCauses, type RootCauseCandidate } from "../rootCause";

const DEFAULT_CANDIDATE: RootCauseCandidate = {
  conceptId: "test-id",
  conceptName: "Test Concept",
  masteryScore: 50,
  edgeWeight: 1,
  failedAttempts: 5,
  recency: 0.5,
};

const makeCandidate = (
  overrides: Partial<RootCauseCandidate> = {}
): RootCauseCandidate => ({
  ...DEFAULT_CANDIDATE,
  ...overrides,
});

describe("scoreCandidate", () => {
  it("returns a score in [0, 1]", () => {
    const score = scoreCandidate(makeCandidate());
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it("low mastery → higher score (more likely root cause)", () => {
    const low = scoreCandidate(makeCandidate({ masteryScore: 10 }));
    const high = scoreCandidate(makeCandidate({ masteryScore: 90 }));
    expect(low).toBeGreaterThan(high);
  });

  it("more failed attempts → higher score", () => {
    const few = scoreCandidate(makeCandidate({ failedAttempts: 1 }));
    const many = scoreCandidate(makeCandidate({ failedAttempts: 18 }));
    expect(many).toBeGreaterThan(few);
  });

  it("more recent failures → higher score", () => {
    const old = scoreCandidate(makeCandidate({ recency: 0 }));
    const recent = scoreCandidate(makeCandidate({ recency: 1 }));
    expect(recent).toBeGreaterThan(old);
  });

  it("weights sum approximately to correct formula", () => {
    // 0 mastery (weakness=1), max edge weight (5), max evidence (20 fails), full recency
    const maxScore = scoreCandidate({
      conceptId: "test",
      conceptName: "Test",
      masteryScore: 0,
      edgeWeight: 5,
      failedAttempts: 20,
      recency: 1,
    });
    // Should be ≈ 0.45*1 + 0.25*1 + 0.20*1 + 0.10*1 = 1.0
    expect(maxScore).toBeCloseTo(1.0, 1);
  });
});

describe("rankRootCauses", () => {
  it("returns at most 3 candidates", () => {
    const candidates = Array.from({ length: 10 }, (_, i) =>
      makeCandidate({ conceptId: `c-${i}`, masteryScore: i * 10 })
    );
    const ranked = rankRootCauses(candidates);
    expect(ranked.length).toBeLessThanOrEqual(3);
  });

  it("sorts by score descending", () => {
    const candidates = [
      makeCandidate({ conceptId: "weak", masteryScore: 10 }),
      makeCandidate({ conceptId: "ok", masteryScore: 60 }),
      makeCandidate({ conceptId: "strong", masteryScore: 90 }),
    ];
    const ranked = rankRootCauses(candidates);
    expect(ranked[0].conceptId).toBe("weak");
  });

  it("handles empty input", () => {
    expect(rankRootCauses([])).toHaveLength(0);
  });

  it("adds rootCauseScore to each result", () => {
    const ranked = rankRootCauses([makeCandidate()]);
    expect(ranked[0].rootCauseScore).toBeDefined();
    expect(typeof ranked[0].rootCauseScore).toBe("number");
  });
});
