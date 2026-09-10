"use client";

import { useState, useEffect, useCallback } from "react";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { QuizCard } from "@/components/practice/QuizCard";
import { MasteryBar } from "@/components/mastery/MasteryBar";
import {
  Zap,
  ArrowRight,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Brain,
  CheckCircle2,
  Wifi,
  WifiOff,
  RefreshCw,
} from "lucide-react";
import { CourseSelector } from "@/components/CourseSelector";
import { MasteryExplainerModal } from "@/components/mastery/MasteryExplainerModal";
import { getMasteryStage, getAccuracyText } from "@/lib/masteryLevels";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  enqueueOfflineAttempt,
  getQueuedAttempts,
  syncOfflineAttempts,
  isBrowserOnline,
} from "@/lib/offline/offlineQueue";
import { computeScaledMastery } from "@/lib/algorithms/mastery";

interface ConceptInfo {
  id: string;
  name: string;
  score: number;
  attemptsCount?: number;
  correctCount?: number;
  isDue?: boolean;
  retentionScore?: number;
}

interface Question {
  id: string;
  concept_id?: string;
  question_text: string;
  options: Array<{ key: string; text: string }>;
  correct_answer?: string;
  explanation?: string;
  difficulty: "easy" | "medium" | "hard";
  isReviewQuestion?: boolean;
  originConceptId?: string;
}

interface MasteryUpdate {
  previousScore: number;
  newScore: number;
  gain: number;
  isCorrect: boolean;
  decayDiagnosis?: {
    confirmed: boolean;
    conceptId: string;
    conceptName: string;
    masteryScore: number;
    rootCause: string;
    explanation: string;
    actionPlan: Array<{ step: number; action: string }>;
  } | null;
}

interface Course {
  id: string;
  title: string;
  subject?: string;
}

interface PracticeClientProps {
  conceptList: ConceptInfo[];
  activeConcept: ConceptInfo;
  questions: Question[];
  allQuestions?: Question[];
  totalConceptQuestions?: number;
  masteredCount?: number;
  isAlreadyMastered?: boolean;
  initialMastery: number;
  userId: string;
  courses?: Course[];
  selectedCourseId?: string;
}

