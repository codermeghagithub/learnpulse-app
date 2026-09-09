import { describe, it, expect } from "vitest";
import { calculateRetention, DUE_THRESHOLD } from "../decay";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a Date that is `hoursAgo` hours in the past relative to `now`. */
function daysAgo(days: number, now: Date): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

const NOW = new Date("2026-09-09T12:00:00Z");

const BASE_INPUT = {
  masteryScore: 100,
  timesCorrect: 0,
  totalAttempts: 0,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("calculateRetention — no decay immediately after review", () => {
  it("retentionScore equals masteryScore when daysSinceReview = 0", () => {
    const result = calculateRetention(
      { ...BASE_INPUT, lastAttemptAt: NOW },
      NOW
    );
    // e^0 = 1, so retentionScore = masteryScore × 1 = 100
    expect(result.retentionScore).toBeCloseTo(100, 5);
    expect(result.daysSinceReview).toBeCloseTo(0, 5);
    expect(result.isDue).toBe(false);
  });

  it("retentionScore is not due immediately after review on 100% mastery", () => {
    const result = calculateRetention(
      { ...BASE_INPUT, lastAttemptAt: daysAgo(0.1, NOW) },
      NOW
    );
    expect(result.isDue).toBe(false);
  });
});

describe("calculateRetention — decay increases with elapsed time", () => {
  it("retention score is lower after more days with zero correct answers", () => {
    const shortDecay = calculateRetention(
      { ...BASE_INPUT, lastAttemptAt: daysAgo(2, NOW) },
      NOW
    );
    const longDecay = calculateRetention(
      { ...BASE_INPUT, lastAttemptAt: daysAgo(10, NOW) },
      NOW
    );
    expect(longDecay.retentionScore).toBeLessThan(shortDecay.retentionScore);
  });

  it("isDue becomes true before 30 days with zero correct reps (BASE_STABILITY=4)", () => {
    // With BASE_STABILITY=4 and 0 correct reps, stability=4
    // At 8 days: R = 100 × e^(−8/4) = 100 × e^(−2) ≈ 13.5 → isDue
    const result = calculateRetention(
      { ...BASE_INPUT, lastAttemptAt: daysAgo(8, NOW) },
      NOW
    );
    expect(result.isDue).toBe(true);
  });

  it("daysSinceReview is reported correctly", () => {
    const result = calculateRetention(
      { ...BASE_INPUT, lastAttemptAt: daysAgo(5, NOW) },
      NOW
    );
    expect(result.daysSinceReview).toBeCloseTo(5, 2);
  });
});

describe("calculateRetention — higher timesCorrect produces slower decay", () => {
  it("student with 10 correct reps retains more after 10 days than student with 0", () => {
    const expert = calculateRetention(
      {
        masteryScore: 100,
        lastAttemptAt: daysAgo(10, NOW),
        timesCorrect: 10,
        totalAttempts: 10,
      },
      NOW
    );
    const novice = calculateRetention(
      {
        masteryScore: 100,
        lastAttemptAt: daysAgo(10, NOW),
        timesCorrect: 0,
        totalAttempts: 10,
      },
      NOW
    );
    expect(expert.retentionScore).toBeGreaterThan(novice.retentionScore);
  });

  it("high repetition count keeps concept NOT due for much longer", () => {
    // timesCorrect=20: stability = 4 + 20×3 = 64 days
    // At 30 days: R = 100 × e^(−30/64) ≈ 62.8 → still above DUE_THRESHOLD=70? No, 62.8 < 70
    // But compared to 0 reps at 10 days (≈13.5), it decays much slower
    const expert = calculateRetention(
      {
        masteryScore: 100,
        lastAttemptAt: daysAgo(5, NOW),
        timesCorrect: 20,
        totalAttempts: 20,
      },
      NOW
    );
    // stability=64, 5 days: R = 100 × e^(−5/64) ≈ 92.5 → NOT due
    expect(expert.isDue).toBe(false);
  });
});

describe("calculateRetention — DUE_THRESHOLD boundary", () => {
  it("isDue is false when retentionScore is exactly at DUE_THRESHOLD", () => {
    // We need retentionScore to equal DUE_THRESHOLD exactly — inject a masteryScore
    // equal to DUE_THRESHOLD with 0 elapsed time → retentionScore = DUE_THRESHOLD × 1
    const result = calculateRetention(
      {
        masteryScore: DUE_THRESHOLD,
        lastAttemptAt: NOW,
        timesCorrect: 0,
        totalAttempts: 0,
      },
      NOW
    );
    expect(result.retentionScore).toBeCloseTo(DUE_THRESHOLD, 5);
    // isDue = retentionScore < DUE_THRESHOLD → false (not strictly less than)
    expect(result.isDue).toBe(false);
  });

  it("isDue is true when retentionScore falls just below DUE_THRESHOLD", () => {
    // masteryScore=100, timesCorrect=0, stability=4
    // Need: 100 × e^(-t/4) < 70 → t > -4 × ln(0.7) ≈ 1.427 days
    const result = calculateRetention(
      {
        masteryScore: 100,
        lastAttemptAt: daysAgo(2, NOW),
        timesCorrect: 0,
        totalAttempts: 0,
      },
      NOW
    );
    expect(result.isDue).toBe(true);
  });

  it("retentionScore is clamped to [0, 100]", () => {
    const result = calculateRetention(
      { masteryScore: 0, lastAttemptAt: daysAgo(100, NOW), timesCorrect: 0, totalAttempts: 0 },
      NOW
    );
    expect(result.retentionScore).toBeGreaterThanOrEqual(0);
    expect(result.retentionScore).toBeLessThanOrEqual(100);
  });

  it("future lastAttemptAt (negative elapsed) clamps daysSinceReview to 0", () => {
    const futureDate = new Date(NOW.getTime() + 1000 * 60 * 60 * 24); // 1 day in future
    const result = calculateRetention(
      { ...BASE_INPUT, masteryScore: 80, lastAttemptAt: futureDate },
      NOW
    );
    expect(result.daysSinceReview).toBe(0);
    // retentionScore = masteryScore × e^0 = 80
    expect(result.retentionScore).toBeCloseTo(80, 5);
  });
});
