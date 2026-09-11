"use client";

import { useState } from "react";
import { Plus, Trash2, AlertCircle, Loader2, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { createConceptAction, deleteConceptAction } from "@/app/actions/authoring";
import type { Concept, Question } from "./types";

interface ConceptsTabProps {
  courseId: string;
  concepts: Concept[];
  questions: Question[];
  onConceptAdded: (concept: Concept) => void;
  onConceptDeleted: (conceptId: string) => void;
}

export function ConceptsTab({
  courseId,
  concepts,
  questions,
  onConceptAdded,
  onConceptDeleted,
}: ConceptsTabProps) {
  const [conceptName, setConceptName] = useState("");
  const [conceptDesc, setConceptDesc] = useState("");
  const [conceptDiff, setConceptDiff] = useState<"easy" | "medium" | "hard">("medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAddConcept(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await createConceptAction(courseId, {
      name: conceptName,
      description: conceptDesc,
      difficulty: conceptDiff,
    });

    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else if (res.concept) {
      onConceptAdded({ ...res.concept, description: conceptDesc });
      setConceptName("");
      setConceptDesc("");
    }
  }

  async function handleDeleteConcept(conceptId: string) {
    if (!confirm("Are you sure you want to delete this concept? Dependent prerequisites and questions will also be removed.")) {
      return;
    }
    const res = await deleteConceptAction(courseId, conceptId);
    if (res.success) {
      onConceptDeleted(conceptId);
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="glass-card rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Plus className="h-4 w-4 text-primary" />
          Add Concept to Course
        </h2>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAddConcept} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="concept-name" className="text-xs font-medium">
                Concept Name <span className="text-primary">*</span>
              </Label>
              <Input
                id="concept-name"
                type="text"
                required
                value={conceptName}
                onChange={(e) => setConceptName(e.target.value)}
                placeholder="e.g. Memory Management, CPU Scheduling"
                className="w-full rounded-xl border-border bg-input/50 px-3.5 py-2.5 h-10 text-sm placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="concept-difficulty" className="text-xs font-medium">
                Difficulty Level
              </Label>
              <Select
                id="concept-difficulty"
                value={conceptDiff}
                onChange={(e) => setConceptDiff(e.target.value as "easy" | "medium" | "hard")}
              >
                <option value="easy">Easy (Foundational)</option>
                <option value="medium">Medium (Core)</option>
                <option value="hard">Hard (Advanced)</option>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="concept-desc" className="text-xs font-medium">
              Concept Description
            </Label>
            <Textarea
              id="concept-desc"
              rows={2}
              value={conceptDesc}
              onChange={(e) => setConceptDesc(e.target.value)}
              placeholder="Brief summary of learning objectives and key topics covered..."
              className="w-full rounded-xl border-border bg-input/50 px-3.5 py-2 text-sm placeholder:text-muted-foreground"
            />
          </div>

          <Button
            type="submit"
            id="add-concept-btn"
            disabled={loading}
            className="gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm cursor-pointer"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
            Add Concept
          </Button>
        </form>
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-semibold">
          Course Concepts ({concepts.length})
        </h2>

        {concepts.length === 0 ? (
          <div className="glass-card rounded-xl p-10 text-center space-y-3">
            <Layers className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="font-semibold">No concepts added yet</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Use the form above to add concepts to this course. Then define prerequisite connections.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {concepts.map((c) => {
              const qCount = questions.filter((q) => q.concept_id === c.id).length;
              return (
                <div
                  key={c.id}
                  className="glass-card rounded-xl p-4 flex flex-col justify-between space-y-3 border-2 border-border shadow-[2px_2px_0px_var(--shadow-color)] hover:shadow-[3px_3px_0px_var(--shadow-color)] transition-all"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">{c.name}</h3>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[11px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider",
                          c.difficulty === "easy"
                            ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                            : c.difficulty === "medium"
                              ? "bg-amber-500/15 text-amber-500 border-amber-500/30"
                              : "bg-rose-500/15 text-rose-500 border-rose-500/30"
                        )}
                      >
                        {c.difficulty}
                      </Badge>
                    </div>
                    {c.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {c.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs text-muted-foreground">
                    <span>{qCount} question{qCount !== 1 ? "s" : ""}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleDeleteConcept(c.id)}
                      className="text-muted-foreground hover:text-destructive p-1 rounded-lg transition-colors cursor-pointer"
                      title="Delete concept"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
