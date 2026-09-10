"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createConceptAction,
  deleteConceptAction,
  createPrerequisiteEdgeAction,
  deletePrerequisiteEdgeAction,
  createQuestionAction,
  deleteQuestionAction,
  deleteCourseAction,
} from "@/app/actions/authoring";
import {
  ArrowLeft,
  BookOpen,
  GitFork,
  HelpCircle,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Layers,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import { SyllabusIngestionModal } from "@/components/teacher/SyllabusIngestionModal";
import { InteractiveDagGraph } from "@/components/mastery/InteractiveDagGraph";


interface Concept {
  id: string;
  name: string;
  description: string | null;
  difficulty: string;
}

interface Edge {
  id: string;
  prerequisite_id: string;
  concept_id: string;
  weight: number;
}

interface Question {
  id: string;
  concept_id: string;
  question_text: string;
  options: Array<{ key: string; text: string }>;
  correct_answer: string;
  explanation?: string;
  difficulty: "easy" | "medium" | "hard";
}

interface CourseAuthoringClientProps {
  course: {
    id: string;
    title: string;
    subject: string;
  };
  initialConcepts: Concept[];
  initialEdges: Edge[];
  initialQuestions: Question[];
  classAverageMasteryMap?: Record<string, { average: number; studentCount: number }>;
}

export function CourseAuthoringClient({
  course,
  initialConcepts,
  initialEdges,
  initialQuestions,
  classAverageMasteryMap = {},
}: CourseAuthoringClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"concepts" | "prerequisites" | "questions">("concepts");

  // State
  const [concepts, setConcepts] = useState<Concept[]>(initialConcepts);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);

  // Concept Form State
  const [conceptName, setConceptName] = useState("");
  const [conceptDesc, setConceptDesc] = useState("");
  const [conceptDiff, setConceptDiff] = useState<"easy" | "medium" | "hard">("medium");
  const [conceptLoading, setConceptLoading] = useState(false);
  const [conceptError, setConceptError] = useState<string | null>(null);

  // Prerequisite Form State
  const [prereqA, setPrereqA] = useState("");
  const [prereqB, setPrereqB] = useState("");
  const [edgeWeight, setEdgeWeight] = useState(2);
  const [edgeLoading, setEdgeLoading] = useState(false);
  const [edgeError, setEdgeError] = useState<string | null>(null);
  const [edgeSuccess, setEdgeSuccess] = useState<string | null>(null);

  // Question Form State
  const [qConceptId, setQConceptId] = useState(concepts[0]?.id ?? "");
  const [qText, setQText] = useState("");
  const [optA, setOptA] = useState("");
  const [optB, setOptB] = useState("");
  const [optC, setOptC] = useState("");
  const [optD, setOptD] = useState("");
  const [qCorrect, setQCorrect] = useState("A");
  const [qExplanation, setQExplanation] = useState("");
  const [qDiff, setQDiff] = useState<"easy" | "medium" | "hard">("medium");
  const [qLoading, setQLoading] = useState(false);
  const [qError, setQError] = useState<string | null>(null);

  // Concept Name Lookup Map
  const conceptMap = new Map(concepts.map((c) => [c.id, c.name]));

  // --- Handlers ---

  async function handleAddConcept(e: React.FormEvent) {
    e.preventDefault();
    setConceptError(null);
    setConceptLoading(true);

    const res = await createConceptAction(course.id, {
      name: conceptName,
      description: conceptDesc,
      difficulty: conceptDiff,
    });

    setConceptLoading(false);
    if (res.error) {
      setConceptError(res.error);
    } else if (res.concept) {
      setConcepts((prev) => [...prev, { ...res.concept!, description: conceptDesc }]);
      setConceptName("");
      setConceptDesc("");
      if (!qConceptId) setQConceptId(res.concept.id);
      router.refresh();
    }
  }

  async function handleDeleteConcept(conceptId: string) {
    if (!confirm("Are you sure you want to delete this concept? Dependent prerequisites and questions will also be removed.")) return;
    const res = await deleteConceptAction(course.id, conceptId);
    if (res.success) {
      setConcepts((prev) => prev.filter((c) => c.id !== conceptId));
      setEdges((prev) => prev.filter((e) => e.prerequisite_id !== conceptId && e.concept_id !== conceptId));
      setQuestions((prev) => prev.filter((q) => q.concept_id !== conceptId));
      router.refresh();
    }
  }

  async function handleAddPrerequisite(e: React.FormEvent) {
    e.preventDefault();
    setEdgeError(null);
    setEdgeSuccess(null);

    if (!prereqA || !prereqB) {
      setEdgeError("Please select both concept A and concept B.");
      return;
    }
    if (prereqA === prereqB) {
      setEdgeError("A concept cannot be a prerequisite of itself.");
      return;
    }

    setEdgeLoading(true);
    const res = await createPrerequisiteEdgeAction(course.id, prereqA, prereqB, edgeWeight);
    setEdgeLoading(false);

    if (res.error) {
      setEdgeError(res.error);
    } else {
      const nameA = conceptMap.get(prereqA) || "Concept A";
      const nameB = conceptMap.get(prereqB) || "Concept B";
      setEdgeSuccess(`Added prerequisite: "${nameA}" is prerequisite of "${nameB}".`);
      setEdges((prev) => [
        ...prev,
        {
          id: Math.random().toString(), // temporary until refreshed
          prerequisite_id: prereqA,
          concept_id: prereqB,
          weight: edgeWeight,
        },
      ]);
      setPrereqA("");
      setPrereqB("");
      router.refresh();
    }
  }

  async function handleDeleteEdge(edgeId: string) {
    const res = await deletePrerequisiteEdgeAction(course.id, edgeId);
    if (res.success) {
      setEdges((prev) => prev.filter((e) => e.id !== edgeId));
      router.refresh();
    }
  }

  async function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault();
    setQError(null);

    const activeConceptTarget = qConceptId || concepts[0]?.id;
    if (!activeConceptTarget) {
      setQError("Please create a concept first.");
      return;
    }

    if (qText.trim().length < 5) {
      setQError("Question text must be at least 5 characters.");
      return;
    }

    if (!optA.trim() || !optB.trim() || !optC.trim() || !optD.trim()) {
      setQError("All four options (A, B, C, D) are required.");
      return;
    }

    setQLoading(true);
    const res = await createQuestionAction(course.id, {
      concept_id: activeConceptTarget,
      question_text: qText,
      options: [
        { key: "A", text: optA },
        { key: "B", text: optB },
        { key: "C", text: optC },
        { key: "D", text: optD },
      ],
      correct_answer: qCorrect,
      explanation: qExplanation,
      difficulty: qDiff,
    });
    setQLoading(false);

    if (res.error) {
      setQError(res.error);
    } else {
      setQuestions((prev) => [
        ...prev,
        {
          id: res.questionId || Math.random().toString(),
          concept_id: activeConceptTarget,
          question_text: qText,
          options: [
            { key: "A", text: optA },
            { key: "B", text: optB },
            { key: "C", text: optC },
            { key: "D", text: optD },
          ],
          correct_answer: qCorrect,
          explanation: qExplanation,
          difficulty: qDiff,
        },
      ]);
      setQText("");
      setOptA("");
      setOptB("");
      setOptC("");
      setOptD("");
      setQExplanation("");
      router.refresh();
    }
  }

  const [deletingCourse, setDeletingCourse] = useState(false);

  async function handleDeleteQuestion(qId: string) {
    const res = await deleteQuestionAction(course.id, qId);
    if (res.success) {
      setQuestions((prev) => prev.filter((q) => q.id !== qId));
      router.refresh();
    }
  }

  function handleDeleteCourse() {
    toast(
      ({ closeToast }) => (
        <div className="space-y-3 py-1">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-destructive/15 text-destructive flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-foreground">
                Permanently delete &ldquo;{course.title}&rdquo;?
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This will remove all associated concepts, prerequisite dependencies, and questions.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
            <button
              type="button"
              onClick={closeToast}
              className="px-3 py-1.5 text-xs rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                closeToast();
                setDeletingCourse(true);
                const toastId = toast.loading(`Deleting "${course.title}"...`);
                const res = await deleteCourseAction(course.id);
                if (res?.error) {
                  toast.update(toastId, {
                    render: `Failed to delete course: ${res.error}`,
                    type: "error",
                    isLoading: false,
                    autoClose: 4000,
                    closeButton: true,
                  });
                  setDeletingCourse(false);
                } else {
                  toast.update(toastId, {
                    render: `Course "${course.title}" deleted successfully`,
                    type: "success",
                    isLoading: false,
                    autoClose: 2500,
                    closeButton: true,
                  });
                  router.push("/teacher");
                  router.refresh();
                }
              }}
              className="px-3.5 py-1.5 text-xs rounded-lg bg-destructive text-white hover:bg-destructive/90 transition-colors font-semibold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Yes, Delete Course
            </button>
          </div>
        </div>
      ),
      {
        toastId: `delete-course-${course.id}`,
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        closeButton: true,
      }
    );
  }

  return (
    <div className="px-8 py-8 max-w-5xl mx-auto space-y-8 animate-slide-up">
      {/* Top navigation */}
      <div className="flex items-center justify-between">
        <Link
          href={`/teacher?courseId=${course.id}`}
          id="back-to-class-overview"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Class Overview
        </Link>
        <div className="flex items-center gap-2.5">
          <SyllabusIngestionModal
            courseId={course.id}
            courseTitle={course.title}
            courseSubject={course.subject}
            onSuccess={() => router.refresh()}
          />
          <span className="text-xs font-semibold px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary">
            {course.subject}
          </span>

          <button
            id="delete-course-btn"
            type="button"
            onClick={handleDeleteCourse}
            disabled={deletingCourse}
            className="inline-flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/90 font-medium bg-destructive/10 hover:bg-destructive/15 border border-destructive/20 px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
            title="Delete this course"
          >
            {deletingCourse ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Delete Course
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{course.title}</h1>
            <p className="text-sm text-muted-foreground">
              Author course curriculum, prerequisite dependencies with cycle check, and practice MCQs.
            </p>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
          <div className="text-center p-2 rounded-xl bg-background/50 border border-border/50">
            <p className="text-xs text-muted-foreground">Concepts</p>
            <p className="text-lg font-bold text-foreground">{concepts.length}</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-background/50 border border-border/50">
            <p className="text-xs text-muted-foreground">Prerequisites (DAG)</p>
            <p className="text-lg font-bold text-foreground">{edges.length}</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-background/50 border border-border/50">
            <p className="text-xs text-muted-foreground">MCQ Questions</p>
            <p className="text-lg font-bold text-foreground">{questions.length}</p>
          </div>
        </div>
      </div>

      {/* Authoring Tabs */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveTab("concepts")}
          id="tab-concepts"
          className={cn(
            "flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all",
            activeTab === "concepts"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Layers className="h-4 w-4" />
          1. Concepts ({concepts.length})
        </button>

        <button
          onClick={() => setActiveTab("prerequisites")}
          id="tab-prerequisites"
          className={cn(
            "flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all",
            activeTab === "prerequisites"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <GitFork className="h-4 w-4" />
          2. Prerequisites DAG ({edges.length})
        </button>

        <button
          onClick={() => setActiveTab("questions")}
          id="tab-questions"
          className={cn(
            "flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all",
            activeTab === "questions"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <HelpCircle className="h-4 w-4" />
          3. Practice Questions ({questions.length})
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: CONCEPTS
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "concepts" && (
        <div className="space-y-8 animate-fade-in">
          {/* Add Concept Form */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              Add Concept to Course
            </h2>

            {conceptError && (
              <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{conceptError}</span>
              </div>
            )}

            <form onSubmit={handleAddConcept} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label htmlFor="concept-name" className="text-xs font-medium">
                    Concept Name <span className="text-primary">*</span>
                  </label>
                  <input
                    id="concept-name"
                    type="text"
                    required
                    value={conceptName}
                    onChange={(e) => setConceptName(e.target.value)}
                    placeholder="e.g. Memory Management, CPU Scheduling"
                    className="w-full rounded-xl border border-border bg-input/50 px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="concept-difficulty" className="text-xs font-medium">
                    Difficulty Level
                  </label>
                  <select
                    id="concept-difficulty"
                    value={conceptDiff}
                    onChange={(e) => setConceptDiff(e.target.value as "easy" | "medium" | "hard")}
                    className="w-full rounded-xl border border-border bg-input/50 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="easy">Easy (Foundational)</option>
                    <option value="medium">Medium (Core)</option>
                    <option value="hard">Hard (Advanced)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="concept-desc" className="text-xs font-medium">
                  Concept Description
                </label>
                <textarea
                  id="concept-desc"
                  rows={2}
                  value={conceptDesc}
                  onChange={(e) => setConceptDesc(e.target.value)}
                  placeholder="Brief summary of learning objectives and key topics covered..."
                  className="w-full rounded-xl border border-border bg-input/50 px-3.5 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <button
                type="submit"
                id="add-concept-btn"
                disabled={conceptLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
              >
                {conceptLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add Concept
              </button>
            </form>
          </div>

          {/* Concepts List */}
          <div className="space-y-4">
            <h2 className="text-base font-semibold">
              Course Concepts ({concepts.length})
            </h2>

            {concepts.length === 0 ? (
              <div className="glass-card rounded-2xl p-10 text-center space-y-3">
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
                      className="glass-card rounded-xl p-4 flex flex-col justify-between space-y-3 border hover:border-primary/30 transition-all"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-sm">{c.name}</h3>
                          <span
                            className={cn(
                              "text-[11px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider",
                              c.difficulty === "easy"
                                ? "bg-emerald-500/15 text-emerald-500"
                                : c.difficulty === "medium"
                                  ? "bg-amber-500/15 text-amber-500"
                                  : "bg-rose-500/15 text-rose-500"
                            )}
                          >
                            {c.difficulty}
                          </span>
                        </div>
                        {c.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {c.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs text-muted-foreground">
                        <span>{qCount} question{qCount !== 1 ? "s" : ""}</span>
                        <button
                          onClick={() => handleDeleteConcept(c.id)}
                          className="text-muted-foreground hover:text-destructive p-1 rounded-lg transition-colors"
                          title="Delete concept"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: PREREQUISITES (DAG with Cycle Check)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "prerequisites" && (
        <div className="space-y-8 animate-fade-in">
          {concepts.length < 2 ? (
            <div className="glass-card rounded-2xl p-10 text-center space-y-4">
              <GitFork className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="font-semibold">At least 2 concepts required</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Please add at least 2 concepts in the Concepts tab before establishing prerequisite dependencies.
              </p>
              <button
                onClick={() => setActiveTab("concepts")}
                className="text-sm text-primary font-semibold hover:underline"
              >
                Go to Concepts tab →
              </button>
            </div>
          ) : (
            <>
              {/* Live Curriculum DAG Visualizer */}
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
                courseId={course.id}
                mode="teacher"
              />

              {/* Add Prerequisite Edge Form */}
              <div className="glass-card rounded-2xl p-6 space-y-4">
                <div className="space-y-1">
                  <h2 className="text-base font-semibold flex items-center gap-2">
                    <GitFork className="h-4 w-4 text-primary" />
                    Define Prerequisite Relationship
                  </h2>

                  <p className="text-xs text-muted-foreground">
                    Declare which concept must be mastered prior to learning another. Cycles are automatically detected and rejected.
                  </p>
                </div>

                {/* Error Banner (e.g. Cycle Detection) */}
                {edgeError && (
                  <div
                    id="cycle-error-banner"
                    className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive animate-fade-in"
                  >
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold">Prerequisite Blocked</p>
                      <p className="text-xs text-destructive/90">{edgeError}</p>
                    </div>
                  </div>
                )}

                {/* Success Banner */}
                {edgeSuccess && (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-500 animate-fade-in">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{edgeSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleAddPrerequisite} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-7 gap-3 items-center">
                    {/* Concept A */}
                    <div className="sm:col-span-3 space-y-1">
                      <label htmlFor="prereq-a-select" className="text-xs font-medium">
                        Concept A (Prerequisite)
                      </label>
                      <select
                        id="prereq-a-select"
                        required
                        value={prereqA}
                        onChange={(e) => {
                          setPrereqA(e.target.value);
                          setEdgeError(null);
                        }}
                        className="w-full rounded-xl border border-border bg-input/50 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <option value="">Select prerequisite concept…</option>
                        {concepts.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.difficulty})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Arrow Indicator */}
                    <div className="sm:col-span-1 text-center font-medium text-xs text-muted-foreground flex flex-col items-center justify-center pt-4">
                      <span>is required for</span>
                      <ArrowRight className="h-4 w-4 text-primary mt-0.5" />
                    </div>

                    {/* Concept B */}
                    <div className="sm:col-span-3 space-y-1">
                      <label htmlFor="prereq-b-select" className="text-xs font-medium">
                        Concept B (Dependent)
                      </label>
                      <select
                        id="prereq-b-select"
                        required
                        value={prereqB}
                        onChange={(e) => {
                          setPrereqB(e.target.value);
                          setEdgeError(null);
                        }}
                        className="w-full rounded-xl border border-border bg-input/50 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <option value="">Select dependent concept…</option>
                        {concepts.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.difficulty})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <label htmlFor="edge-weight" className="text-xs text-muted-foreground">
                        Dependency Strength:
                      </label>
                      <select
                        id="edge-weight"
                        value={edgeWeight}
                        onChange={(e) => setEdgeWeight(Number(e.target.value))}
                        className="rounded-lg border border-border bg-input/50 px-2 py-1 text-xs"
                      >
                        <option value={1}>1 (Mild)</option>
                        <option value={2}>2 (Strong / Standard)</option>
                        <option value={3}>3 (Critical / Absolute)</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      id="save-prerequisite-btn"
                      disabled={edgeLoading || !prereqA || !prereqB}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
                    >
                      {edgeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      Add Prerequisite
                    </button>
                  </div>
                </form>
              </div>

              {/* Existing Edges List */}
              <div className="space-y-4">
                <h2 className="text-base font-semibold">
                  Configured Prerequisite Chains ({edges.length})
                </h2>

                {edges.length === 0 ? (
                  <div className="glass-card rounded-2xl p-8 text-center space-y-2 text-muted-foreground text-sm">
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
                          className="glass-card rounded-xl p-3.5 flex items-center justify-between border hover:border-primary/30 transition-all text-sm"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-primary">{nameA}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              is prerequisite for <ArrowRight className="h-3.5 w-3.5" />
                            </span>
                            <span className="font-semibold text-foreground">{nameB}</span>
                            <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded bg-muted">
                              weight {e.weight}
                            </span>
                          </div>

                          <button
                            onClick={() => handleDeleteEdge(e.id)}
                            className="text-muted-foreground hover:text-destructive p-1 rounded-lg transition-colors"
                            title="Remove prerequisite"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: PRACTICE QUESTIONS
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "questions" && (
        <div className="space-y-8 animate-fade-in">
          {concepts.length === 0 ? (
            <div className="glass-card rounded-2xl p-10 text-center space-y-3">
              <HelpCircle className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="font-semibold">No concepts available</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Questions must be anchored to a specific concept. Add at least one concept in the Concepts tab first.
              </p>
            </div>
          ) : (
            <>
              {/* Add Question Form */}
              <div className="glass-card rounded-2xl p-6 space-y-4">
                <div className="space-y-1">
                  <h2 className="text-base font-semibold flex items-center gap-2">
                    <Plus className="h-4 w-4 text-primary" />
                    Author Practice Question (MCQ)
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Students will practice these questions to build and track their EWMA mastery score.
                  </p>
                </div>

                {qError && (
                  <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{qError}</span>
                  </div>
                )}

                <form onSubmit={handleAddQuestion} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 space-y-1.5">
                      <label htmlFor="q-concept-select" className="text-xs font-medium">
                        Target Concept <span className="text-primary">*</span>
                      </label>
                      <select
                        id="q-concept-select"
                        required
                        value={qConceptId || concepts[0]?.id}
                        onChange={(e) => setQConceptId(e.target.value)}
                        className="w-full rounded-xl border border-border bg-input/50 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        {concepts.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.difficulty})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="q-difficulty-select" className="text-xs font-medium">
                        Question Difficulty
                      </label>
                      <select
                        id="q-difficulty-select"
                        value={qDiff}
                        onChange={(e) => setQDiff(e.target.value as "easy" | "medium" | "hard")}
                        className="w-full rounded-xl border border-border bg-input/50 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <option value="easy">Easy (Multiplier: 0.8)</option>
                        <option value="medium">Medium (Multiplier: 1.0)</option>
                        <option value="hard">Hard (Multiplier: 1.2)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="q-text-input" className="text-xs font-medium">
                      Question Prompt <span className="text-primary">*</span>
                    </label>
                    <textarea
                      id="q-text-input"
                      rows={2}
                      required
                      value={qText}
                      onChange={(e) => setQText(e.target.value)}
                      placeholder="What is the primary difference between...?"
                      className="w-full rounded-xl border border-border bg-input/50 px-3.5 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  {/* 4 Options */}
                  <div className="space-y-3">
                    <label className="text-xs font-medium">
                      Answer Choices & Correct Option <span className="text-primary">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { key: "A", val: optA, set: setOptA },
                        { key: "B", val: optB, set: setOptB },
                        { key: "C", val: optC, set: setOptC },
                        { key: "D", val: optD, set: setOptD },
                      ].map((item) => (
                        <div
                          key={item.key}
                          className={cn(
                            "flex items-center gap-2 rounded-xl border p-2.5 transition-all",
                            qCorrect === item.key ? "border-primary bg-primary/10" : "border-border bg-input/40"
                          )}
                        >
                          <input
                            type="radio"
                            id={`radio-${item.key}`}
                            name="correct_answer_radio"
                            checked={qCorrect === item.key}
                            onChange={() => setQCorrect(item.key)}
                            className="text-primary focus:ring-primary h-4 w-4"
                          />
                          <span className="text-xs font-bold text-muted-foreground w-4">
                            {item.key}
                          </span>
                          <input
                            type="text"
                            required
                            value={item.val}
                            onChange={(e) => item.set(e.target.value)}
                            placeholder={`Option ${item.key} text`}
                            className="flex-1 bg-transparent text-sm focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Click the radio button next to the correct answer choice.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="q-explanation-input" className="text-xs font-medium">
                      Answer Explanation
                    </label>
                    <textarea
                      id="q-explanation-input"
                      rows={2}
                      value={qExplanation}
                      onChange={(e) => setQExplanation(e.target.value)}
                      placeholder="Why is this the correct answer? This is displayed to the student after submission."
                      className="w-full rounded-xl border border-border bg-input/50 px-3.5 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  <button
                    type="submit"
                    id="add-question-btn"
                    disabled={qLoading}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
                  >
                    {qLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Save Question
                  </button>
                </form>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                <h2 className="text-base font-semibold">
                  Course Practice Questions ({questions.length})
                </h2>

                {questions.length === 0 ? (
                  <div className="glass-card rounded-2xl p-8 text-center space-y-2 text-muted-foreground text-sm">
                    No questions added yet for this course. Add at least 1-2 questions per concept so students can practice.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {questions.map((q, idx) => {
                      const cName = conceptMap.get(q.concept_id) ?? "Unknown";
                      return (
                        <div
                          key={q.id}
                          className="glass-card rounded-xl p-4 space-y-3 border hover:border-primary/30 transition-all text-sm"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                                  {cName}
                                </span>
                                <span className="text-[10px] text-muted-foreground uppercase">
                                  {q.difficulty}
                                </span>
                              </div>
                              <p className="font-medium text-foreground pt-1">
                                Q{idx + 1}. {q.question_text}
                              </p>
                            </div>

                            <button
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="text-muted-foreground hover:text-destructive p-1 rounded-lg transition-colors shrink-0"
                              title="Delete question"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Options grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {q.options.map((opt) => (
                              <div
                                key={opt.key}
                                className={cn(
                                  "px-3 py-1.5 rounded-lg border",
                                  opt.key === q.correct_answer
                                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500 font-semibold"
                                    : "border-border/50 text-muted-foreground"
                                )}
                              >
                                <span className="mr-1.5 font-bold">{opt.key}.</span> {opt.text}
                              </div>
                            ))}
                          </div>

                          {q.explanation && (
                            <p className="text-xs text-muted-foreground border-t border-border/50 pt-2 italic">
                              Explanation: {q.explanation}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
