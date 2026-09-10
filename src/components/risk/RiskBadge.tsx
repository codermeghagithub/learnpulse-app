import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { RiskBucket } from "@/lib/algorithms/risk";

interface RiskBadgeProps {
  bucket: RiskBucket;
  score?: number;
  showScore?: boolean;
  className?: string;
}

const BUCKET_STYLES: Record<
  RiskBucket,
  { bg: string; text: string; dot: string }
> = {
  Healthy: {
    bg: "bg-green-100 dark:bg-green-950/60",
    text: "text-green-900 dark:text-green-200",
    dot: "bg-green-500",
  },
  Monitor: {
    bg: "bg-[#FCCC42] dark:bg-[#614B14]",
    text: "text-[#151313] dark:text-[#F7F7F5]",
    dot: "bg-amber-600",
  },
  "At Risk": {
    bg: "bg-[#FF5734] dark:bg-[#FF5734]",
    text: "text-white dark:text-[#151313]",
    dot: "bg-white dark:bg-[#151313]",
  },
  Critical: {
    bg: "bg-red-500 dark:bg-red-950",
    text: "text-white dark:text-red-200",
    dot: "bg-white",
  },
};

export function RiskBadge({ bucket, score, showScore = false, className }: RiskBadgeProps) {
  const styles = BUCKET_STYLES[bucket];

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 font-medium border-1.5 border-border shadow-[1px_1px_0px_var(--shadow-color)] cursor-default transition-all",
        styles.bg,
        styles.text,
        className
      )}
      title="Learning Progress Indicator"
    >
      <span
        className={cn(
          "h-2 w-2 rounded-xs shrink-0 border border-border",
          styles.dot,
        )}
      />
      <span>{bucket}</span>
      {showScore && score !== undefined && (
        <span className="font-heading tabular-nums text-[11px] font-medium">
          ({(score * 100).toFixed(0)}%)
        </span>
      )}
    </Badge>
  );
}
