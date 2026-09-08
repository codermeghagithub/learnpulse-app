"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  HelpCircle,
  X,
  Brain,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MasteryExplainerModalProps {
  buttonText?: string;
  variant?: "badge" | "button" | "icon";
  className?: string;
}

const emptySubscribe = () => () => {};

export function MasteryExplainerModal({
  buttonText = "How is Mastery calculated?",
  variant = "badge",
  className,
}: MasteryExplainerModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <>
      {/* Trigger Button */}
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="How is Mastery calculated?"
          title="How is Mastery calculated?"
          className={cn(
            "p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors",
            className,
          )}
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      ) : variant === "button" ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors",
            className,
          )}
        >
          <HelpCircle className="h-3.5 w-3.5" />
          <span>{buttonText}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={cn(
            "inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer",
            className,
          )}
        >
          <HelpCircle className="h-3.5 w-3.5 text-primary/70" />
          <span className="underline decoration-dotted underline-offset-4">
            {buttonText}
          </span>
        </button>
      )}

      {/* Modal Dialog rendered into document.body via Portal to escape parent stacking context */}
      {isOpen &&
        mounted &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-9999 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsOpen(false);
            }}
          >
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0d121f] rounded-2xl border border-border/80 p-6 sm:p-8 space-y-6 shadow-2xl animate-scale-up z-10000 text-foreground">
              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors z-10"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Header */}
              <div className="space-y-1.5 pr-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-1">
                  <Brain className="h-3.5 w-3.5" />
                  Adaptive Knowledge Tracing
                </div>
                <h2 className="text-xl sm:text-2xl font-bold">
                  How LearnPulse Calculates Mastery
                </h2>
                <p className="text-sm text-muted-foreground">
                  Mastery is an adaptive skill level, not a one-time test
                  percentage.
                </p>
              </div>

              {/* Core Principle Callout */}
              <div className="p-4 rounded-xl border border-primary/25 bg-primary/5 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>Concept Mastery: Clean & Non-Repetitive</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  LearnPulse evaluates your mastery based on{" "}
                  <strong>concept question coverage</strong> and{" "}
                  <strong>accuracy</strong>. Questions you answer correctly are
                  marked <strong>complete</strong> and removed from your active
                  practice queue — eliminating repetitive grinding. Successfully
                  solving all available questions in a concept achieves{" "}
                  <strong>Level 4 • Mastered (85%–100%)</strong>!
                </p>
              </div>

              {/* The 4 Mastery Stages */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  The 4 Mastery Stages
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Stage 1 */}
                  <div className="p-3.5 rounded-xl border border-(--mastery-low)/30 bg-(--mastery-low)/5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-mastery-low">
                        🌱 Level 1 • Getting Started
                      </span>
                      <span className="font-semibold text-muted-foreground">
                        0% – 39%
                      </span>
                    </div>
                    <p className="text-muted-foreground">
                      Initial questions attempted. Early concept recall
                      recorded. Practice remaining questions to level up.
                    </p>
                  </div>

                  {/* Stage 2 */}
                  <div className="p-3.5 rounded-xl border border-(--mastery-mid)/30 bg-(--mastery-mid)/5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-mastery-mid">
                        📈 Level 2 • Developing
                      </span>
                      <span className="font-semibold text-muted-foreground">
                        40% – 69%
                      </span>
                    </div>
                    <p className="text-muted-foreground">
                      Halfway through the concept&apos;s question bank. Strong
                      working knowledge forming.
                    </p>
                  </div>

                  {/* Stage 3 */}
                  <div className="p-3.5 rounded-xl border border-(--mastery-high)/30 bg-(--mastery-high)/5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-mastery-high">
                        ⭐ Level 3 • Proficient
                      </span>
                      <span className="font-semibold text-muted-foreground">
                        70% – 84%
                      </span>
                    </div>
                    <p className="text-muted-foreground">
                      Most questions solved. Reliable conceptual grasp
                      established across key problem areas.
                    </p>
                  </div>

                  {/* Stage 4 */}
                  <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-400">
                        🏆 Level 4 • Mastered
                      </span>
                      <span className="font-semibold text-muted-foreground">
                        85% – 100%
                      </span>
                    </div>
                    <p className="text-muted-foreground">
                      All concept questions successfully answered! High
                      retention verified.
                    </p>
                  </div>
                </div>
              </div>

              {/* How to Level Up */}
              <div className="p-4 rounded-xl border border-border bg-card/60 space-y-2.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  How Leveling Up Works
                </h3>
                <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                  <li>
                    <strong className="text-foreground">
                      Full Completion Scaling:
                    </strong>{" "}
                    Answering all available questions in a concept (e.g. 1/1 or
                    2/2 on the first attempt) gives you 100% mastery without
                    repetitive submissions.
                  </li>
                  <li>
                    <strong className="text-foreground">
                      No Repetitive Questions:
                    </strong>{" "}
                    Once you solve a question correctly, it is removed from your
                    session so you only see fresh or previously missed
                    questions.
                  </li>
                  <li>
                    <strong className="text-foreground">Review Mode:</strong>{" "}
                    After mastering a concept, you can voluntarily practice all
                    questions again for revision at any time.
                  </li>
                  <li>
                    <strong className="text-foreground">
                      Cross-Device Persistence:
                    </strong>{" "}
                    All attempts and mastery scores are saved in real-time to
                    the database, staying consistent everywhere you log in.
                  </li>
                </ul>
              </div>

              {/* Footer Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-2.5 rounded-xl gradient-brand glow-brand text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  Got It
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
