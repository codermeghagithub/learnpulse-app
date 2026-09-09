import { cn } from "@/lib/utils";
import { MasteryBar } from "@/components/mastery/MasteryBar";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

interface ConceptNode {
  id: string;
  name: string;
  mastery: number;
  depth: number;
  isTarget?: boolean;
  isDue?: boolean;
}

interface ConceptChainProps {
  nodes: ConceptNode[];
  className?: string;
}

function getNodeState(mastery: number, isTarget?: boolean) {
  if (isTarget) return "target";
  if (mastery < 40) return "weak";
  if (mastery < 70) return "partial";
  return "strong";
}

const STATE_STYLES = {
  target: "border-primary/50 bg-primary/10",
  weak: "border-[var(--mastery-low)]/50 bg-[var(--mastery-low)]/10",
  partial: "border-[var(--mastery-mid)]/50 bg-[var(--mastery-mid)]/10",
  strong: "border-[var(--mastery-high)]/50 bg-[var(--mastery-high)]/10",
};

export function ConceptChain({ nodes, className }: ConceptChainProps) {
  if (nodes.length === 0) return null;

  // Sort by depth ascending so prerequisites come first
  const sorted = [...nodes].sort((a, b) => a.depth - b.depth);

  return (
    <div className={cn("space-y-2", className)}>
      {sorted.map((node, idx) => {
        const state = getNodeState(node.mastery, node.isTarget);
        return (
          <div key={node.id} className="flex items-start gap-3">
            {/* Depth connector */}
            <div className="flex flex-col items-center pt-3">
              <div
                className={cn(
                  "h-2 w-2 rounded-full shrink-0",
                  state === "weak" && "bg-mastery-low",
                  state === "partial" && "bg-mastery-mid",
                  state === "strong" && "bg-mastery-high",
                  state === "target" && "bg-primary",
                )}
              />
              {idx < sorted.length - 1 && (
                <div className="w-px flex-1 mt-1 min-h-4 bg-border" />
              )}
            </div>

            {/* Node card */}
            <div
              className={cn(
                "flex-1 rounded-xl border p-3 mb-2 transition-all duration-200",
                STATE_STYLES[state],
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {state === "weak" && (
                    <AlertTriangle className="h-3.5 w-3.5 text-mastery-low shrink-0" />
                  )}
                  {state === "strong" && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-mastery-high shrink-0" />
                  )}
                  <span className="font-medium text-sm">{node.name}</span>
                  {node.isTarget && (
                    <span className="text-xs px-1.5 py-0.5 rounded-md bg-primary/20 text-primary font-medium">
                       Target
                    </span>
                  )}
                  {node.isDue && (
                    <span className="text-xs px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-500 font-medium flex items-center gap-1">
                      ⏳ Fading
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  Depth {node.depth}
                </span>
              </div>
              <MasteryBar score={node.mastery} size="sm" isDue={node.isDue} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
