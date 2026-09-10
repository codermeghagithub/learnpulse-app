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
  if (score < 40) return "bg-[#FF5734]";
  if (score < 70) return "bg-[#FCCC42]";
  return "bg-green-500";
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

  const heightClass = size === "sm" ? "h-2.5" : size === "lg" ? "h-4" : "h-3";

  return (
    <div className={cn("space-y-1.5", className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span
            className={cn(
              "font-bold flex items-center gap-1.5",
              isDue ? "text-primary font-bold" : "text-muted-foreground"
            )}
          >
            <span>{emoji}</span>
            <span>{label}</span>
          </span>
          <div className="flex items-center gap-2">
            {gain !== null && gain !== 0 && (
              <span
                className={cn(
                  "text-xs font-bold tabular-nums font-heading",
                  gain > 0 ? "text-green-500" : "text-destructive",
                )}
              >
                {gain > 0 ? "+" : ""}
                {gain.toFixed(0)}%
              </span>
            )}
            <span className="font-heading font-bold tracking-tight text-foreground tabular-nums">
              {clampedScore.toFixed(0)}%
            </span>
          </div>
        </div>
      )}
      <div
        className={cn(
          "w-full rounded-sm border-1.5 border-border bg-card p-0.5 overflow-hidden relative shadow-[1px_1px_0px_var(--shadow-color)]",
          heightClass,
        )}
        role="progressbar"
        aria-valuenow={clampedScore}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            "h-full rounded-xs transition-[width] duration-500 ease-out relative",
            colorClass,
          )}
          style={{ width: `${clampedScore}%` }}
        />
      </div>

      {showAccuracySubtitle && attemptsCount !== undefined && (
        <p className="text-[11px] font-medium text-muted-foreground">
          {getAccuracyText(correctCount ?? 0, attemptsCount, clampedScore)}
        </p>
      )}
    </div>
  );
}
