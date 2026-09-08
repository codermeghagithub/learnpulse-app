import { describe, it, expect } from "vitest";
import {
  computeRiskScore,
  bucketRisk,
  computeRisk,
  inactivityScore,
  declineScore,
  type RiskInput,
} from "../risk";

const makeInput = (overrides: Partial<RiskInput> = {}): RiskInput => ({
  masteryScore: 50,
  decline: 0,
  repeatedErrors: 0,
  inactivity: 0,
  ...overrides,
});

describe("computeRiskScore", () => {
  it("returns a score in [0, 1]", () => {
    const score = computeRiskScore(makeInput());
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it("high mastery with no issues → low risk", () => {
    const score = computeRiskScore(makeInput({ masteryScore: 95 }));
    expect(score).toBeLessThan(0.15);
  });

  it("zero mastery, max decline, max errors, max inactivity → max risk", () => {
    const score = computeRiskScore({
      masteryScore: 0,
      decline: 1,
      repeatedErrors: 1,
      inactivity: 1,
    });
    // 0.40*1 + 0.25*1 + 0.20*1 + 0.15*1 = 1.0
    expect(score).toBeCloseTo(1.0, 5);
  });

  it("clamps inputs below 0 and above 1", () => {
    const s1 = computeRiskScore({ masteryScore: -10, decline: -1, repeatedErrors: -1, inactivity: -1 });
    expect(s1).toBeGreaterThanOrEqual(0);
    const s2 = computeRiskScore({ masteryScore: 110, decline: 2, repeatedErrors: 2, inactivity: 2 });
    expect(s2).toBeLessThanOrEqual(1);
  });
});

describe("bucketRisk", () => {
  it("returns Healthy for score < 0.3", () => {
    expect(bucketRisk(0.1)).toBe("Healthy");
  });
  it("returns Monitor for score 0.3–0.5", () => {
    expect(bucketRisk(0.4)).toBe("Monitor");
  });
  it("returns At Risk for score 0.5–0.7", () => {
    expect(bucketRisk(0.6)).toBe("At Risk");
  });
  it("returns Critical for score >= 0.7", () => {
    expect(bucketRisk(0.8)).toBe("Critical");
  });
});

describe("computeRisk", () => {
  it("always returns label Learning Risk Indicator", () => {
    const result = computeRisk(makeInput());
    expect(result.label).toBe("Learning Risk Indicator");
  });
});

describe("inactivityScore", () => {
  it("returns 0 for 0 days", () => {
    expect(inactivityScore(0)).toBe(0);
  });
  it("returns 1 for 30+ days", () => {
    expect(inactivityScore(30)).toBe(1);
    expect(inactivityScore(60)).toBe(1);
  });
  it("is linear in between", () => {
    expect(inactivityScore(15)).toBeCloseTo(0.5);
  });
});

describe("declineScore", () => {
  it("returns 0 for single data point", () => {
    expect(declineScore([80])).toBe(0);
  });
  it("detects decline from old to recent", () => {
    const history = [80, 80, 80, 40, 40, 40];
    expect(declineScore(history)).toBeGreaterThan(0);
  });
  it("returns 0 when mastery is improving", () => {
    const history = [40, 40, 40, 80, 80, 80];
    expect(declineScore(history)).toBe(0);
  });
});
