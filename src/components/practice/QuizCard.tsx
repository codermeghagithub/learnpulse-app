"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  Brain,
  Sparkles,
  Lightbulb,
  Zap,
  MessageSquare,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuizOption {
  key: string;
  text: string;
}

interface MisconceptionResult {
  thoughtTrap: string;
  mentalAnchor: string;
  vernacularAnchor?: string;
  cognitiveDissonance: {
    paradoxScenario: string;
    counterQuestion: string;
  };
  isAiGenerated?: boolean;
}

export interface QuizCardProps {
  questionId?: string;
  conceptName?: string;
  questionText: string;
  options: QuizOption[];
  correctAnswer: string;
  explanation?: string;
  difficulty: "easy" | "medium" | "hard";
  questionNumber: number;
  totalQuestions: number;
  onSubmit: (selectedKey: string) => Promise<void>;
  isSubmitting?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DIFFICULTY_BADGE: Record<QuizCardProps["difficulty"], string> = {
  easy: "text-[var(--mastery-high)] bg-[var(--mastery-high)]/10 border-[var(--mastery-high)]/20",
  medium:
    "text-[var(--mastery-mid)] bg-[var(--mastery-mid)]/10 border-[var(--mastery-mid)]/20",
  hard: "text-[var(--mastery-low)] bg-[var(--mastery-low)]/10 border-[var(--mastery-low)]/20",
};

/** Inline fallback when the API is offline — keeps the UI from being empty. */
function buildClientFallback(
  selectedOpt: string,
  correctOpt: string,
  conceptName: string,
): MisconceptionResult {
  return {
    thoughtTrap: `You likely selected "${selectedOpt}" because both options play critical roles in ${conceptName || "this domain"}. However, "${selectedOpt}" handles a different phase of the operational lifecycle than "${correctOpt}".`,
    mentalAnchor: `Rule of thumb: Identify which component orchestrates or schedules work versus which component maintains state or runs nodes.`,
    vernacularAnchor: `याद रखें: ${conceptName || "इस टॉपिक"} में दोनों विकल्पों का काम अलग है — एक तैयारी करता है और दूसरा उसे प्रोसेस करता है।`,
    cognitiveDissonance: {
      paradoxScenario: `Imagine swapping "${selectedOpt}" and "${correctOpt}" in a live system. If they were truly equivalent, the output would remain identical — but in practice one prepares data while the other consumes it. The system would produce incorrect results.`,
      counterQuestion: `What specific output or behaviour would change if you replaced "${correctOpt}" with "${selectedOpt}" in a real implementation?`,
    },
    isAiGenerated: false,
  };
}


// ─── Component ────────────────────────────────────────────────────────────────

export function QuizCard({
  questionId,
  conceptName,
  questionText,
  options,
  correctAnswer,
  explanation,
  difficulty,
  questionNumber,
  totalQuestions,
  onSubmit,
  isSubmitting = false,
}: QuizCardProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Optional: student explains their reasoning before / after submitting
  const [studentReasoning, setStudentReasoning] = useState("");
  const [showReasoningInput, setShowReasoningInput] = useState(false);

  const [misconception, setMisconception] =
    useState<MisconceptionResult | null>(null);
  const [loadingMisconception, setLoadingMisconception] = useState(false);
  const [anchorLang, setAnchorLang] = useState<"en" | "hi">("en");

  const isBusy = loading || isSubmitting;

  const isCorrect = selected === correctAnswer;

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!selected || submitted) return;
    setLoading(true);
    setSubmitted(true);

