import { cn } from "@/lib/utils";
import type { RiskBucket } from "@/lib/algorithms/risk";

interface RiskBadgeProps {
  bucket: RiskBucket;
  score?: number;
  showScore?: boolean;
  className?: string;
}

const BUCKET_STYLES: Record<
  RiskBucket,
  { bg: string; text: string; dot: string; border: string }
> = {
  Healthy: {
    bg: "bg-[var(--mastery-high)]/10",
    text: "text-[var(--mastery-high)]",
    dot: "bg-[var(--mastery-high)]",
    border: "border-[var(--mastery-high)]/20",
  },
  Monitor: {
    bg: "bg-[var(--mastery-mid)]/10",
    text: "text-[var(--mastery-mid)]",
    dot: "bg-[var(--mastery-mid)]",
    border: "border-[var(--mastery-mid)]/20",
  },
  "At Risk": {
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    dot: "bg-orange-400",
    border: "border-orange-500/20",
  },
  Critical: {
    bg: "bg-[var(--mastery-low)]/10",
    text: "text-[var(--mastery-low)]",
    dot: "bg-[var(--mastery-low)]",
    border: "border-[var(--mastery-low)]/20",
  },
};

export function RiskBadge({ bucket, score, showScore = false, className }: RiskBadgeProps) {
  const styles = BUCKET_STYLES[bucket];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border shadow-2xs backdrop-blur-xs transition-transform duration-150 hover:scale-105",
        styles.bg,
        styles.text,
        styles.border,
        className
      )}
      title="Learning Risk Indicator"
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full shrink-0",
          styles.dot,
          bucket === "At Risk" || bucket === "Critical" ? "animate-pulse" : ""
        )}
      />
      {bucket}
      {showScore && score !== undefined && (
        <span className="opacity-75 font-normal">
          ({(score * 100).toFixed(0)}%)
        </span>
      )}
    </span>
  );
}
