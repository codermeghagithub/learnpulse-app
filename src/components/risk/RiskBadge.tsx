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
    bg: "bg-success/10",
    text: "text-success",
    dot: "bg-success",
    border: "border-success/20",
  },
  Monitor: {
    bg: "bg-warning/10",
    text: "text-warning",
    dot: "bg-warning",
    border: "border-warning/20",
  },
  "At Risk": {
    bg: "bg-orange-500/10",
    text: "text-orange-500 dark:text-orange-400",
    dot: "bg-orange-500",
    border: "border-orange-500/20",
  },
  Critical: {
    bg: "bg-destructive/10",
    text: "text-destructive",
    dot: "bg-destructive",
    border: "border-destructive/20",
  },
};

export function RiskBadge({ bucket, score, showScore = false, className }: RiskBadgeProps) {
  const styles = BUCKET_STYLES[bucket];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium border transition-colors",
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
        )}
      />
      <span>{bucket}</span>
      {showScore && score !== undefined && (
        <span className="opacity-80 font-mono tabular-nums text-[11px]">
          ({(score * 100).toFixed(0)}%)
        </span>
      )}
    </span>
  );
}