    // Only trigger AI diagnosis when the student got it wrong
    if (selected !== correctAnswer) {
      setLoadingMisconception(true);
      const selectedOpt =
        options.find((o) => o.key === selected)?.text ?? selected;
      const correctOpt =
        options.find((o) => o.key === correctAnswer)?.text ?? correctAnswer;

      fetch("/api/ai/misconception", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: questionId || questionText,
          questionText,
          selectedOptionText: selectedOpt,
          selectedKey: selected,
          correctOptionText: correctOpt,
          conceptName: conceptName || "this concept",
          // Pass along any reasoning the student shared
          studentReasoning: studentReasoning.trim() || undefined,
        }),
      })
        .then(async (res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data) => {
          if (data?.thoughtTrap) {
            setMisconception(data as MisconceptionResult);
          } else {
            throw new Error("Unexpected response format");
          }
        })
        .catch(() => {
          const selectedOpt =
            options.find((o) => o.key === selected)?.text ?? selected;
          const correctOpt =
            options.find((o) => o.key === correctAnswer)?.text ?? correctAnswer;
          setMisconception(
            buildClientFallback(
              selectedOpt,
              correctOpt,
              conceptName || "this concept",
            ),
          );
        })
        .finally(() => setLoadingMisconception(false));
    }

    await onSubmit(selected);
    setLoading(false);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="glass-card rounded-2xl p-6 space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Question {questionNumber} of {totalQuestions}
        </span>
        <span
          className={cn(
            "text-xs px-2.5 py-1 rounded-full border font-medium capitalize",
            DIFFICULTY_BADGE[difficulty],
          )}
        >
          {difficulty}
        </span>
      </div>

      {/* Question */}
      <p className="text-base font-medium leading-relaxed">{questionText}</p>

      {/* Options */}
      <div className="space-y-2.5">
        {options.map((option) => {
          const isSelected = selected === option.key;
          const isThisCorrect = option.key === correctAnswer;

          let optionStyle =
            "border-border hover:border-primary/40 hover:bg-primary/5";
          if (submitted) {
            if (isThisCorrect)
              optionStyle =
                "border-[var(--mastery-high)]/50 bg-[var(--mastery-high)]/10";
            else if (isSelected && !isThisCorrect)
              optionStyle =
                "border-[var(--mastery-low)]/50 bg-[var(--mastery-low)]/10";
            else optionStyle = "border-border opacity-50";
          } else if (isSelected) {
            optionStyle = "border-primary bg-primary/10";
          }

          return (
            <button
              key={option.key}
              id={`option-${option.key}`}
              disabled={submitted}
              onClick={() => !submitted && setSelected(option.key)}
              className={cn(
                "w-full flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all duration-150",
                optionStyle,
                !submitted && "cursor-pointer",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-sm font-semibold",
                  isSelected && !submitted
                    ? "border-primary text-primary bg-primary/10"
                    : "border-border text-muted-foreground",
                  submitted &&
                    isThisCorrect &&
                    "border-mastery-high text-mastery-high bg-(--mastery-high)/10",
                )}
              >
                {submitted && isThisCorrect ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  option.key
                )}
              </span>
              <span className="text-sm leading-relaxed">{option.text}</span>
            </button>
          );
        })}
      </div>

      {/* Optional Reasoning Input — only shown before submission on incorrect attempts */}
      {!submitted && selected && selected !== correctAnswer && (
        <div className="space-y-2 animate-slide-up">
          {!showReasoningInput ? (
            <button
              id="show-reasoning-btn"
              onClick={() => setShowReasoningInput(true)}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Why did you pick this?{" "}
              <span className="text-primary font-medium">
                (helps AI tailor feedback)
              </span>
            </button>
          ) : (
            <div className="space-y-1.5">
              <label
                htmlFor="student-reasoning"
                className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Your reasoning (optional — makes AI diagnosis sharper):
              </label>
              <textarea
                id="student-reasoning"
                value={studentReasoning}
                onChange={(e) => setStudentReasoning(e.target.value)}
                placeholder="e.g. I picked this because I assumed locks always prevent deadlocks..."
                maxLength={500}
                rows={2}
                className="w-full rounded-xl border border-border bg-background/50 px-3 py-2 text-xs text-foreground focus:outline-none resize-none transition-colors"
              />
            </div>
          )}
        </div>
      )}

      {/* Feedback Section */}
      {submitted && (
        <div className="space-y-3 pt-1">
          {/* Status Banner */}
          <div
            className={cn(
              "rounded-xl border p-4 text-sm flex items-start gap-3",
              isCorrect
                ? "border-(--mastery-high)/40 bg-(--mastery-high)/10 text-mastery-high"
                : "border-(--mastery-low)/40 bg-(--mastery-low)/10 text-mastery-low",
            )}
          >
            {isCorrect ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-mastery-high mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 shrink-0 text-mastery-low mt-0.5" />
            )}
            <div className="space-y-1">
              <p className="font-bold text-sm">
                {isCorrect ? "✓ Correct Answer!" : "✗ Incorrect Selection"}
              </p>
              {explanation && (
                <p className="text-xs text-foreground/80 leading-relaxed">
                  {explanation}
                </p>
              )}
            </div>
          </div>

          {/* Mental Mirror + Cognitive Dissonance (shown only on wrong answers) */}
          {!isCorrect && (
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-4 animate-slide-up shadow-lg">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Brain className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <span>Mental Mirror</span>
                      <span className="text-[10px] text-muted-foreground font-normal">
                        • Cognitive Misconception Diagnosis
                      </span>
                    </h3>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-primary/20 bg-primary/10 text-[10px] font-semibold text-primary">
                  <Sparkles className="h-3 w-3" />
                  <span>AI Deconstructed</span>
                </div>
              </div>

              {loadingMisconception ? (
                <div className="flex items-center gap-3 py-3 text-xs text-muted-foreground animate-pulse">
                  <Sparkles className="h-4 w-4 text-primary animate-spin" />
                  <span>
                    Deconstructing why your brain selected Option ({selected}
                    )...
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Thought Trap */}
                  <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3.5 space-y-1.5">
                    <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <span>⚠️ The Thought Trap You Fell Into:</span>
                    </div>
                    <p className="text-xs text-foreground/90 leading-relaxed">
                      {misconception?.thoughtTrap ??
                        `You may have selected this option because both choices share closely related terminology in ${conceptName || "this subject"}.`}
                    </p>
                  </div>

                  {/* Mental Anchor */}
                  <div className="rounded-xl border border-primary/25 bg-primary/5 p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-primary flex items-center gap-1.5">
                        <Lightbulb className="h-3.5 w-3.5" />
                        <span>
                          💡 {anchorLang === "en" ? "10-Second Mental Anchor:" : "१०-सेकंड याद रखने का सूत्र (NEP 2020):"}
                        </span>
                      </div>
                      {misconception?.vernacularAnchor && (
                        <div className="flex items-center bg-background/80 border border-primary/20 rounded-md p-0.5 text-[10px]">
                          <button
                            type="button"
                            onClick={() => setAnchorLang("en")}
                            className={cn(
                              "px-2 py-0.5 rounded font-medium transition-all cursor-pointer",
                              anchorLang === "en"
                                ? "bg-primary text-white font-bold shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            English
                          </button>
                          <button
                            type="button"
                            onClick={() => setAnchorLang("hi")}
                            className={cn(
                              "px-2 py-0.5 rounded font-medium transition-all cursor-pointer",
                              anchorLang === "hi"
                                ? "bg-primary text-white font-bold shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            हिंदी
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-foreground font-medium leading-relaxed">
                      {anchorLang === "hi" && misconception?.vernacularAnchor
                        ? misconception.vernacularAnchor
                        : (misconception?.mentalAnchor ??
                          `Rule of thumb: Clearly distinguish the component that makes decisions from the one that executes state.`)}
                    </p>
                  </div>


                  {/* ⚡ Reality Check — Cognitive Dissonance Counter-Example */}
                  {misconception?.cognitiveDissonance && (
                    <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-3.5 space-y-2">
                      <div className="text-xs font-bold text-violet-400 flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5" />
                        <span>
                          ⚡ Reality Check — Does Your Mental Model Hold?
                        </span>
                      </div>
                      <p className="text-xs text-foreground/90 leading-relaxed">
                        {misconception.cognitiveDissonance.paradoxScenario}
                      </p>
                      <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2">
                        <p className="text-xs text-violet-300 font-medium italic">
                          🤔 {misconception.cognitiveDissonance.counterQuestion}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Submit / Recorded */}
      {!submitted ? (
        <button
          id="quiz-submit-btn"
          disabled={!selected || isBusy}
          onClick={handleSubmit}
          className={cn(
            "w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200",
            selected && !isBusy
              ? "gradient-brand text-white glow-brand hover:opacity-90"
              : "bg-muted text-muted-foreground cursor-not-allowed",
          )}
        >
          {isBusy ? "Submitting..." : "Submit Answer"}
        </button>
      ) : (
        <div className="text-center text-sm text-muted-foreground pt-1">
          Answer recorded — see your mastery update below ↓
        </div>
      )}
    </div>
  );
}
