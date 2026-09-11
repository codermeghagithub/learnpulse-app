"use client";

import { useState } from "react";
import {
  BookOpen,
  Edit2,
  Check,
  Trash2,
  Plus,
  HelpCircle,
  Layers,
  Network,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type {
  SynthesisResult,
  SynthesizedConcept,
  Difficulty,
} from "@/types/curriculum";

const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  easy: "text-success bg-success/10 border-success/20",
  medium: "text-warning bg-warning/10 border-warning/20",
  hard: "text-destructive bg-destructive/10 border-destructive/20",
};

interface SynthesisPreviewProps {
  result: SynthesisResult;
  status: "preview" | "saving" | "saved";
  errorMessage?: string;
  editedTitle: string;
  setEditedTitle: (title: string) => void;
  isEditingTitle: boolean;
  setIsEditingTitle: (editing: boolean) => void;
  onDeleteConcept: (index: number) => void;
  onAddConcept: (concept: SynthesizedConcept) => void;
  onDeleteEdge: (index: number) => void;
  onDeleteQuestion: (index: number) => void;
  onConfirmAndSave: () => void;
  onDiscard: () => void;
}

// Interactive preview allowing teachers to inspect and modify concepts, DAG edges, and questions before saving
export function SynthesisPreview({
  result,
  status,
  errorMessage,
  editedTitle,
  setEditedTitle,
  isEditingTitle,
  setIsEditingTitle,
  onDeleteConcept,
  onAddConcept,
  onDeleteEdge,
  onDeleteQuestion,
  onConfirmAndSave,
  onDiscard,
}: SynthesisPreviewProps) {
  const [reviewTab, setReviewTab] = useState<"concepts" | "edges" | "questions">("concepts");
  const [showAddConcept, setShowAddConcept] = useState(false);
  const [newConceptName, setNewConceptName] = useState("");
  const [newConceptDesc, setNewConceptDesc] = useState("");
  const [newConceptDiff, setNewConceptDiff] = useState<Difficulty>("medium");

  function handleCreateConcept() {
    if (!newConceptName.trim()) return;
    onAddConcept({
      name: newConceptName.trim(),
      description: newConceptDesc.trim() || `Core concepts in ${newConceptName.trim()}`,
      difficulty: newConceptDiff,
    });
    setNewConceptName("");
    setNewConceptDesc("");
    setNewConceptDiff("medium");
    setShowAddConcept(false);
  }

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Zero-trust draft banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800">
        <span className="flex items-center gap-1.5 font-semibold text-amber-900">
          <ShieldCheck className="h-4 w-4 dark:text-amber-400" />
          Draft Mode — Not Saved to Database
        </span>
        <span>
          Review concepts, prerequisites, and questions below. Nothing is saved until you confirm.
        </span>
      </div>

      {/* Course Header Banner */}
      <div className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                Course Name
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                {result.courseSubject}
              </span>
            </div>

            {isEditingTitle ? (
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="text-sm font-bold bg-background border border-primary/40 rounded px-2 py-0.5 text-foreground focus:outline-none w-full max-w-sm"
                  autoFocus
                />
                <button
                  onClick={() => setIsEditingTitle(false)}
                  className="p-1 text-primary hover:bg-primary/10 rounded"
                  title="Done editing"
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-0.5">
                <h3 className="text-base font-bold text-foreground truncate">
                  {editedTitle || result.courseTitle}
                </h3>
                {status !== "saved" && (
                  <button
                    onClick={() => setIsEditingTitle(true)}
                    className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
                    title="Rename course"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {!result.isAiGenerated && (
          <span className="text-xs text-amber-800 font-medium px-2 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 shrink-0">
            Fallback Mode
          </span>
        )}
      </div>

      {/* Review Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/60 border border-border">
        <Button
          type="button"
          variant={reviewTab === "concepts" ? "default" : "ghost"}
          size="sm"
          onClick={() => setReviewTab("concepts")}
          className="flex-1 text-xs font-semibold"
        >
          <Layers className="h-3.5 w-3.5" />
          Concepts ({result.concepts.length})
        </Button>

        <Button
          type="button"
          variant={reviewTab === "edges" ? "default" : "ghost"}
          size="sm"
          onClick={() => setReviewTab("edges")}
          className="flex-1 text-xs font-semibold"
        >
          <Network className="h-3.5 w-3.5" />
          Prerequisites ({result.edges.length})
        </Button>

        <Button
          type="button"
          variant={reviewTab === "questions" ? "default" : "ghost"}
          size="sm"
          onClick={() => setReviewTab("questions")}
          className="flex-1 text-xs font-semibold"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          Practice Questions ({result.questions?.length ?? 0})
        </Button>
      </div>

      {/* Tab 1: Concepts */}
      {reviewTab === "concepts" && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {result.concepts.length} Concepts in Knowledge Graph
            </p>
            {status !== "saved" && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setShowAddConcept(!showAddConcept)}
                className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                {showAddConcept ? "Cancel" : "Add Concept"}
              </Button>
            )}
          </div>

          {showAddConcept && status !== "saved" && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2.5 animate-slide-up">
              <p className="text-xs font-semibold text-foreground">
                Add Custom Concept
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input
                  type="text"
                  placeholder="Concept name (e.g. Heuristic Search)"
                  value={newConceptName}
                  onChange={(e) => setNewConceptName(e.target.value)}
                  className="sm:col-span-2 text-xs"
                />
                <Select
                  value={newConceptDiff}
                  onChange={(e) =>
                    setNewConceptDiff(e.target.value as Difficulty)
                  }
                  className="text-xs h-9"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </Select>
              </div>
              <Input
                type="text"
                placeholder="Brief description (optional)"
                value={newConceptDesc}
                onChange={(e) => setNewConceptDesc(e.target.value)}
                className="w-full text-xs"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setShowAddConcept(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="xs"
                  onClick={handleCreateConcept}
                  disabled={!newConceptName.trim()}
                >
                  Add to Graph
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {result.concepts.map((concept, i) => (
              <div
                key={i}
                className="group rounded-xl border border-border bg-card px-3.5 py-3 space-y-1 relative transition-colors hover:border-border/80 shadow-xs"
              >
                <div className="flex items-center justify-between gap-2 pr-6">
                  <span className="text-sm font-medium truncate text-foreground">
                    {concept.name}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-xs border font-medium capitalize shrink-0",
                      DIFFICULTY_COLOR[concept.difficulty]
                    )}
                  >
                    {concept.difficulty}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed pr-6">
                  {concept.description}
                </p>
                {status !== "saved" && result.concepts.length > 2 && (
                  <button
                    onClick={() => onDeleteConcept(i)}
                    title="Remove concept"
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-red-400 rounded"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Prerequisites */}
      {reviewTab === "edges" && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {result.edges.length} Prerequisite Dependencies
            </p>
            <span className="text-[11px] text-muted-foreground">
              Hover to delete unwanted dependencies
            </span>
          </div>
          {result.edges.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-xl border-border">
              No dependencies specified yet.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {result.edges.map((edge, i) => (
                <div
                  key={i}
                  className="group flex items-center gap-2 text-xs text-foreground rounded-lg border border-border bg-card px-3 py-2 shadow-xs"
                >
                  <span className="font-medium text-primary">
                    {edge.prerequisiteName}
                  </span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span>{edge.conceptName}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground font-mono mr-2">
                    {(edge.weight * 100).toFixed(0)}% req
                  </span>
                  {status !== "saved" && (
                    <button
                      onClick={() => onDeleteEdge(i)}
                      title="Remove dependency"
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-red-400 rounded"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Practice Questions */}
      {reviewTab === "questions" && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {result.questions?.length ?? 0} AI-Generated Practice Questions
            </p>
            <span className="text-[11px] text-muted-foreground">
              Diagnostic MCQs generated for student practice
            </span>
          </div>

          {!result.questions || result.questions.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-xl border-border">
              No questions generated. You can author questions in the Curriculum Editor.
            </div>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {result.questions.map((q, i) => (
                <div
                  key={i}
                  className="group rounded-xl border border-border bg-card p-3.5 space-y-2 relative shadow-xs"
                >
                  <div className="flex items-center justify-between gap-2 pr-6">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      {q.conceptName}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground capitalize">
                      {q.difficulty}
                    </span>
                  </div>

                  <p className="text-xs font-medium text-foreground pr-6">
                    {q.questionText}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                    {q.options.map((opt) => (
                      <div
                        key={opt.key}
                        className={cn(
                          "text-xs rounded-lg px-2.5 py-1.5 border flex items-start gap-2",
                          opt.key === q.correctAnswer
                            ? "border-(--mastery-high)/40 bg-(--mastery-high)/10 text-foreground font-medium"
                            : "border-border bg-muted/30 text-muted-foreground"
                        )}
                      >
                        <span
                          className={cn(
                            "font-bold text-[10px] px-1 rounded",
                            opt.key === q.correctAnswer
                              ? "bg-mastery-high text-white"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {opt.key}
                        </span>
                        <span className="leading-tight">{opt.text}</span>
                      </div>
                    ))}
                  </div>

                  {q.explanation && (
                    <p className="text-[11px] text-muted-foreground italic border-t border-border/40 pt-1.5">
                      <span className="font-semibold not-italic text-foreground/80">
                        Explanation:{" "}
                      </span>
                      {q.explanation}
                    </p>
                  )}

                  {status !== "saved" && (
                    <button
                      onClick={() => onDeleteQuestion(i)}
                      title="Remove question"
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-red-400 rounded"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Row */}
      {status === "saved" ? (
        <div className="space-y-3 rounded-xl border border-(--mastery-high)/30 bg-(--mastery-high)/5 p-4">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-mastery-high shrink-0" />
            <div>
              <p className="text-sm font-semibold text-mastery-high">
                Course &ldquo;{result.courseTitle}&rdquo; successfully confirmed and saved!
              </p>
              <p className="text-xs text-muted-foreground">
                Redirecting to the Curriculum Editor to review final questions and concepts…
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3 pt-2">
          {errorMessage && (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3.5 py-3 text-xs text-destructive font-medium animate-shake">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}
          <div className="flex gap-3">
            <Button
              id="discard-synthesis-btn"
              variant="outline"
              onClick={onDiscard}
              className="flex-1"
            >
              Discard Draft
            </Button>
            <Button
              id="save-synthesis-btn"
              disabled={status === "saving" || result.concepts.length === 0}
              onClick={onConfirmAndSave}
              className="flex-2 cursor-pointer font-semibold"
            >
              {status === "saving" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Confirmed Course to Database…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Confirm & Save Course to Database ({result.concepts.length} Concepts,{" "}
                  {result.questions?.length ?? 0} Questions)
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
