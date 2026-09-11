"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  Brain,
  Sparkles,
  Zap,
  MessageSquare,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuizOption {
  key: string;
  text: string;
}

interface MisconceptionSection {
  thoughtTrap: string;
  mentalAnchor: string;
  cognitiveDissonance: {
    paradoxScenario: string;
    counterQuestion: string;
  };
}

interface MisconceptionResult {
  thoughtTrap: string;
  mentalAnchor: string;
  vernacularAnchor?: string;
  cognitiveDissonance: {
    paradoxScenario: string;
    counterQuestion: string;
  };
  en?: MisconceptionSection;
  hi?: MisconceptionSection;
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

const DIFFICULTY_BADGE: Record<QuizCardProps["difficulty"], string> = {
  easy: "text-success bg-success/10 border-success/20",
  medium: "text-warning bg-warning/10 border-warning/20",
  hard: "text-destructive bg-destructive/10 border-destructive/20",
};

/** Inline fallback when the API is offline — keeps the UI from being empty. */
function buildClientFallback(
  selectedOpt: string,
  correctOpt: string,
  conceptName: string,
): MisconceptionResult {
  const enSection: MisconceptionSection = {
    thoughtTrap: `You likely selected "${selectedOpt}" because both options play critical roles in ${conceptName || "this domain"}. However, "${selectedOpt}" handles a different phase of the operational lifecycle than "${correctOpt}".`,
    mentalAnchor: `Rule of thumb: Identify which component orchestrates decisions versus which maintains state or executes runtime operations.`,
    cognitiveDissonance: {
      paradoxScenario: `Imagine swapping "${selectedOpt}" and "${correctOpt}" in a live system. If they were truly equivalent, the output would remain identical — but in practice one prepares data while the other consumes it. The system would produce incorrect or corrupted results.`,
      counterQuestion: `What specific output or behavior would break if you replaced "${correctOpt}" with "${selectedOpt}" in a real implementation?`,
    },
  };

  const hiSection: MisconceptionSection = {
    thoughtTrap: `आपने संभवतः "${selectedOpt}" इसलिए चुना क्योंकि दोनों विकल्प ${conceptName || "इस विषय"} में महत्वपूर्ण भूमिका निभाते हैं। लेकिन "${selectedOpt}" और "${correctOpt}" के काम करने का चरण और ज़िम्मेदारी पूरी तरह अलग है।`,
    mentalAnchor: `याद रखें: हमेशा देखें कि कौन निर्णय लेता है और कौन उस स्थिति (state) को निष्पादित करता है — दोनों के काम अलग हैं।`,
    cognitiveDissonance: {
      paradoxScenario: `कल्पना करें कि लाइव सिस्टम में "${selectedOpt}" और "${correctOpt}" को आपस में बदल दिया जाए। यदि दोनों सच में एक जैसे होते, तो सिस्टम सही चलता — लेकिन वास्तव में एक घटक डेटा बनाता है और दूसरा उसका उपयोग करता है। बदलने पर सिस्टम गलत परिणाम देगा।`,
      counterQuestion: `यदि आपकी धारणा सही होती, तो असल सिस्टम में "${correctOpt}" की जगह "${selectedOpt}" लगाने पर क्या टूट जाएगा?`,
    },
  };

  return {
    ...enSection,
    vernacularAnchor: hiSection.mentalAnchor,
    en: enSection,
    hi: hiSection,
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
    <div className="rounded-xl border-2 border-border bg-card p-6 space-y-6 animate-slide-up shadow-[4px_4px_0px_var(--shadow-color)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-muted-foreground">
          Question {questionNumber} of {totalQuestions}
        </span>
        <Badge
          variant="outline"
          className={cn(
            "text-xs px-3 py-1 rounded-xs font-bold border-1.5 capitalize shadow-[1px_1px_0px_var(--shadow-color)]",
            DIFFICULTY_BADGE[difficulty],
          )}
        >
          {difficulty}
        </Badge>
      </div>

      {/* Question */}
      <p className="text-base font-bold leading-relaxed text-foreground">{questionText}</p>

      {/* Options */}
      <div className="space-y-3">
        {options.map((option) => {
          const isSelected = selected === option.key;
          const isThisCorrect = option.key === correctAnswer;

          let optionStyle =
            "border-2 border-border hover:border-primary hover:bg-muted/50 text-foreground shadow-[2px_2px_0px_var(--shadow-color)]";
          if (submitted) {
            if (isThisCorrect)
              optionStyle =
                "border-2 border-success bg-success/15 text-foreground font-bold shadow-[2px_2px_0px_var(--shadow-color)]";
            else if (isSelected && !isThisCorrect)
              optionStyle =
                "border-2 border-destructive bg-destructive/15 text-destructive font-bold shadow-[2px_2px_0px_var(--shadow-color)]";
            else optionStyle = "border-2 border-border/40 opacity-50";
          } else if (isSelected) {
            optionStyle = "border-2 border-primary bg-primary/15 text-foreground font-bold shadow-[2px_2px_0px_var(--shadow-color)]";
          }

          return (
            <button
              key={option.key}
              id={`option-${option.key}`}
              disabled={submitted}
              onClick={() => !submitted && setSelected(option.key)}
              className={cn(
                "w-full flex items-center gap-3 rounded-md border-2 p-3.5 text-left transition-all duration-150",
                optionStyle,
                !submitted && "cursor-pointer hover:-translate-x-px hover:-translate-y-px",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-xs border text-sm font-semibold",
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
            <Button
              type="button"
              variant="ghost"
              size="sm"
              id="show-reasoning-btn"
              onClick={() => setShowReasoningInput(true)}
              className="gap-1.5 text-xs text-muted-foreground hover:text-primary h-auto p-0 cursor-pointer hover:bg-transparent"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Why did you pick this?{" "}
              <span className="text-primary font-medium">
                (helps AI tailor feedback)
              </span>
            </Button>
          ) : (
            <div className="space-y-1.5">
              <label
                htmlFor="student-reasoning"
                className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Your reasoning (optional — makes AI diagnosis sharper):
              </label>
              <Textarea
                id="student-reasoning"
                value={studentReasoning}
                onChange={(e) => setStudentReasoning(e.target.value)}
                placeholder="e.g. I picked this because I assumed locks always prevent deadlocks..."
                maxLength={500}
                rows={2}
                className="w-full rounded-md border-border bg-background/50 px-3 py-2 text-xs text-foreground focus:outline-none resize-none transition-colors"
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
              "rounded-md border-2 p-4 text-sm flex items-start gap-3 shadow-[2px_2px_0px_var(--shadow-color)]",
              isCorrect
                ? "border-success bg-success/15 text-success"
                : "border-destructive bg-destructive/15 text-destructive",
            )}
          >
            {isCorrect ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-success mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
            )}
            <div className="space-y-1">
              <p className="font-bold text-sm">
                {isCorrect ? "Correct answer" : "Incorrect selection"}
              </p>
              {explanation && (
                <p className="text-xs text-foreground/90 font-medium leading-relaxed">
                  {explanation}
                </p>
              )}
            </div>
          </div>

          {/* Mental Mirror + Cognitive Dissonance (shown only on wrong answers) */}
          {!isCorrect && (
            <div className="rounded-xl border-2 border-border bg-card p-5 space-y-4 shadow-[3px_3px_0px_var(--shadow-color)]">
              {/* Header with Dual Language Switcher */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent-yellow/20 text-foreground border-2 border-border shadow-[1px_1px_0px_var(--shadow-color)]">
                    <Brain className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <span>{anchorLang === "hi" ? "मेंटल मिरर" : "Mental Mirror"}</span>
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        • {anchorLang === "hi" ? "संज्ञानात्मक भ्रांति विश्लेषण (NEP 2020)" : "Cognitive Misconception Diagnosis"}
                      </span>
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Language Switcher for the entire Mental Mirror */}
                  <div className="flex items-center bg-muted border-2 border-border rounded-md p-0.5 text-[10px] shadow-[1px_1px_0px_var(--shadow-color)]">
                    <button
                      type="button"
                      onClick={() => setAnchorLang("en")}
                      className={cn(
                        "px-3 py-0.5 rounded-sm font-bold transition-all cursor-pointer",
                        anchorLang === "en"
                          ? "bg-foreground text-background shadow-[1px_1px_0px_var(--shadow-color)]"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnchorLang("hi")}
                      className={cn(
                        "px-3 py-0.5 rounded-sm font-bold transition-all cursor-pointer",
                        anchorLang === "hi"
                          ? "bg-foreground text-background shadow-[1px_1px_0px_var(--shadow-color)]"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      हिंदी
                    </button>
                  </div>

                  <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-xs border-1.5 border-border bg-accent-purple/20 text-[10px] font-bold text-foreground shadow-[1px_1px_0px_var(--shadow-color)]">
                    <Sparkles className="h-3 w-3 text-primary" />
                    <span>{anchorLang === "hi" ? "एआई विश्लेषण" : "AI Deconstructed"}</span>
                  </div>
                </div>
              </div>

              {loadingMisconception ? (
                <div className="flex items-center gap-3 py-3 text-xs text-muted-foreground font-medium animate-pulse">
                  <Sparkles className="h-4 w-4 text-primary animate-spin" />
                  <span>Diagnosing conceptual root-cause…</span>
                </div>
              ) : (
                (() => {
                  const activeSection =
                    anchorLang === "hi"
                      ? misconception?.hi || misconception
                      : misconception?.en || misconception;

                  const activeThoughtTrap =
                    activeSection?.thoughtTrap ||
                    misconception?.thoughtTrap;

                  const activeMentalAnchor =
                    anchorLang === "hi"
                      ? misconception?.vernacularAnchor ||
                        misconception?.hi?.mentalAnchor ||
                        misconception?.mentalAnchor
                      : misconception?.en?.mentalAnchor ||
                        misconception?.mentalAnchor;

                  const activeCognitiveDissonance =
                    activeSection?.cognitiveDissonance ||
                    misconception?.cognitiveDissonance;

                  const isHindi = anchorLang === "hi";

                  return (
                    <div className="space-y-3 pt-1">
                      {/* 1. Thought Trap */}
                      {activeThoughtTrap && (
                        <div className="rounded-lg border-2 border-border bg-accent-yellow/10 p-4 space-y-1 shadow-[2px_2px_0px_var(--shadow-color)]">
                          <p className="text-[11px] font-bold text-primary uppercase tracking-wider">
                            {isHindi ? "🧠 अनुमानित सोच का जाल" : "🧠 Presumed Thought Trap"}
                          </p>
                          <p className="text-xs text-foreground/90 font-medium leading-relaxed">
                            {activeThoughtTrap}
                          </p>
                        </div>
                      )}

                      {/* 2. Mental Anchor */}
                      {activeMentalAnchor && (
                        <div className="rounded-lg border-2 border-border bg-accent-blue/10 p-4 space-y-1 shadow-[2px_2px_0px_var(--shadow-color)]">
                          <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                            {isHindi ? "⚓ मानसिक आधार (नियम)" : "⚓ Mental Anchor (Rule of Thumb)"}
                          </p>
                          <p className="text-xs text-foreground/90 font-medium leading-relaxed">
                            {activeMentalAnchor}
                          </p>
                        </div>
                      )}

                      {/* 3. Reality Check — Cognitive Dissonance Counter-Example */}
                      {activeCognitiveDissonance && (
                        <div className="rounded-lg border-2 border-border bg-accent-purple/10 p-4 space-y-2 shadow-[2px_2px_0px_var(--shadow-color)]">
                          <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Zap className="h-3.5 w-3.5 text-primary" />
                            <span>
                              {isHindi
                                ? "⚡ वास्तविकता की जाँच — क्या आपका मानसिक मॉडल सही है?"
                                : "⚡ Reality Check — Does Your Mental Model Hold?"}
                            </span>
                          </div>
                          <p className="text-xs text-foreground/90 leading-relaxed">
                            {activeCognitiveDissonance.paradoxScenario}
                          </p>
                          <div className="rounded-md border border-violet-500/20 bg-violet-500/5 px-3 py-2">
                            <p className="text-xs text-violet-300 font-medium italic">
                              🤔 {activeCognitiveDissonance.counterQuestion}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()
              )}
            </div>
          )}
        </div>
      )}

      {/* Submit / Recorded */}
      {!submitted ? (
        <Button
          id="quiz-submit-btn"
          disabled={!selected || isBusy}
          onClick={handleSubmit}
          className="w-full h-11 rounded-md font-bold text-sm border-2 border-border shadow-[2px_2px_0px_var(--shadow-color)] hover:shadow-[3px_3px_0px_var(--shadow-color)] active:translate-x-px active:translate-y-px cursor-pointer"
        >
          {isBusy ? "Submitting..." : "Submit Answer"}
        </Button>
      ) : (
        <div className="text-center text-sm font-bold text-muted-foreground pt-1">
          Answer recorded — see your updated mastery status below
        </div>
      )}
    </div>
  );
}
