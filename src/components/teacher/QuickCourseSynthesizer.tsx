"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Zap,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Edit2,
  Check,
  Trash2,
  Plus,
  HelpCircle,
  Layers,
  Network,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SynthesizedConcept {
  name: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
}

interface SynthesizedEdge {
  prerequisiteName: string;
  conceptName: string;
  weight: number;
}

interface SynthesizedQuestion {
  conceptName: string;
  questionText: string;
  options: Array<{ key: "A" | "B" | "C" | "D"; text: string }>;
  correctAnswer: "A" | "B" | "C" | "D";
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
}

interface SynthesisResult {
  courseTitle: string;
  courseSubject: string;
  concepts: SynthesizedConcept[];
  edges: SynthesizedEdge[];
  questions?: SynthesizedQuestion[];
  isAiGenerated: boolean;
  courseId?: string;
  persisted?: boolean;
  cycleDetected?: boolean;
}

interface ExampleSubject {
  name: string;
  text: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DIFFICULTY_COLOR: Record<SynthesizedConcept["difficulty"], string> = {
  easy: "text-[var(--mastery-high)] bg-[var(--mastery-high)]/10 border-[var(--mastery-high)]/20",
  medium:
    "text-[var(--mastery-mid)] bg-[var(--mastery-mid)]/10 border-[var(--mastery-mid)]/20",
  hard: "text-[var(--mastery-low)] bg-[var(--mastery-low)]/10 border-[var(--mastery-low)]/20",
};

const EXAMPLE_SUBJECTS: ExampleSubject[] = [
  {
    name: "Artificial Intelligence",
    text: "Artificial Intelligence: State Space Search, Heuristic Search (A*), Minimax & Alpha-Beta Pruning, Constraint Satisfaction, Propositional Logic, Knowledge Representation, Machine Learning Basics",
  },
  {
    name: "Data Mining and Warehousing",
    text: "Data Mining and Warehousing: Data Preprocessing, Data Warehousing & OLAP, Association Rule Mining (Apriori), Classification (Decision Trees), Cluster Analysis (K-Means), Outlier Detection",
  },
  {
    name: "Operating Systems",
    text: "Operating Systems: Process Scheduling, Concurrency & Synchronization, Deadlock Prevention, Memory Management & Paging, Virtual Memory, File Systems",
  },
  {
    name: "Database Management Systems",
    text: "Database Management Systems: Relational Model, SQL Queries, Schema Normalization (1NF-BCNF), Transaction ACID, Concurrency Control, Indexing & B+ Trees",
  },
  {
    name: "Computer Networks",
    text: "Computer Networks: OSI Model, Data Link Framing, IP Addressing & Subnetting, Routing Protocols, TCP/UDP Transport, Congestion Control, DNS & HTTP",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * QuickCourseSynthesizer
 *
 * Lets a teacher paste any course subject or syllabus text and synthesize
 * a full knowledge graph AND diagnostic practice questions.
 *
 * Strict Zero-Trust Architecture:
 * - Synthesis produces a draft in memory ONLY. Nothing is saved to DB.
 * - Teacher inspects concepts, prerequisite edges, and questions in review tabs.
 * - Only after explicit final confirmation is the course persisted to the database.
 */
interface QuickCourseSynthesizerProps {
  isModal?: boolean;
  onClose?: () => void;
}

export function QuickCourseSynthesizer({ isModal = false, onClose }: QuickCourseSynthesizerProps = {}) {
  const router = useRouter();
  const [topicText, setTopicText] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "preview" | "saving" | "saved" | "error"
  >("idle");
  const [result, setResult] = useState<SynthesisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Review tabs
  const [reviewTab, setReviewTab] = useState<
    "concepts" | "edges" | "questions"
  >("concepts");

  // Inline editing of synthesized course title during preview
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");

  // Inline concept adding during preview
  const [showAddConcept, setShowAddConcept] = useState(false);
  const [newConceptName, setNewConceptName] = useState("");
  const [newConceptDesc, setNewConceptDesc] = useState("");
  const [newConceptDiff, setNewConceptDiff] = useState<
    "easy" | "medium" | "hard"
  >("medium");

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleSynthesize() {
    const trimmed = topicText.trim();
    if (trimmed.length < 5) return;

    setStatus("loading");
    setResult(null);
    setErrorMessage("");
    setIsEditingTitle(false);
    setShowAddConcept(false);
    setReviewTab("concepts");

    try {
      // Derive initial subject name if text starts with "Subject Name:"
      const inferredTitle = trimmed.includes(":")
        ? trimmed.split(":")[0].trim()
        : undefined;

      // Note: persist is explicitly FALSE. Nothing is saved to DB.
      const res = await fetch("/api/ai/synthesize-dag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicText: trimmed,
          courseTitle: inferredTitle,
          persist: false,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error || `Request failed with status ${res.status}`,
        );
      }

      setResult(data as SynthesisResult);
      setEditedTitle(data.courseTitle || inferredTitle || "New Course");
      setStatus("preview");
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Synthesis failed. Please try again.",
      );
      setStatus("error");
    }
  }

  // Teacher manual edits in preview: delete a concept
  function handleDeleteConcept(indexToDelete: number) {
    if (!result) return;
    const conceptToDelete = result.concepts[indexToDelete];
    const updatedConcepts = result.concepts.filter(
      (_, i) => i !== indexToDelete,
    );
    const updatedEdges = result.edges.filter(
      (e) =>
        e.prerequisiteName !== conceptToDelete.name &&
        e.conceptName !== conceptToDelete.name,
    );
    const updatedQuestions = (result.questions ?? []).filter(
      (q) => q.conceptName !== conceptToDelete.name,
    );
    setResult({
      ...result,
      concepts: updatedConcepts,
      edges: updatedEdges,
      questions: updatedQuestions,
    });
  }

  // Teacher manual edits in preview: add a new concept
  function handleAddConcept() {
    if (!result || !newConceptName.trim()) return;
    const updatedConcepts = [
      ...result.concepts,
      {
        name: newConceptName.trim(),
        description:
          newConceptDesc.trim() || `Core concepts in ${newConceptName.trim()}`,
        difficulty: newConceptDiff,
      },
    ];
    setResult({
      ...result,
      concepts: updatedConcepts,
    });
    setNewConceptName("");
    setNewConceptDesc("");
    setNewConceptDiff("medium");
    setShowAddConcept(false);
  }

  // Teacher manual edits in preview: delete an edge
  function handleDeleteEdge(indexToDelete: number) {
    if (!result) return;
    const updatedEdges = result.edges.filter((_, i) => i !== indexToDelete);
    setResult({
      ...result,
      edges: updatedEdges,
    });
  }

  // Teacher manual edits in preview: delete a question
  function handleDeleteQuestion(indexToDelete: number) {
    if (!result) return;
    const updatedQuestions = (result.questions ?? []).filter(
      (_, i) => i !== indexToDelete,
    );
    setResult({
      ...result,
      questions: updatedQuestions,
    });
  }

  // Final confirmation: commits reviewed course to database
  async function handleConfirmAndSave() {
    if (!result) return;
    setStatus("saving");

    const finalTitle = editedTitle.trim() || result.courseTitle;

    try {
      const res = await fetch("/api/ai/synthesize-dag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseTitle: finalTitle,
          courseSubject: result.courseSubject,
          concepts: result.concepts,
          edges: result.edges,
          questions: result.questions ?? [],
          topicText: topicText.trim() || finalTitle,
          persist: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to save course");
      }

      setResult(data as SynthesisResult);
      setStatus("saved");

      // Redirect teacher directly to Curriculum Editor for final confirmation & editing
      if (data.courseId) {
        onClose?.();
        router.push(`/teacher/courses/${data.courseId}/concepts`);
        router.refresh();
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Save failed. Please try again.",
      );
      setStatus("error");
    }
  }

  function handleReset() {
    setTopicText("");
    setResult(null);
    setEditedTitle("");
    setIsEditingTitle(false);
    setShowAddConcept(false);
    setReviewTab("concepts");
    setStatus("idle");
    setErrorMessage("");
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={cn(isModal ? "space-y-5" : "glass-card rounded-2xl p-6 space-y-5")}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary mt-0.5">
          <Zap className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-bold text-base flex items-center gap-2">
            AI Course Synthesizer
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-primary/20 bg-primary/10 text-[10px] font-semibold text-primary">
              <Sparkles className="h-3 w-3" />
              Zero Authoring
            </span>
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Paste any subject syllabus — AI extracts concepts, prerequisite
            dependencies, and practice questions. Review and edit everything
            before saving.
          </p>
        </div>
      </div>

      {/* Input Area */}
      {(status === "idle" || status === "error") && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label
              htmlFor="topic-text"
              className="text-xs font-medium text-muted-foreground"
            >
              Subject / Syllabus Text
            </label>
            <textarea
              id="topic-text"
              value={topicText}
              onChange={(e) => setTopicText(e.target.value)}
              placeholder="e.g. Artificial Intelligence: State Space Search, Heuristic Search, Minimax, Logic, Planning, Neural Networks..."
              rows={4}
              maxLength={3000}
              className="w-full rounded-xl border border-border bg-background/50 px-3.5 py-2.5 text-sm text-foreground focus:outline-none resize-none transition-colors"
            />
            <p className="text-xs text-muted-foreground text-right">
              {topicText.length}/3000 characters
            </p>
          </div>

          {/* Quick-fill academic subjects */}
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground font-medium">
              Quick examples:
            </p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_SUBJECTS.map((sub, i) => (
                <button
                  key={i}
                  id={`example-subject-${i}`}
                  type="button"
                  onClick={() => setTopicText(sub.text)}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-lg border transition-all text-left",
                    topicText.startsWith(sub.name)
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          </div>

          {status === "error" && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-3.5 py-3 text-xs text-amber-300">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            id="synthesize-btn"
            disabled={topicText.trim().length < 5}
            onClick={handleSynthesize}
            className={cn(
              "w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2",
              topicText.trim().length >= 5
                ? "gradient-brand text-white glow-brand hover:opacity-90"
                : "bg-muted text-muted-foreground cursor-not-allowed",
            )}
          >
            <Sparkles className="h-4 w-4" />
            Synthesize Prerequisite Graph with AI
          </button>
        </div>
      )}

      {/* Loading State */}
      {status === "loading" && (
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <div className="text-sm text-center space-y-1">
            <p className="font-medium text-foreground">
              Synthesizing Subject Knowledge Graph & Practice Questions…
            </p>
            <p className="text-xs">
              Extracting concepts, inferring prerequisite DAG, generating
              diagnostic MCQs
            </p>
          </div>
        </div>
      )}

      {/* Preview + Edit + Final Confirmation */}
      {(status === "preview" || status === "saving" || status === "saved") &&
        result && (
          <div className="space-y-5 animate-slide-up">
            {/* Zero-trust banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
              <span className="flex items-center gap-1.5 font-semibold text-amber-100">
                <ShieldCheck className="h-4 w-4 text-amber-400" />
                Draft Mode — Not Saved to Database
              </span>
              <span>
                Review concepts, prerequisites, and questions below. Nothing is
                saved until you confirm.
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

                  {/* Inline Title Edit */}
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
                <span className="text-xs text-amber-400 font-medium px-2 py-0.5 rounded border border-amber-500/20 bg-amber-500/10 shrink-0">
                  Fallback Mode
                </span>
              )}
            </div>

            {/* Review Navigation Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-background/60 border border-border">
              <button
                type="button"
                onClick={() => setReviewTab("concepts")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all",
                  reviewTab === "concepts"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Layers className="h-3.5 w-3.5" />
                Concepts ({result.concepts.length})
              </button>

              <button
                type="button"
                onClick={() => setReviewTab("edges")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all",
                  reviewTab === "edges"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Network className="h-3.5 w-3.5" />
                Prerequisites ({result.edges.length})
              </button>

              <button
                type="button"
                onClick={() => setReviewTab("questions")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all",
                  reviewTab === "questions"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <HelpCircle className="h-3.5 w-3.5" />
                Practice Questions ({result.questions?.length ?? 0})
              </button>
            </div>

            {/* Tab 1: Concepts */}
            {reviewTab === "concepts" && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {result.concepts.length} Concepts in Knowledge Graph
                  </p>
                  {status !== "saved" && (
                    <button
                      onClick={() => setShowAddConcept(!showAddConcept)}
                      className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {showAddConcept ? "Cancel" : "Add Concept"}
                    </button>
                  )}
                </div>

                {/* Add concept inline form */}
                {showAddConcept && status !== "saved" && (
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2.5 animate-slide-up">
                    <p className="text-xs font-semibold text-foreground">
                      Add Custom Concept
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Concept name (e.g. Heuristic Search)"
                        value={newConceptName}
                        onChange={(e) => setNewConceptName(e.target.value)}
                        className="sm:col-span-2 text-xs rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none"
                      />
                      <select
                        value={newConceptDiff}
                        onChange={(e) =>
                          setNewConceptDiff(
                            e.target.value as "easy" | "medium" | "hard",
                          )
                        }
                        className="text-xs rounded-lg border border-border bg-background px-2.5 py-2 text-foreground focus:outline-none"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <input
                      type="text"
                      placeholder="Brief description (optional)"
                      value={newConceptDesc}
                      onChange={(e) => setNewConceptDesc(e.target.value)}
                      className="w-full text-xs rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowAddConcept(false)}
                        className="text-xs px-2.5 py-1 rounded border border-border text-muted-foreground hover:text-foreground"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddConcept}
                        disabled={!newConceptName.trim()}
                        className="text-xs px-3 py-1 rounded bg-primary text-primary-foreground font-medium disabled:opacity-50"
                      >
                        Add to Graph
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {result.concepts.map((concept, i) => (
                    <div
                      key={i}
                      className="group rounded-xl border border-border bg-background/40 px-3.5 py-3 space-y-1 relative transition-colors hover:border-border/80"
                    >
                      <div className="flex items-center justify-between gap-2 pr-6">
                        <span className="text-sm font-medium truncate text-foreground">
                          {concept.name}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full border font-medium capitalize shrink-0",
                            DIFFICULTY_COLOR[concept.difficulty],
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
                          onClick={() => handleDeleteConcept(i)}
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
                        className="group flex items-center gap-2 text-xs text-foreground/80 rounded-lg border border-border bg-background/30 px-3 py-2"
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
                            onClick={() => handleDeleteEdge(i)}
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
                    {result.questions?.length ?? 0} AI-Generated Practice
                    Questions
                  </p>
                  <span className="text-[11px] text-muted-foreground">
                    Diagnostic MCQs generated for student practice
                  </span>
                </div>

                {!result.questions || result.questions.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-xl border-border">
                    No questions generated. You can author questions in the
                    Curriculum Editor.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {result.questions.map((q, i) => (
                      <div
                        key={i}
                        className="group rounded-xl border border-border bg-background/40 p-3.5 space-y-2 relative"
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
                                  : "border-border/60 bg-background/30 text-muted-foreground",
                              )}
                            >
                              <span
                                className={cn(
                                  "font-bold text-[10px] px-1 rounded",
                                  opt.key === q.correctAnswer
                                    ? "bg-mastery-high text-white"
                                    : "bg-muted text-muted-foreground",
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
                            onClick={() => handleDeleteQuestion(i)}
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
                      Course &ldquo;{result.courseTitle}&rdquo; successfully
                      confirmed and saved!
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Redirecting to the Curriculum Editor to review final
                      questions and concepts…
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex gap-3 pt-2">
                <button
                  id="discard-synthesis-btn"
                  onClick={handleReset}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
                >
                  Discard Draft
                </button>
                <button
                  id="save-synthesis-btn"
                  disabled={status === "saving" || result.concepts.length === 0}
                  onClick={handleConfirmAndSave}
                  className="flex-2 py-2.5 px-4 rounded-xl gradient-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {status === "saving" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving Confirmed Course to Database…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Confirm & Save Course to Database (
                      {result.concepts.length} Concepts,{" "}
                      {result.questions?.length ?? 0} Questions)
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
    </div>
  );
}