export function PracticeClient({
  conceptList,
  activeConcept,
  questions,
  allQuestions,
  totalConceptQuestions,
  masteredCount = 0,
  isAlreadyMastered = false,
  initialMastery,
  courses,
  selectedCourseId,
}: PracticeClientProps) {
  const router = useRouter();
  const [activeQuestions, setActiveQuestions] = useState<Question[]>(questions);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [currentMastery, setCurrentMastery] = useState(initialMastery);
  const [lastUpdate, setLastUpdate] = useState<MasteryUpdate | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(isAlreadyMastered);
  const [conceptAttempts, setConceptAttempts] = useState(
    activeConcept.attemptsCount ?? 0,
  );
  const [conceptCorrect, setConceptCorrect] = useState(
    activeConcept.correctCount ?? 0,
  );

  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleTriggerSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await syncOfflineAttempts();
      setPendingSyncCount(getQueuedAttempts().length);
      if (res.syncedCount > 0) {
        router.refresh();
      }
    } finally {
      setIsSyncing(false);
    }
  }, [router]);

  useEffect(() => {
    const queue = getQueuedAttempts();
    const isOnline = isBrowserOnline();

    const timer = setTimeout(() => {
      setPendingSyncCount(queue.length);
      setIsOfflineMode(!isOnline);
    }, 0);

    function handleOnline() {
      setIsOfflineMode(false);
      const q = getQueuedAttempts();
      if (q.length > 0) {
        handleTriggerSync();
      }
    }

    function handleOffline() {
      setIsOfflineMode(true);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [handleTriggerSync]);

  const currentConceptIdx = conceptList.findIndex(
    (c) => c.id === activeConcept.id,
  );
  const nextConcept =
    currentConceptIdx >= 0 && currentConceptIdx < conceptList.length - 1
      ? conceptList[currentConceptIdx + 1]
      : null;

  const currentQ = activeQuestions[currentIdx];

  async function handleSubmit(selectedAnswer: string) {
    if (!currentQ) return;

    try {
      if (!isBrowserOnline()) {
        throw new Error("Browser reports offline");
      }

      const res = await fetch("/api/submit-attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQ.id,
          selectedAnswer,
          conceptId: currentQ.concept_id ?? activeConcept.id,
          isReviewQuestion: currentQ.isReviewQuestion,
          originConceptId: currentQ.originConceptId,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: MasteryUpdate = await res.json();
      setCurrentMastery(data.newScore);
      setLastUpdate(data);
      setAnsweredCount((c) => c + 1);
      setConceptAttempts((a) => a + 1);
      if (data.isCorrect) {
        setConceptCorrect((c) => c + 1);
      }
      setIsOfflineMode(false);
      router.refresh();
    } catch (err) {
      // Offline fallback: enqueue attempt locally and compute optimistic scaled mastery
      console.warn(
        "[PracticeClient] Offline mode active, queuing attempt locally:",
        err,
      );
      enqueueOfflineAttempt({
        questionId: currentQ.id,
        selectedAnswer,
        conceptId: currentQ.concept_id ?? activeConcept.id,
        isReviewQuestion: currentQ.isReviewQuestion,
        originConceptId: currentQ.originConceptId,
      });

      const isCorrect = currentQ.correct_answer
        ? selectedAnswer === currentQ.correct_answer
        : true;
      const newAttempts = conceptAttempts + 1;
      const newCorrect = isCorrect ? conceptCorrect + 1 : conceptCorrect;
      const newScore = computeScaledMastery({
        totalConceptQuestions: totalConceptQuestions || activeQuestions.length,
        uniqueQuestionsCorrect: masteredCount + (isCorrect ? 1 : 0),
        totalAttempts: newAttempts,
        totalCorrect: newCorrect,
      });

      setCurrentMastery(newScore);
      setLastUpdate({
        previousScore: currentMastery,
        newScore,
        gain: newScore - currentMastery,
        isCorrect,
        decayDiagnosis: null,
      });
      setAnsweredCount((c) => c + 1);
      setConceptAttempts(newAttempts);
      setConceptCorrect(newCorrect);
      setIsOfflineMode(true);
      setPendingSyncCount(getQueuedAttempts().length);
    }
  }

  function handleNext() {
    setLastUpdate(null);
    if (currentIdx < activeQuestions.length - 1) {
      setCurrentIdx((i) => i + 1);
    } else {
      setIsCompleted(true);
    }
  }

  const isEmpty = activeQuestions.length === 0;

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pb-16 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="animate-slide-up flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Practice
            </h1>
            {(isOfflineMode || pendingSyncCount > 0) && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xs border-1.5 border-border bg-accent-yellow/20 text-foreground text-xs font-bold animate-fade-in shadow-[1px_1px_0px_var(--shadow-color)]">
                {isOfflineMode ? (
                  <WifiOff className="h-3.5 w-3.5 text-amber-400" />
                ) : (
                  <Wifi className="h-3.5 w-3.5 text-emerald-400" />
                )}
                <span>
                  {pendingSyncCount > 0
                    ? `${pendingSyncCount} saved locally • Ready to sync`
                    : "Practicing Offline"}
                </span>
                {pendingSyncCount > 0 && (
                  <button
                    type="button"
                    onClick={handleTriggerSync}
                    disabled={isSyncing}
                    className="ml-1 inline-flex items-center gap-1 font-bold underline hover:text-amber-200 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw
                      className={cn("h-3 w-3", isSyncing && "animate-spin")}
                    />
                    Save Progress
                  </button>
                )}
              </div>
            )}
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Answer quiz questions to build skills and improve your score
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <MasteryExplainerModal
            buttonText="How do these scores work?"
            variant="button"
          />
        </div>
      </div>

      {/* Course selector tabs */}
      {courses && courses.length > 0 && (
        <div className="animate-slide-up">
          <CourseSelector
            courses={courses}
            selectedCourseId={selectedCourseId ?? ""}
            basePath="/dashboard/practice"
          />
        </div>
      )}

      {/* Concept selector horizontally swipeable pill bar */}
      {conceptList.length > 1 && (
        <div className="animate-slide-up flex w-full items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 snap-x">
          {conceptList.map((c) => (
            <Link
              key={c.id}
              href={`/dashboard/practice?conceptId=${c.id}${selectedCourseId ? `&courseId=${selectedCourseId}` : ""}`}
              id={`concept-tab-${c.id}`}
              className={cn(
                "rounded-md border-2 px-3.5 py-2 min-h-11 text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 snap-start shadow-[1px_1px_0px_var(--shadow-color)]",
                c.id === activeConcept.id
                  ? "border-border bg-primary text-primary-foreground shadow-[2px_2px_0px_var(--shadow-color)]"
                  : c.isDue
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-500 hover:border-amber-500/60"
                    : "border-border bg-card text-foreground hover:bg-muted hover:shadow-[2px_2px_0px_var(--shadow-color)]",
              )}
            >
              <span>{c.name}</span>
              {c.isDue && (
                <span
                  className="text-xs text-amber-500 font-semibold"
                  title="Review Due"
                >
                  ⏳
                </span>
              )}
              <span
                className={cn(
                  "ml-1 text-xs tabular-nums font-bold",
                  c.id === activeConcept.id
                    ? "text-primary-foreground opacity-90"
                    : c.isDue
                      ? "text-amber-500"
                      : c.score < 40
                        ? "text-mastery-low"
                        : c.score < 70
                          ? "text-mastery-mid"
                          : "text-mastery-high",
                )}
              >
                {c.score.toFixed(0)}%
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* Mastery tracker */}
      <div className="glass-card rounded-xl p-5 animate-slide-up space-y-3 border-2 border-border shadow-[2px_2px_0px_var(--shadow-color)]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-bold text-base">{activeConcept.name}</span>
            {activeConcept.isDue ? (
              <Badge variant="warning" className="text-xs">
                ⏳ Fading — review due
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                {getMasteryStage(currentMastery, conceptAttempts).stageBadge}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {lastUpdate && lastUpdate.previousScore !== lastUpdate.newScore && (
              <div
                className={cn(
                  "flex items-center gap-1 text-sm font-semibold animate-slide-up",
                  lastUpdate.isCorrect
                    ? "text-mastery-high"
                    : "text-mastery-low",
                )}
              >
                {lastUpdate.gain > 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : null}
                {lastUpdate.previousScore}% → {lastUpdate.newScore}%
                {lastUpdate.gain > 0 && (
                  <span className="text-xs text-mastery-high">
                    (+{lastUpdate.gain})
                  </span>
                )}
              </div>
            )}
            <MasteryExplainerModal buttonText="How it works" variant="button" />
          </div>
        </div>

        <MasteryBar
          score={currentMastery}
          previousScore={lastUpdate?.previousScore}
          attemptsCount={conceptAttempts}
          correctCount={conceptCorrect}
          showLabel={false}
          size="md"
          isDue={activeConcept.isDue}
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs text-muted-foreground pt-0.5">
          <span className="font-medium text-foreground/90">
            {getAccuracyText(conceptCorrect, conceptAttempts, currentMastery)}
          </span>
          <span className="text-muted-foreground">
            {isCompleted ? (
              <span className="text-emerald-500 font-medium">
                All questions completed ✓
              </span>
            ) : (
              <>
                {masteredCount > 0 ? `${masteredCount} already solved • ` : ""}Q{" "}
                {Math.min(currentIdx + 1, activeQuestions.length)} of{" "}
                {activeQuestions.length}
              </>
            )}
          </span>
        </div>
      </div>

      {/* Quiz, completed state, or empty */}
      {isEmpty ? (
        <div className="glass-card rounded-xl p-10 text-center space-y-4 border-2 border-border shadow-[2px_2px_0px_var(--shadow-color)]">
          <Brain className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground text-sm font-medium">
            No questions available for this concept yet.
          </p>
        </div>
      ) : isCompleted ? (
        <div className="glass-card rounded-xl p-8 text-center space-y-6 animate-slide-up border-2 border-border shadow-[3px_3px_0px_var(--shadow-color)]">
          <div className="flex h-16 w-16 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-500 mx-auto border-2 border-border shadow-[1px_1px_0px_var(--shadow-color)]">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold">
              {currentMastery >= 85
                ? "Concept Fully Mastered! 🏆"
                : "Concept Practice Completed!"}
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {currentMastery >= 85
                ? `Congratulations! You've successfully answered all available practice questions for ${activeConcept.name}.`
                : `You've completed the practice questions for ${activeConcept.name}.`}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border max-w-md mx-auto text-left space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">
                Concept Mastery Score
              </span>
              <span className="font-bold text-foreground">
                {currentMastery.toFixed(0)}%
              </span>
            </div>
            <MasteryBar
              score={currentMastery}
              attemptsCount={conceptAttempts}
              correctCount={conceptCorrect}
              showLabel={true}
              size="md"
            />
            <p className="text-[11px] font-medium text-foreground/90 pt-1">
              {getAccuracyText(conceptCorrect, conceptAttempts, currentMastery)}
            </p>
            <p className="text-[11px] text-muted-foreground pt-1 border-t border-border/50">
              Mastery scales directly with question completion and accuracy. No
              repetitive grinding required.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {nextConcept && (
              <Link
                id="next-concept-btn"
                href={`/dashboard/practice?conceptId=${nextConcept.id}${selectedCourseId ? `&courseId=${selectedCourseId}` : ""}`}
                className={cn(buttonVariants(), "cursor-pointer")}
              >
                Next Concept: {nextConcept.name}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}

            <Button
              id="practice-again-btn"
              variant="outline"
              onClick={() => {
                if (allQuestions && allQuestions.length > 0) {
                  setActiveQuestions(allQuestions);
                }
                setCurrentIdx(0);
                setIsCompleted(false);
                setLastUpdate(null);
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Review All Questions
            </Button>

            <Link
              href={`/dashboard/gaps/${activeConcept.id}`}
              className={cn(buttonVariants({ variant: "outline" }), "cursor-pointer")}
            >
              View Gap Analysis
            </Link>
          </div>
        </div>
      ) : (
        <div className="animate-slide-up space-y-3">
          {currentQ?.isReviewQuestion && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs font-medium">
              <span className="text-base">⏳</span>
              <div>
                <strong>Forgetting-Curve Review Question</strong>: Testing
                long-term retention of prerequisite concept knowledge.
              </div>
            </div>
          )}

          {lastUpdate?.decayDiagnosis && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1.5 animate-slide-up text-xs">
              <div className="font-semibold text-amber-600 flex items-center gap-1.5">
                <span>⚠️</span>
                <span>
                  Root-Cause Trace: Decayed retention on{" "}
                  {lastUpdate.decayDiagnosis.conceptName}
                </span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {lastUpdate.decayDiagnosis.explanation}
              </p>
            </div>
          )}

          <QuizCard
            key={`${activeConcept.id}-${currentIdx}`}
            questionId={currentQ.id}
            conceptName={activeConcept.name}
            questionText={currentQ.question_text}
            options={currentQ.options}
            correctAnswer={currentQ.correct_answer ?? ""}
            explanation={currentQ.explanation}
            difficulty={currentQ.difficulty}
            questionNumber={currentIdx + 1}
            totalQuestions={activeQuestions.length}
            onSubmit={handleSubmit}
          />
        </div>
      )}

      {/* Navigation */}
      {!isEmpty && !isCompleted && (
        <div className="flex items-center justify-between animate-slide-up">
          <Button
            id="prev-question-btn"
            variant="outline"
            disabled={currentIdx === 0}
            onClick={() => {
              setCurrentIdx((i) => Math.max(0, i - 1));
              setLastUpdate(null);
            }}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex gap-2">
            <Button
              id="restart-practice-btn"
              variant="outline"
              size="sm"
              onClick={() => {
                setCurrentIdx(0);
                setLastUpdate(null);
                setAnsweredCount(0);
                setCurrentMastery(initialMastery);
              }}
              className="text-xs"
            >
              <RotateCcw className="h-3 w-3" />
              Restart
            </Button>

            <Button
              id="next-question-btn"
              onClick={handleNext}
              className="cursor-pointer"
            >
              {currentIdx < activeQuestions.length - 1
                ? "Next"
                : "Finish Concept Practice"}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Re-assess prompt */}
      {answeredCount >= 3 && !isCompleted && (
        <div className="glass-card rounded-xl p-4 text-center animate-slide-up">
          <p className="text-sm text-muted-foreground mb-3">
            You&apos;ve answered {answeredCount} questions. Want to review how you did?
          </p>
          <Link
            href={`/dashboard/gaps/${activeConcept.id}`}
            id="reassess-prompt-btn"
            className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline"
          >
            See Lesson Details &amp; Help
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
