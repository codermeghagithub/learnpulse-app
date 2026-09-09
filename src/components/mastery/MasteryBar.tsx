"use client";

import { cn } from "@/lib/utils";
import { getMasteryStage, getAccuracyText } from "@/lib/masteryLevels";

interface MasteryBarProps {
  score: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  previousScore?: number;
  attemptsCount?: number;
  correctCount?: number;
  showAccuracySubtitle?: boolean;
  customLabel?: string;
  isDue?: boolean;
}

function getMasteryColor(score: number): string {
  if (score < 40) return "bg-[var(--mastery-low)]";
  if (score < 70) return "bg-[var(--mastery-mid)]";
  return "bg-[var(--mastery-high)]";
}

export function MasteryBar({
  score,
  showLabel = true,
  size = "md",
  className,
  previousScore,
  attemptsCount,
  correctCount,
  showAccuracySubtitle = false,
  customLabel,
  isDue = false,
}: MasteryBarProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const colorClass = getMasteryColor(clampedScore);
  const stage = getMasteryStage(clampedScore, attemptsCount ?? (clampedScore > 0 ? 1 : 0));
  const emoji = isDue ? "⏳" : stage.stageEmoji;
  const label = customLabel ?? (isDue ? "Fading — review due" : stage.stageBadge);
  
  const gain =
    previousScore !== undefined ? clampedScore - previousScore : null;

  const heightClass = size === "sm" ? "h-1.5" : size === "lg" ? "h-3" : "h-2";

  return (
    <div className={cn("space-y-1.5", className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span
            className={cn(
              "font-medium flex items-center gap-1.5",
              isDue ? "text-amber-500 font-semibold" : "text-muted-foreground"
            )}
          >
            <span>{emoji}</span>
            <span>{label}</span>
          </span>
          <div className="flex items-center gap-2">
            {gain !== null && gain !== 0 && (
              <span
                className={cn(
                  "text-xs font-semibold",
                  gain > 0 ? "text-mastery-high" : "text-mastery-low",
                )}
              >
                {gain > 0 ? "+" : ""}
                {gain.toFixed(0)}%
              </span>
            )}
            <span className="font-bold text-foreground">
              {clampedScore.toFixed(0)}%
            </span>
          </div>
        </div>
      )}
      <div
        className={cn(
          "w-full rounded-full bg-muted overflow-hidden",
          heightClass,
        )}
        role="progressbar"
        aria-valuenow={clampedScore}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out",
            colorClass,
          )}
          style={{ width: `${clampedScore}%` }}
        />
      </div>

      {showAccuracySubtitle && attemptsCount !== undefined && (
        <p className="text-[11px] text-muted-foreground">
          {getAccuracyText(correctCount ?? 0, attemptsCount, clampedScore)}
        </p>
      )}
    </div>
  );
}
