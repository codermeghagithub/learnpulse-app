"use client";

import { useState } from "react";
import { GitFork, Plus, Trash2, AlertCircle, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { InteractiveDagGraph } from "@/components/mastery/InteractiveDagGraph";
import { createPrerequisiteEdgeAction, deletePrerequisiteEdgeAction } from "@/app/actions/authoring";
import type { Concept, Edge } from "./types";

interface PrerequisitesTabProps {
  courseId: string;
  concepts: Concept[];
  edges: Edge[];
  conceptMap: Map<string, string>;
  classAverageMasteryMap?: Record<string, { average: number; studentCount: number }>;
  onEdgeAdded: (edge: Edge) => void;
  onEdgeDeleted: (edgeId: string) => void;
  onNavigateToConcepts: () => void;
}

export function PrerequisitesTab({
  courseId,
  concepts,
  edges,
  conceptMap,
  classAverageMasteryMap = {},
  onEdgeAdded,
  onEdgeDeleted,
  onNavigateToConcepts,
}: PrerequisitesTabProps) {
  const [prereqA, setPrereqA] = useState("");
  const [prereqB, setPrereqB] = useState("");
  const [edgeWeight, setEdgeWeight] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleAddPrerequisite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!prereqA || !prereqB) {
      setError("Please select both concept A and concept B.");
      return;
    }
    if (prereqA === prereqB) {
      setError("A concept cannot be a prerequisite of itself.");
      return;
    }

    setLoading(true);
    const res = await createPrerequisiteEdgeAction(courseId, prereqA, prereqB, edgeWeight);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      const nameA = conceptMap.get(prereqA) || "Concept A";
      const nameB = conceptMap.get(prereqB) || "Concept B";
      setSuccess(`Added prerequisite: "${nameA}" is prerequisite of "${nameB}".`);
      onEdgeAdded({
        id: Math.random().toString(),
        prerequisite_id: prereqA,
        concept_id: prereqB,
        weight: edgeWeight,
      });
      setPrereqA("");
      setPrereqB("");
    }
  }

  async function handleDeleteEdge(edgeId: string) {
    const res = await deletePrerequisiteEdgeAction(courseId, edgeId);
    if (res.success) {
      onEdgeDeleted(edgeId);
    }
  }

  if (concepts.length < 2) {
    return (
      <div className="glass-card rounded-xl p-10 text-center space-y-4 animate-fade-in">
        <GitFork className="h-8 w-8 text-muted-foreground mx-auto" />
        <p className="font-semibold">At least 2 concepts required</p>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Please add at least 2 concepts in the Concepts tab before establishing prerequisite dependencies.
        </p>
        <button
          onClick={onNavigateToConcepts}
          className="text-sm text-primary font-semibold hover:underline cursor-pointer"
        >
          Go to Concepts tab →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <InteractiveDagGraph
        nodes={concepts.map((c) => {
          const prereqCount = edges.filter((e) => e.concept_id === c.id).length;
          const stat = classAverageMasteryMap[c.id];
          return {
            id: c.id,
            name: c.name,
            mastery: stat?.average ?? 0,
            depth: prereqCount > 0 ? prereqCount : 0,
            difficulty: c.difficulty,
          };
        })}
        edges={edges.map((e) => ({
          fromId: e.prerequisite_id,
          toId: e.concept_id,
          weight: e.weight,
        }))}
        courseId={courseId}
        mode="teacher"
      />

      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <GitFork className="h-4 w-4 text-primary" />
            Define Prerequisite Relationship
          </h2>
          <p className="text-xs text-muted-foreground">
            Declare which concept must be mastered prior to learning another. Cycles are automatically detected and rejected.
          </p>
        </div>

        {error && (
          <div
            id="cycle-error-banner"
            className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive animate-fade-in"
          >
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Prerequisite Blocked</p>
              <p className="text-xs text-destructive/90">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-500 animate-fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleAddPrerequisite} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-7 gap-3 items-center">
            <div className="sm:col-span-3 space-y-1">
              <Label htmlFor="prereq-a-select" className="text-xs font-medium">
                Concept A (Prerequisite)
              </Label>
              <Select
                id="prereq-a-select"
                required
                value={prereqA}
                onChange={(e) => {
                  setPrereqA(e.target.value);
                  setError(null);
                }}
              >
                <option value="">Select prerequisite concept…</option>
                {concepts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.difficulty})
                  </option>
                ))}
              </Select>
            </div>

            <div className="sm:col-span-1 text-center font-medium text-xs text-muted-foreground flex flex-col items-center justify-center pt-4">
              <span>is required for</span>
              <ArrowRight className="h-4 w-4 text-primary mt-0.5" />
            </div>

            <div className="sm:col-span-3 space-y-1">
              <Label htmlFor="prereq-b-select" className="text-xs font-medium">
                Concept B (Dependent)
              </Label>
              <Select
                id="prereq-b-select"
                required
                value={prereqB}
                onChange={(e) => {
                  setPrereqB(e.target.value);
                  setError(null);
                }}
              >
                <option value="">Select dependent concept…</option>
                {concepts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.difficulty})
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="edge-weight" className="text-xs text-muted-foreground">
                Dependency Strength:
              </Label>
              <Select
                id="edge-weight"
                value={edgeWeight}
                onChange={(e) => setEdgeWeight(Number(e.target.value))}
                className="text-xs h-8 w-44"
              >
                <option value={1}>1 (Mild)</option>
                <option value={2}>2 (Strong / Standard)</option>
                <option value={3}>3 (Critical / Absolute)</option>
              </Select>
            </div>

            <Button
              type="submit"
              id="save-prerequisite-btn"
              disabled={loading || !prereqA || !prereqB}
              className="cursor-pointer"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add Prerequisite
            </Button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-semibold">
          Configured Prerequisite Chains ({edges.length})
        </h2>

        {edges.length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center space-y-2 text-muted-foreground text-sm">
            No prerequisites declared yet. All concepts currently behave as foundational roots.
          </div>
        ) : (
          <div className="space-y-2.5">
            {edges.map((e) => {
              const nameA = conceptMap.get(e.prerequisite_id) ?? "Unknown";
              const nameB = conceptMap.get(e.concept_id) ?? "Unknown";
              return (
                <div
                  key={e.id}
                  className="glass-card rounded-xl p-3.5 flex items-center justify-between border-2 border-border shadow-[2px_2px_0px_var(--shadow-color)] hover:shadow-[3px_3px_0px_var(--shadow-color)] transition-all text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-primary">{nameA}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      is prerequisite for <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                    <span className="font-semibold text-foreground">{nameB}</span>
                    <Badge variant="outline" className="text-[10px]">
                      weight {e.weight}
                    </Badge>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleDeleteEdge(e.id)}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                    title="Remove prerequisite"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
