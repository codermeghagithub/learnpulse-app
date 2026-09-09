"use client";

import { useState } from "react";
import { InteractiveDagGraph, type DagNode, type DagEdge } from "@/components/mastery/InteractiveDagGraph";
import { ConceptChain } from "@/components/mastery/ConceptChain";
import { ConceptBiteCard } from "@/components/remediation/ConceptBiteCard";
import { Network, ListOrdered, Sparkles, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface GapKnowledgeViewProps {
  nodes: DagNode[];
  edges?: DagEdge[];
  courseId: string;
  targetConcept: {
    id: string;
    name: string;
    description?: string | null;
  };
}

export function GapKnowledgeView({
  nodes,
  edges = [],
  courseId,
  targetConcept,
}: GapKnowledgeViewProps) {
  const [viewMode, setViewMode] = useState<"graph" | "chain">("graph");
  const [selectedConceptId, setSelectedConceptId] = useState<string>(targetConcept.id);

  const selectedNode = nodes.find((n) => n.id === selectedConceptId) ?? {
    id: targetConcept.id,
    name: targetConcept.name,
  };

  return (
    <div className="space-y-6">
      {/* View Switcher Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-base flex items-center gap-2">
            <span>Prerequisite Dependency Graph</span>
            {nodes.length > 1 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-normal">
                {nodes.length - 1} foundational prerequisite{nodes.length > 2 ? "s" : ""}
              </span>
            )}
          </h2>
        </div>

        {/* Toggle Switch */}
        {nodes.length > 1 && (
          <div className="flex items-center bg-background/80 border border-border rounded-xl p-1 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("graph")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer",
                viewMode === "graph"
                  ? "bg-primary text-white font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Network className="h-3.5 w-3.5" />
              <span>Visual DAG Map</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("chain")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer",
                viewMode === "chain"
                  ? "bg-primary text-white font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ListOrdered className="h-3.5 w-3.5" />
              <span>Step-by-Step Chain</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Visual Component */}
      {nodes.length <= 1 ? (
        <div className="glass-card rounded-xl p-6 text-center text-muted-foreground text-sm">
          This is a foundational concept — no prerequisites required.
        </div>
      ) : viewMode === "graph" ? (
        <InteractiveDagGraph
          nodes={nodes}
          edges={edges}
          courseId={courseId}
          targetConceptId={targetConcept.id}
          onSelectNode={(nodeId) => setSelectedConceptId(nodeId)}
        />
      ) : (
        <ConceptChain nodes={nodes} />
      )}

      {/* 60-Second Remediation Bite (Single authoritative instance for the active concept) */}
      <div className="pt-2">
        <ConceptBiteCard
          key={selectedNode.id}
          conceptId={selectedNode.id}
          conceptName={selectedNode.name}
          description={selectedNode.id === targetConcept.id ? targetConcept.description ?? undefined : undefined}
        />
      </div>
    </div>
  );
}
