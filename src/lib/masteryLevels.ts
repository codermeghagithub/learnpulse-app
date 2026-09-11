// Mastery progression stages (Level 0 to 4) and accuracy helpers

export interface MasteryLevelInfo {
  level: number;
  stageName: "Not Started" | "Getting Started" | "Developing" | "Proficient" | "Mastered";
  stageEmoji: string;
  stageBadge: string;
  colorClass: string;
  badgeClass: string;
  description: string;
  nextThreshold: number | null;
  pointsToNext: number;
}

export function getMasteryStage(score: number, attemptsCount = 0): MasteryLevelInfo {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));

  if (attemptsCount === 0 || clamped === 0) {
    return {
      level: 0,
      stageName: "Not Started",
      stageEmoji: "🌱",
      stageBadge: "Level 0 • Not Started",
      colorClass: "text-muted-foreground",
      badgeClass: "bg-muted text-muted-foreground border-border",
      description: "Start practicing to build your concept mastery.",
      nextThreshold: 40,
      pointsToNext: 40 - clamped,
    };
  }

  if (clamped < 40) {
    return {
      level: 1,
      stageName: "Getting Started",
      stageEmoji: "🌱",
      stageBadge: "Level 1 • Getting Started",
      colorClass: "text-[var(--mastery-low)]",
      badgeClass: "bg-[var(--mastery-low)]/10 text-[var(--mastery-low)] border-[var(--mastery-low)]/20",
      description: "Early concept recall recorded. Keep practicing to reach Developing.",
      nextThreshold: 40,
      pointsToNext: Math.max(0, 40 - clamped),
    };
  }

  if (clamped < 70) {
    return {
      level: 2,
      stageName: "Developing",
      stageEmoji: "📈",
      stageBadge: "Level 2 • Developing",
      colorClass: "text-[var(--mastery-mid)]",
      badgeClass: "bg-[var(--mastery-mid)]/10 text-[var(--mastery-mid)] border-[var(--mastery-mid)]/20",
      description: "Good foundation forming. A few more correct answers will reach Proficient.",
      nextThreshold: 70,
      pointsToNext: Math.max(0, 70 - clamped),
    };
  }

  if (clamped < 85) {
    return {
      level: 3,
      stageName: "Proficient",
      stageEmoji: "⭐",
      stageBadge: "Level 3 • Proficient",
      colorClass: "text-[var(--mastery-high)]",
      badgeClass: "bg-[var(--mastery-high)]/10 text-[var(--mastery-high)] border-[var(--mastery-high)]/20",
      description: "Solid conceptual grasp. Practice occasionally to reinforce retention.",
      nextThreshold: 85,
      pointsToNext: Math.max(0, 85 - clamped),
    };
  }

  return {
    level: 4,
    stageName: "Mastered",
    stageEmoji: "🏆",
    stageBadge: "Level 4 • Mastered",
    colorClass: "text-emerald-400",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    description: "Highest level of concept retention achieved!",
    nextThreshold: null,
    pointsToNext: 0,
  };
}

export function getAccuracyText(
  correctCount: number,
  attemptsCount: number,
  score: number
): string {
  if (attemptsCount === 0) {
    return "0 attempts • Practice to level up";
  }

  const accuracy = Math.round((correctCount / attemptsCount) * 100);
  const stage = getMasteryStage(score, attemptsCount);

  if (stage.level === 4) {
    return `${correctCount}/${attemptsCount} correct (${accuracy}% accuracy) • Fully Mastered 🏆`;
  }

  const targetStage =
    stage.level === 0 || stage.level === 1
      ? "Developing"
      : stage.level === 2
        ? "Proficient"
        : "Mastered";

  return `${correctCount}/${attemptsCount} correct (${accuracy}% accuracy) • Practice more to level up (${targetStage})`;
}
