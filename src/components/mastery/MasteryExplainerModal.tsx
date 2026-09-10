"use client";

import { useState } from "react";
import { HelpCircle, Brain, TrendingUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

interface MasteryExplainerModalProps {
  buttonText?: string;
  variant?: "badge" | "button" | "icon";
  className?: string;
}

export function MasteryExplainerModal({
  buttonText = "How is Mastery calculated?",
  variant = "badge",
  className,
}: MasteryExplainerModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        type="button"
        aria-label={variant === "icon" ? "How is Mastery calculated?" : undefined}
        title={variant === "icon" ? "How is Mastery calculated?" : undefined}
        className={cn(
          variant === "icon"
            ? "p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer inline-flex items-center justify-center"
            : variant === "button"
            ? "inline-flex items-center gap-1.5 rounded-xl border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 hover:border-primary/40 active:scale-95 transition-all shadow-2xs cursor-pointer"
            : "inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer h-auto p-0 hover:bg-transparent",
          className
        )}
      >
        {variant === "icon" ? (
          <HelpCircle className="h-4 w-4" />
        ) : variant === "button" ? (
          <>
            <HelpCircle className="h-3.5 w-3.5 transition-transform group-hover:rotate-12" />
            <span>{buttonText}</span>
          </>
        ) : (
          <>
            <HelpCircle className="h-3 w-3 text-primary/70" />
            <span className="underline decoration-dotted underline-offset-4">
              {buttonText}
            </span>
          </>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 sm:max-w-2xl">
        {/* Header */}
        <DialogHeader className="space-y-1.5 pr-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-1 w-fit">
            <Brain className="h-3.5 w-3.5" />
            Adaptive Knowledge Tracing
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-bold">
            How LearnPulse Calculates Mastery
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Mastery is an adaptive skill level, not a one-time test percentage.
          </DialogDescription>
        </DialogHeader>

        {/* Core Principle Callout */}
        <div className="p-4 rounded-xl border border-primary/25 bg-primary/5 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Concept Mastery: Clean & Non-Repetitive</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            LearnPulse evaluates your mastery based on{" "}
            <strong>concept question coverage</strong> and{" "}
            <strong>accuracy</strong>. Questions you answer correctly are marked{" "}
            <strong>complete</strong> and removed from your active practice
            queue — eliminating repetitive grinding. Successfully solving all
            available questions in a concept achieves{" "}
            <strong>Level 4 • Mastered (85%–100%)</strong>!
          </p>
        </div>

        {/* The 4 Mastery Stages */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            The four mastery stages
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Stage 1 */}
            <div className="p-3.5 rounded-xl border border-destructive/20 bg-destructive/5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-destructive">
                  🌱 Level 1 • Getting started
                </span>
                <span className="font-mono text-muted-foreground tabular-nums">
                  0% – 39%
                </span>
              </div>
              <p className="text-muted-foreground">
                Initial questions attempted. Early concept recall recorded.
                Practice remaining questions to level up.
              </p>
            </div>

            {/* Stage 2 */}
            <div className="p-3.5 rounded-xl border border-warning/20 bg-warning/5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-warning">
                  📈 Level 2 • Developing
                </span>
                <span className="font-mono text-muted-foreground tabular-nums">
                  40% – 69%
                </span>
              </div>
              <p className="text-muted-foreground">
                Halfway through the concept&apos;s question bank. Strong working
                knowledge forming.
              </p>
            </div>

            {/* Stage 3 */}
            <div className="p-3.5 rounded-xl border border-success/20 bg-success/5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-success">
                  ⭐ Level 3 • Proficient
                </span>
                <span className="font-mono text-muted-foreground tabular-nums">
                  70% – 84%
                </span>
              </div>
              <p className="text-muted-foreground">
                Most questions solved. Reliable conceptual grasp established
                across key problem areas.
              </p>
            </div>

            {/* Stage 4 */}
            <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-emerald-600">
                  🏆 Level 4 • Mastered
                </span>
                <span className="font-mono text-muted-foreground tabular-nums">
                  85% – 100%
                </span>
              </div>
              <p className="text-muted-foreground">
                All concept questions successfully answered! High retention
                verified.
              </p>
            </div>
          </div>
        </div>

        {/* How to Level Up */}
        <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2.5">
          <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            How leveling up works
          </h3>
          <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
            <li>
              <strong className="text-foreground font-medium">
                Full completion scaling:
              </strong>{" "}
              Answering all available questions in a concept (e.g. 1/1 or 2/2 on
              the first attempt) gives you 100% mastery without repetitive
              submissions.
            </li>
            <li>
              <strong className="text-foreground font-medium">
                No repetitive questions:
              </strong>{" "}
              Once you solve a question correctly, it is removed from your
              session so you only see fresh or previously missed questions.
            </li>
            <li>
              <strong className="text-foreground font-medium">
                Review mode:
              </strong>{" "}
              After mastering a concept, you can voluntarily practice all
              questions again for revision at any time.
            </li>
            <li>
              <strong className="text-foreground font-medium">
                Cross-device persistence:
              </strong>{" "}
              All attempts and mastery scores are saved in real-time to the
              database, staying consistent everywhere you log in.
            </li>
          </ul>
        </div>

        {/* Footer Button */}
        <DialogFooter className="mt-4 pt-2">
          <DialogClose
            className={cn(buttonVariants({ size: "sm" }), "cursor-pointer")}
          >
            Understood
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
