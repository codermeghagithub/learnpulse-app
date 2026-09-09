"use client";

import React, { useMemo, useState, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  MarkerType,
  type Node,
  type Edge,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { cn } from "@/lib/utils";
import {
  Brain,
  AlertTriangle,
  Zap,
  Info,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export interface DagNode {
  id: string;
  name: string;
  mastery: number;
  depth: number;
  isTarget?: boolean;
  isBottleneck?: boolean;
  isDue?: boolean;
  difficulty?: string;
}

export interface DagEdge {
  fromId: string;
  toId: string;
  weight?: number;
}

interface InteractiveDagGraphProps {
  nodes: DagNode[];
  edges?: DagEdge[];
  courseId?: string;
  targetConceptId?: string;
  className?: string;
  onSelectNode?: (nodeId: string) => void;
}

// ─── Custom Node Component ──────────────────────────────────────────────────

interface ConceptNodeData extends Record<string, unknown> {
  id: string;
  name: string;
  mastery: number;
  depth: number;
  isTarget?: boolean;
  isSelected?: boolean;
}

function CustomConceptNode({ data }: NodeProps<Node<ConceptNodeData>>) {
  const { name, mastery, depth, isTarget, isSelected } = data;
  const roundedMastery = Math.round(mastery);
  const isWeak = roundedMastery < 40;
  const isPartial = roundedMastery >= 40 && roundedMastery < 85;
  const isStrong = roundedMastery >= 85;

  let badgeDot = "bg-emerald-500";
  let borderClass = "border-emerald-500/40 hover:border-emerald-500/80";
  let scoreClass = "text-emerald-400";

  if (isWeak) {
    badgeDot = "bg-rose-500";
    borderClass =
      "border-rose-500/70 hover:border-rose-500 shadow-rose-500/10 shadow-md";
    scoreClass = "text-rose-400 font-bold";
  } else if (isPartial) {
    badgeDot = "bg-amber-500";
    borderClass = "border-amber-500/50 hover:border-amber-500/80";
    scoreClass = "text-amber-400";
  }

  return (
    <div
      className={cn(
        "relative rounded-xl border bg-background/95 backdrop-blur-md px-3.5 py-2.5 shadow-lg transition-all duration-200 cursor-pointer min-w-42.5 max-w-52.5",
        borderClass,
        isSelected && "ring-2 ring-primary border-primary shadow-primary/20",
        isTarget && "ring-1 ring-primary/60",
      )}
    >
      {/* Target input handle (from prerequisites) */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-2.5 h-2.5 bg-primary border-2 border-background -left-1.5!"
      />

      {/* Top row: dot, title, target pill */}
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className={cn(
            "h-2.5 w-2.5 rounded-full shrink-0",
            badgeDot,
            isWeak && "animate-ping",
          )}
        />
        <span
          className="font-semibold text-xs text-foreground truncate flex-1"
          title={name}
        >
          {name}
        </span>
        {isTarget && (
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-primary/20 text-primary font-bold uppercase tracking-wider shrink-0">
            Target
          </span>
        )}
      </div>

      {/* Bottom row: mastery score, depth */}
      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/50">
        <span className={cn("font-mono font-medium", scoreClass)}>
          {roundedMastery}% mastery
        </span>
        <span className="text-[10px] text-muted-foreground font-medium">
          {depth > 0 ? `Depth ${depth}` : "Primary"}
        </span>
      </div>

      {/* Source output handle (to dependent concepts) */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-2.5 h-2.5 bg-primary border-2 border-background -right-1.5!"
      />
    </div>
  );
}

const nodeTypes = {
  conceptNode: CustomConceptNode,
};

// ─── Main Component ─────────────────────────────────────────────────────────

export function InteractiveDagGraph({
  nodes: rawNodes,
  edges: rawEdges = [],
  courseId,
  targetConceptId,
  className,
  onSelectNode,
}: InteractiveDagGraphProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string>(
    targetConceptId ||
      rawNodes.find((n) => n.isTarget)?.id ||
      rawNodes[0]?.id ||
      "",
  );

  // Compute topological columns layout
  const { flowNodes, flowEdges } = useMemo(() => {
    if (rawNodes.length === 0) return { flowNodes: [], flowEdges: [] };

    // Group nodes by depth level (higher depth = foundational prerequisite on left)
    const depthGroups = new Map<number, DagNode[]>();
    for (const node of rawNodes) {
      const d = node.depth ?? 0;
      if (!depthGroups.has(d)) depthGroups.set(d, []);
      depthGroups.get(d)!.push(node);
    }

    const sortedDepths = Array.from(depthGroups.keys()).sort((a, b) => b - a);
    const colSpacing = 260;
    const rowSpacing = 95;

    const nodesList: Node<ConceptNodeData>[] = [];

    sortedDepths.forEach((depth, colIdx) => {
      const group = depthGroups.get(depth)!;
      const groupHeight = (group.length - 1) * rowSpacing;
      const startY = Math.max(20, 140 - groupHeight / 2);

      group.forEach((node, rowIdx) => {
        const isTarget = node.id === targetConceptId || !!node.isTarget;
        const isSelected = node.id === selectedNodeId;

        nodesList.push({
          id: node.id,
          type: "conceptNode",
          position: {
            x: colIdx * colSpacing + 40,
            y: startY + rowIdx * rowSpacing,
          },
          data: {
            id: node.id,
            name: node.name,
            mastery: node.mastery,
            depth: node.depth,
            isTarget,
            isSelected,
          },
        });
      });
    });

    // Build directed edges with smoothstep curves and arrowheads
    const edgesList: Edge[] = [];

    if (rawEdges.length > 0) {
      rawEdges.forEach((e, idx) => {
        const sourceNode = rawNodes.find((n) => n.id === e.fromId);
        const isBottleneck = (sourceNode?.mastery ?? 100) < 40;
        const isConnected =
          e.fromId === selectedNodeId || e.toId === selectedNodeId;

        edgesList.push({
          id: `edge-${idx}`,
          source: e.fromId,
          target: e.toId,
          type: "smoothstep",
          animated: isBottleneck || isConnected,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isConnected
              ? "var(--primary, #3b82f6)"
              : isBottleneck
                ? "#f43f5e"
                : "#64748b",
            width: 16,
            height: 16,
          },
          style: {
            stroke: isConnected
              ? "var(--primary, #3b82f6)"
              : isBottleneck
                ? "#f43f5e"
                : "#475569",
            strokeWidth: isConnected ? 2.5 : 1.5,
            strokeDasharray: isBottleneck && !isConnected ? "5,5" : undefined,
          },
        });
      });
    } else {
      // Fallback: connect consecutive depth levels toward target
      const sortedByDepth = [...rawNodes].sort((a, b) => b.depth - a.depth);
      for (let i = 0; i < sortedByDepth.length - 1; i++) {
        const source = sortedByDepth[i];
        const target = sortedByDepth[i + 1];
        const isBottleneck = source.mastery < 40;
        const isConnected =
          source.id === selectedNodeId || target.id === selectedNodeId;

        edgesList.push({
          id: `edge-auto-${i}`,
          source: source.id,
          target: target.id,
          type: "smoothstep",
          animated: isBottleneck || isConnected,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isConnected
              ? "var(--primary, #3b82f6)"
              : isBottleneck
                ? "#f43f5e"
                : "#64748b",
            width: 16,
            height: 16,
          },
          style: {
            stroke: isConnected
              ? "var(--primary, #3b82f6)"
              : isBottleneck
                ? "#f43f5e"
                : "#475569",
            strokeWidth: isConnected ? 2.5 : 1.5,
          },
        });
      }
    }

    return { flowNodes: nodesList, flowEdges: edgesList };
  }, [rawNodes, rawEdges, selectedNodeId, targetConceptId]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id);
      if (onSelectNode) onSelectNode(node.id);
    },
    [onSelectNode],
  );

  const selectedNode =
    rawNodes.find((n) => n.id === selectedNodeId) ?? rawNodes[0];
  const roundedSelectedMastery = selectedNode
    ? Math.round(selectedNode.mastery)
    : 0;

  if (rawNodes.length === 0) return null;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Graph Visual Canvas via React Flow */}
      <div className="glass-card rounded-2xl border border-border/80 relative overflow-hidden bg-background/60 shadow-xl">
        {/* Header & Legend Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2 px-5 py-3.5 border-b border-border/60 bg-card/40">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              Interactive Prerequisite DAG
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Mastered (≥85%)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>Developing (40-84%)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              <span>Root Cause Gap (&lt;40%)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full ring-2 ring-primary bg-primary/20" />
              <span>Target</span>
            </span>
          </div>
        </div>

        {/* React Flow Container */}
        <div className="w-full h-70 sm:h-80 relative">
          <ReactFlow
            nodes={flowNodes}
            edges={flowEdges}
            nodeTypes={nodeTypes}
            onNodeClick={handleNodeClick}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            minZoom={0.5}
            maxZoom={1.5}
            proOptions={{ hideAttribution: true }}
            nodesDraggable={true}
            nodesConnectable={false}
          >
            <Background color="#334155" gap={20} size={1} />
            <Controls
              showInteractive={false}
              className="bg-background/80! border-border/60! rounded-xl! shadow-md! [&>button]:fill-foreground!"
            />
          </ReactFlow>
        </div>

        <p className="text-[11px] text-muted-foreground text-center py-2 border-t border-border/40 bg-card/20">
          💡 Drag or click any concept node to inspect root causes or start
          targeted remediation.
        </p>
      </div>

      {/* Selected Node Details Card (Bug-Free Compact Flex Layout) */}
      {selectedNode && (
        <div className="glass-card rounded-xl p-4 sm:p-5 flex items-center justify-between flex-wrap gap-4 border-primary/20 animate-fade-in bg-primary/5">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Mastery Score Badge Circle (Guaranteed No Overlap with shrink-0 & Math.round) */}
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white font-bold text-xs shadow-sm",
                roundedSelectedMastery >= 85
                  ? "bg-emerald-500"
                  : roundedSelectedMastery < 40
                    ? "bg-rose-500 animate-pulse"
                    : "bg-amber-500",
              )}
            >
              {roundedSelectedMastery}%
            </div>

            {/* Concept Info */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-foreground truncate max-w-70">
                  {selectedNode.name}
                </h4>
                {selectedNode.isTarget && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-semibold">
                    Current Target
                  </span>
                )}
                {roundedSelectedMastery < 40 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-semibold flex items-center gap-0.5">
                    <AlertTriangle className="h-2.5 w-2.5" />
                    Root Cause Gap
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Prerequisite Depth Level: {selectedNode.depth} •{" "}
                {roundedSelectedMastery >= 85
                  ? "Solid Foundation"
                  : roundedSelectedMastery < 40
                    ? "Identified bottleneck blocking downstream concepts"
                    : "Developing understanding"}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/dashboard/gaps/${selectedNode.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-background transition-colors"
            >
              <Info className="h-3.5 w-3.5" />
              Gap Analysis
            </Link>
            <Link
              href={`/dashboard/practice?conceptId=${selectedNode.id}${
                courseId ? `&courseId=${courseId}` : ""
              }`}
              className="inline-flex items-center gap-1.5 rounded-lg gradient-brand text-white px-3.5 py-1.5 text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              <Zap className="h-3.5 w-3.5" />
              Practice Concept
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
