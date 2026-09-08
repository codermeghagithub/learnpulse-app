"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  Brain,
  Sparkles,
  Lightbulb,
} from "lucide-react";

interface QuizOption {
  key: string;
  text: string;
}

interface QuizCardProps {
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

const DIFFICULTY_BADGE = {
  easy: "text-[var(--mastery-high)] bg-[var(--mastery-high)]/10 border-[var(--mastery-high)]/20",
  medium:
    "text-[var(--mastery-mid)] bg-[var(--mastery-mid)]/10 border-[var(--mastery-mid)]/20",
  hard: "text-[var(--mastery-low)] bg-[var(--mastery-low)]/10 border-[var(--mastery-low)]/20",
};

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
  const isBusy = loading || isSubmitting;
  const [misconception, setMisconception] = useState<{
    thoughtTrap: string;
    mentalAnchor: string;
    isAiGenerated?: boolean;
  } | null>(null);
  const [loadingMisconception, setLoadingMisconception] = useState(false);

  const isCorrect = selected === correctAnswer;

  async function handleSubmit() {
    if (!selected || submitted) return;
    setLoading(true);
    setSubmitted(true);

    // If answer is incorrect, trigger the Mental Mirror AI diagnosis
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
        }),
      })
        .then(async (res) => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          if (data && data.thoughtTrap) {
            setMisconception(data);
          } else {
            throw new Error("Invalid response format");
          }
        })
        .catch((err) => {
          console.warn("[Mental Mirror] Using client fallback:", err);
          setMisconception({
            thoughtTrap: `You likely selected "${selectedOpt}" because both options play critical roles in ${conceptName || "this domain"}. However, "${selectedOpt}" handles a different phase of the operational lifecycle than "${correctOpt}".`,
            mentalAnchor: `Rule of thumb: Identify which component orchestrates or schedules work versus which component maintains state or runs nodes.`,
            isAiGenerated: false,
          });
        })
        .finally(() => {
          setLoadingMisconception(false);
        });
    }

    await onSubmit(selected);
    setLoading(false);
  }

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

          {/* The Mental Mirror (shown on incorrect answers) */}
          {!isCorrect && (
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-3.5 animate-slide-up shadow-lg">
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
                      {misconception?.thoughtTrap ||
                        `You may have selected this option because both choices share closely related terminology in ${conceptName || "this subject"}. However, your selected choice executes a different operational responsibility.`}
                    </p>
                  </div>

                  {/* Mental Anchor */}
                  <div className="rounded-xl border border-primary/25 bg-primary/5 p-3.5 space-y-1.5">
                    <div className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <Lightbulb className="h-3.5 w-3.5" />
                      <span>💡 10-Second Mental Anchor:</span>
                    </div>
                    <p className="text-xs text-foreground font-medium leading-relaxed">
                      {misconception?.mentalAnchor ||
                        `Rule of thumb: Clearly distinguish the component that makes decisions or schedules work from the component that executes state.`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Submit button */}
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
