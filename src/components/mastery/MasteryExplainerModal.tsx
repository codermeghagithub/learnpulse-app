"use client";

import { useState } from "react";
import { HelpCircle, Brain, TrendingUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
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
            ? "p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer inline-flex items-center justify-center border border-transparent hover:border-border"
            : variant === "button"
            ? "inline-flex items-center gap-1.5 rounded-md border-2 border-border bg-card px-3.5 py-1.5 text-xs font-bold text-foreground hover:bg-muted shadow-[2px_2px_0px_var(--shadow-color)] hover:shadow-[3px_3px_0px_var(--shadow-color)] hover:-translate-x-px hover:-translate-y-px active:translate-x-px active:translate-y-px transition-all cursor-pointer"
            : "inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer h-auto p-0 hover:bg-transparent",
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
            <HelpCircle className="h-3.5 w-3.5 text-primary stroke-[2.5]" />
            <span className="underline decoration-2 decoration-primary/50 underline-offset-4 font-bold text-foreground">
              {buttonText}
            </span>
          </>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 sm:max-w-2xl rounded-xl border-2 border-border bg-card shadow-[4px_4px_0px_var(--shadow-color)] text-foreground">
        {/* Header */}
        <DialogHeader className="space-y-2 pr-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xs text-xs font-medium bg-accent-yellow text-foreground border-2 border-border shadow-[2px_2px_0px_var(--shadow-color)] mb-1 w-fit">
            <Brain className="h-3.5 w-3.5 text-foreground stroke-[2.5]" />
            <span>Smart Progress System</span>
          </div>
          <DialogTitle className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground font-heading">
            How Learn<span className="text-primary">Pulse</span> Measures Your Progress
          </DialogTitle>
          <DialogDescription className="text-sm text-foreground/80 font-normal">
            Your score shows your real understanding as you answer questions, not just a one-time test grade.
          </DialogDescription>
        </DialogHeader>

        {/* Core Principle Callout */}
        <div className="p-4.5 rounded-lg border-2 border-border bg-accent-blue/35 dark:bg-accent-blue/25 space-y-2 shadow-[2px_2px_0px_var(--shadow-color)] text-foreground">
          <div className="flex items-center gap-2 font-medium text-sm text-foreground">
            <Sparkles className="h-4 w-4 text-primary stroke-[2.5]" />
            <span className="font-heading font-semibold">Focused &amp; Fresh Practice</span>
          </div>
          <p className="text-xs text-foreground/90 font-normal leading-relaxed">
            LearnPulse measures how many questions in a topic you have solved and how accurately you answer them.
            When you answer a question correctly, it is marked{" "}
            <strong className="text-foreground font-medium">completed</strong> and we move on to new questions so you never have to repeat questions you already know.
            Once you solve all questions in a topic, you reach{" "}
            <strong className="text-primary font-medium">Level 4 • Mastered (85%–100%)</strong>!
          </p>
        </div>

        {/* The 4 Mastery Stages */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider font-heading">
            The four progress levels
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Stage 1 */}
            <div className="p-4 rounded-md border-2 border-border bg-[#FFE4DE] dark:bg-[#451F19] text-foreground space-y-2 shadow-[2px_2px_0px_var(--shadow-color)]">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-destructive dark:text-red-300">
                  🌱 Level 1 • Getting started
                </span>
                <span className="px-2 py-0.5 rounded-xs bg-card border-1.5 border-border font-mono text-foreground font-medium tabular-nums shadow-[1px_1px_0px_var(--shadow-color)] shrink-0">
                  0% – 39%
                </span>
              </div>
              <p className="text-foreground/80 font-normal">
                You&apos;ve answered your first few questions. Practice more questions to level up!
              </p>
            </div>

            {/* Stage 2 */}
            <div className="p-4 rounded-md border-2 border-border bg-[#FEF0C7] dark:bg-[#4A3912] text-foreground space-y-2 shadow-[2px_2px_0px_var(--shadow-color)]">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-foreground">
                  📈 Level 2 • Developing
                </span>
                <span className="px-2 py-0.5 rounded-xs bg-card border-1.5 border-border font-mono text-foreground font-medium tabular-nums shadow-[1px_1px_0px_var(--shadow-color)] shrink-0">
                  40% – 69%
                </span>
              </div>
              <p className="text-foreground/80 font-normal">
                You&apos;re making good progress and building a solid foundation across this topic.
              </p>
            </div>

            {/* Stage 3 */}
            <div className="p-4 rounded-md border-2 border-border bg-[#D1E9FF] dark:bg-[#183E54] text-foreground space-y-2 shadow-[2px_2px_0px_var(--shadow-color)]">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-foreground">
                  ⭐ Level 3 • Proficient
                </span>
                <span className="px-2 py-0.5 rounded-xs bg-card border-1.5 border-border font-mono text-foreground font-medium tabular-nums shadow-[1px_1px_0px_var(--shadow-color)] shrink-0">
                  70% – 84%
                </span>
              </div>
              <p className="text-foreground/80 font-normal">
                You&apos;ve answered most questions correctly and understand key concepts well.
              </p>
            </div>

            {/* Stage 4 */}
            <div className="p-4 rounded-md border-2 border-border bg-[#D1FADF] dark:bg-[#144227] text-foreground space-y-2 shadow-[2px_2px_0px_var(--shadow-color)]">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-foreground">
                  🏆 Level 4 • Mastered
                </span>
                <span className="px-2 py-0.5 rounded-xs bg-card border-1.5 border-border font-mono text-foreground font-medium tabular-nums shadow-[1px_1px_0px_var(--shadow-color)] shrink-0">
                  85% – 100%
                </span>
              </div>
              <p className="text-foreground/80 font-normal">
                All questions answered correctly! Excellent work and full understanding achieved.
              </p>
            </div>
          </div>
        </div>

        {/* How to Level Up */}
        <div className="p-4.5 rounded-lg border-2 border-border bg-card space-y-3 shadow-[2px_2px_0px_var(--shadow-color)]">
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider font-heading flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary stroke-[2.5]" />
            <span>How leveling up works</span>
          </h3>
          <ul className="text-xs text-foreground/85 space-y-2">
            <li className="flex items-start gap-2">
              <span className="h-2 w-2 rounded-xs bg-primary border border-border mt-1 shrink-0" />
              <span>
                <strong className="text-foreground font-medium">
                  Fair scoring:
                </strong>{" "}
                Getting all questions right in a lesson gives you 100% without repetitive re-takes.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="h-2 w-2 rounded-xs bg-primary border border-border mt-1 shrink-0" />
              <span>
                <strong className="text-foreground font-medium">
                  No repeated questions:
                </strong>{" "}
                When you solve a question, you won&apos;t see it again in the same practice session so your time is respected.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="h-2 w-2 rounded-xs bg-primary border border-border mt-1 shrink-0" />
              <span>
                <strong className="text-foreground font-medium">
                  Review anytime:
                </strong>{" "}
                After completing a topic, you can always practice again whenever you want a refresher.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="h-2 w-2 rounded-xs bg-primary border border-border mt-1 shrink-0" />
              <span>
                <strong className="text-foreground font-medium">
                  Saved everywhere:
                </strong>{" "}
                Your scores and progress automatically sync across all your devices in real time.
              </span>
            </li>
          </ul>
        </div>

        {/* Footer Button */}
        <DialogFooter className="mt-4 pt-2 flex justify-end">
          <DialogClose className="h-10 px-6 rounded-md bg-primary text-primary-foreground font-medium text-sm border-2 border-border shadow-[2px_2px_0px_var(--shadow-color)] hover:shadow-[3px_3px_0px_var(--shadow-color)] hover:-translate-x-px hover:-translate-y-px active:translate-x-px active:translate-y-px transition-all cursor-pointer focus:outline-none">
            Understood
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
