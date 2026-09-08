import { describe, it, expect } from "vitest";
import { getMasteryStage, getAccuracyText } from "../masteryLevels";

describe("masteryLevels — Option A: Mastery Level Stages", () => {
  it("returns Level 0 • Not Started when attempts are 0 or score is 0", () => {
    const stage1 = getMasteryStage(0, 0);
    expect(stage1.level).toBe(0);
    expect(stage1.stageName).toBe("Not Started");
    expect(stage1.stageBadge).toBe("Level 0 • Not Started");

    const stage2 = getMasteryStage(50, 0);
    expect(stage2.level).toBe(0);
  });

  it("returns Level 1 • Getting Started for scores between 1% and 39%", () => {
    const stage1 = getMasteryStage(20, 1);
    expect(stage1.level).toBe(1);
    expect(stage1.stageName).toBe("Getting Started");
    expect(stage1.stageBadge).toBe("Level 1 • Getting Started");

    const stage2 = getMasteryStage(36, 2);
    expect(stage2.level).toBe(1);
    expect(stage2.stageName).toBe("Getting Started");
  });

  it("returns Level 2 • Developing for scores between 40% and 69%", () => {
    const stage = getMasteryStage(55, 4);
    expect(stage.level).toBe(2);
    expect(stage.stageName).toBe("Developing");
    expect(stage.stageBadge).toBe("Level 2 • Developing");
  });

  it("returns Level 3 • Proficient for scores between 70% and 84%", () => {
    const stage = getMasteryStage(75, 6);
    expect(stage.level).toBe(3);
    expect(stage.stageName).toBe("Proficient");
    expect(stage.stageBadge).toBe("Level 3 • Proficient");
  });

  it("returns Level 4 • Mastered for scores 85% and above", () => {
    const stage = getMasteryStage(90, 8);
    expect(stage.level).toBe(4);
    expect(stage.stageName).toBe("Mastered");
    expect(stage.stageBadge).toBe("Level 4 • Mastered");
  });
});

describe("masteryLevels — Option B: Accuracy and Progression Text", () => {
  it("handles 0 attempts cleanly", () => {
    expect(getAccuracyText(0, 0, 0)).toBe("0 attempts • Practice to level up");
  });

  it("displays exact accuracy and guidance for 2/2 correct (36% mastery)", () => {
    const text = getAccuracyText(2, 2, 36);
    expect(text).toContain("2/2 correct (100% accuracy)");
    expect(text).toContain("Practice more to level up (Developing)");
  });

  it("displays exact accuracy and guidance for partial accuracy", () => {
    const text = getAccuracyText(3, 5, 55);
    expect(text).toContain("3/5 correct (60% accuracy)");
    expect(text).toContain("Practice more to level up (Proficient)");
  });

  it("displays trophy celebration when fully mastered", () => {
    const text = getAccuracyText(10, 10, 92);
    expect(text).toContain("10/10 correct (100% accuracy) • Fully Mastered 🏆");
  });
});
