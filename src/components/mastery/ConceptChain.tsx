import { cn } from "@/lib/utils";
import { MasteryBar } from "@/components/mastery/MasteryBar";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  target: "border-primary/40 bg-primary/5",
  weak: "border-destructive/30 bg-destructive/5",
  partial: "border-warning/30 bg-warning/5",
  strong: "border-success/30 bg-success/5",
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
                  "h-2 w-2 rounded-xs shrink-0",
                  state === "weak" && "bg-destructive",
                  state === "partial" && "bg-warning",
                  state === "strong" && "bg-success",
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
                "flex-1 rounded-md border-2 border-border p-3 mb-2 transition-colors shadow-[2px_2px_0px_var(--shadow-color)]",
                STATE_STYLES[state],
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {state === "weak" && (
                    <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                  )}
                  {state === "strong" && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                  )}
                  <span className="font-medium text-sm text-foreground">{node.name}</span>
                  {node.isTarget && (
                    <Badge variant="default" className="text-xs">
                      Target
                    </Badge>
                  )}
                  {node.isDue && (
                    <Badge variant="warning" className="text-xs flex items-center gap-1">
                      ⏳ Fading
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground font-mono">
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
