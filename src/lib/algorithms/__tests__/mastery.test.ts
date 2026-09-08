import { describe, it, expect } from "vitest";
import { updateMastery, computeMasteryFromAttempts, computeScaledMastery } from "../mastery";

describe("updateMastery", () => {
  it("starts from 0 and updates correctly on correct answer (medium)", () => {
    // alpha=0.2, correctValue=100*1.0=100
    // new = 0.2*100 + 0.8*0 = 20
    expect(updateMastery(0, true, "medium")).toBeCloseTo(20);
  });

  it("applies difficulty multiplier for easy questions", () => {
    // correctValue = 100 * 0.8 = 80
    // new = 0.2*80 + 0.8*0 = 16
    expect(updateMastery(0, true, "easy")).toBeCloseTo(16);
  });

  it("applies difficulty multiplier for hard questions", () => {
    // correctValue = 100 * 1.2 = 120, but score clamped at 100
    // Actually: new = 0.2*120 + 0.8*0 = 24
    expect(updateMastery(0, true, "hard")).toBeCloseTo(24);
  });

  it("decreases score on wrong answer", () => {
    // previous=80, isCorrect=false: correctValue=0
    // new = 0.2*0 + 0.8*80 = 64
    expect(updateMastery(80, false, "medium")).toBeCloseTo(64);
  });

  it("clamps score at 100", () => {
    // Even with previous=95 and hard correct (multiplier=1.2):
    // new = 0.2*120 + 0.8*95 = 24 + 76 = 100 → clamped at 100
    expect(updateMastery(95, true, "hard")).toBeCloseTo(100);
  });

  it("clamps score at 0", () => {
    expect(updateMastery(0, false, "medium")).toBe(0);
  });

  it("converges upward over many correct medium answers", () => {
    let score = 0;
    for (let i = 0; i < 50; i++) {
      score = updateMastery(score, true, "medium");
    }
    expect(score).toBeGreaterThan(95);
  });
});

describe("computeMasteryFromAttempts", () => {
  it("returns 0 for empty attempts", () => {
    expect(computeMasteryFromAttempts([])).toBe(0);
  });

  it("matches sequential updateMastery calls", () => {
    const attempts = [
      { isCorrect: true, difficulty: "medium" as const },
      { isCorrect: false, difficulty: "easy" as const },
      { isCorrect: true, difficulty: "hard" as const },
    ];
    let manual = 0;
    for (const a of attempts) {
      manual = updateMastery(manual, a.isCorrect, a.difficulty);
    }
    expect(computeMasteryFromAttempts(attempts)).toBeCloseTo(manual);
  });
});

describe("computeScaledMastery", () => {
  it("returns 0 when there are no questions or attempts", () => {
    expect(
      computeScaledMastery({
        totalConceptQuestions: 0,
        uniqueQuestionsCorrect: 0,
        totalAttempts: 0,
        totalCorrect: 0,
      })
    ).toBe(0);
  });

  it("awards 100% for 1/1 question concept completed on first try", () => {
    const score = computeScaledMastery({
      totalConceptQuestions: 1,
      uniqueQuestionsCorrect: 1,
      totalAttempts: 1,
      totalCorrect: 1,
    });
    expect(score).toBe(100);
  });

  it("awards 100% for 2/2 questions completed with 100% accuracy", () => {
    const score = computeScaledMastery({
      totalConceptQuestions: 2,
      uniqueQuestionsCorrect: 2,
      totalAttempts: 2,
      totalCorrect: 2,
    });
    expect(score).toBe(100);
  });

  it("awards 50% for 1/2 questions completed with 100% accuracy", () => {
    const score = computeScaledMastery({
      totalConceptQuestions: 2,
      uniqueQuestionsCorrect: 1,
      totalAttempts: 1,
      totalCorrect: 1,
    });
    expect(score).toBe(50);
  });

  it("handles mistakes gracefully when concept is eventually mastered", () => {
    // 2 unique questions, 3 attempts (1 wrong, 2 correct)
    const score = computeScaledMastery({
      totalConceptQuestions: 2,
      uniqueQuestionsCorrect: 2,
      totalAttempts: 3,
      totalCorrect: 2,
    });
    // Coverage = 1.0, accuracy = 2/3 ≈ 0.67 → 80 + 20*0.67 ≈ 93
    expect(score).toBe(93);
  });

  it("proportional scaling for 3 question concept", () => {
    expect(
      computeScaledMastery({
        totalConceptQuestions: 3,
        uniqueQuestionsCorrect: 1,
        totalAttempts: 1,
        totalCorrect: 1,
      })
    ).toBe(33);

    expect(
      computeScaledMastery({
        totalConceptQuestions: 3,
        uniqueQuestionsCorrect: 2,
        totalAttempts: 2,
        totalCorrect: 2,
      })
    ).toBe(67);

    expect(
      computeScaledMastery({
        totalConceptQuestions: 3,
        uniqueQuestionsCorrect: 3,
        totalAttempts: 3,
        totalCorrect: 3,
      })
    ).toBe(100);
  });
});
