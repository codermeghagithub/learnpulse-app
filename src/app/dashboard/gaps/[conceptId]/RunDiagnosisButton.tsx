"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Brain,
  Loader2,
  ChevronRight,
  Target,
  Lightbulb,
  ListChecks,
  Clock,
  Zap,
  AlertCircle,
} from "lucide-react";
import type { DiagnosisOutput } from "@/lib/ai/schemas";


import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DiagnosisInput {
  targetConceptId: string;
  targetConceptName: string;
  targetMastery: number;
  courseId?: string;
  prerequisites: Array<{
    conceptId: string;
    concept: string;
    mastery: number;
    edgeWeight: number;
  }>;
}

interface RunDiagnosisButtonProps {
  diagnosisInput: DiagnosisInput;
  userId: string;
}

type DiagnosisState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "done";
      result: DiagnosisOutput & {
        isAiGenerated: boolean;
        blockingConceptId?: string;
      };
    }
  | { status: "error"; message: string };

export function RunDiagnosisButton({
  diagnosisInput,
  userId,
}: RunDiagnosisButtonProps) {
  const [state, setState] = useState<DiagnosisState>({ status: "idle" });

  async function runDiagnosis() {
    setState({ status: "loading" });

    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...diagnosisInput, userId }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error ?? "Unable to complete diagnosis. Please try again.");
      }

      const data = await res.json();
      setState({ status: "done", result: data });
    } catch (err) {
      console.error("Diagnosis error:", err);
      setState({
        status: "error",
        message: "Diagnosis failed. Please check your connection and try again.",
      });
    }
  }

  if (state.status === "idle") {
    return (
      <Button
        id="run-diagnosis-btn"
        onClick={runDiagnosis}
        className="gap-2 rounded-xl px-5 py-3 text-sm font-semibold shadow-sm cursor-pointer h-11"
      >
        <Brain className="h-4 w-4" />
        Analyze What I Missed
      </Button>
    );
  }

  if (state.status === "loading") {
    return (
      <div className="mt-4 w-full glass-card rounded-xl p-8 text-center space-y-4 animate-fade-in border-2 border-border shadow-[2px_2px_0px_var(--shadow-color)]">
        <div className="flex h-14 w-14 items-center justify-center rounded-md bg-primary/10 text-primary border-2 border-border mx-auto shadow-[1px_1px_0px_var(--shadow-color)]">
          <Brain className="h-7 w-7" />
        </div>
        <div>
          <p className="font-bold text-foreground">
            Checking your recent quiz answers…
          </p>
          <p className="text-sm text-muted-foreground mt-1 font-medium">
            Reviewing earlier lessons • Finding tricky spots • Creating study suggestions
          </p>
        </div>
        <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="mt-4 w-full glass-card rounded-xl p-6 space-y-4 border-2 border-destructive/60 animate-fade-in shadow-[2px_2px_0px_var(--shadow-color)]">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span className="font-bold text-sm">Could not complete review</span>
        </div>
        <p className="text-sm text-muted-foreground font-medium">{state.message}</p>
        <Button
          variant="link"
          onClick={() => setState({ status: "idle" })}
          className="text-sm text-primary p-0 h-auto cursor-pointer font-bold"
        >
          Try again
        </Button>
      </div>
    );
  }

  // Done — render full diagnosis result
  const { result } = state;
  return (
    <div className="mt-4 w-full space-y-5 animate-slide-up">
      {/* Header */}
      <div className="glass-card rounded-xl p-6 space-y-4 border-2 border-border shadow-[3px_3px_0px_var(--shadow-color)]">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary border-2 border-border shadow-[1px_1px_0px_var(--shadow-color)]">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">AI Diagnosis Complete</h3>
              <p className="text-xs text-muted-foreground font-medium">
                {result.isAiGenerated !== false
                  ? "Powered by Gemini 3.6 Flash"
                  : "Deterministic analysis"}
              </p>
            </div>
          </div>
          {/* Confidence */}
          <div className="text-right">
            <p className="text-xs text-muted-foreground font-medium">Confidence</p>
            <p className="font-display font-bold text-lg text-foreground tabular-nums">
              {(result.confidence * 100).toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Root cause */}
        <div className="rounded-md border-2 border-destructive/40 bg-destructive/10 p-4 space-y-2 shadow-[2px_2px_0px_var(--shadow-color)]">
          <div className="flex items-center gap-2 text-sm font-bold text-destructive">
            <Target className="h-4 w-4" />
            Root cause identified
          </div>
          <p className="text-sm font-bold text-foreground">{result.rootCause}</p>
          <p className="text-xs text-muted-foreground font-medium">
            Blocking concept:{" "}
            <span className="font-bold text-foreground">
              {result.blockingConcept}
            </span>
          </p>
        </div>

        {/* Explanation */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Lightbulb className="h-4 w-4 text-primary" />
            Why this matters
          </div>
          <p className="text-sm leading-relaxed text-foreground/90 font-medium">{result.explanation}</p>
        </div>
      </div>

      {/* Recovery plan */}
      <div className="glass-card rounded-xl p-6 space-y-4 border-2 border-border shadow-[3px_3px_0px_var(--shadow-color)]">
        <div className="flex items-center gap-2 font-bold text-foreground">
          <ListChecks className="h-4 w-4 text-primary" />
          Recovery plan
        </div>
        <ol className="space-y-3">
          {result.actionPlan.map((step, idx) => (
            <li
              key={idx}
              className="flex gap-4 rounded-md border-2 border-border p-4 bg-card/50 shadow-[2px_2px_0px_var(--shadow-color)]"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xs bg-primary text-primary-foreground text-xs font-bold border border-border shadow-[1px_1px_0px_var(--shadow-color)]">
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-foreground">{step.title}</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">
                  {step.description}
                </p>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground font-mono font-medium">
                  <Clock className="h-3 w-3" />~{step.estimatedMinutes} min
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* CTA */}
      {(() => {
        const targetPracticeConceptId =
          result.blockingConceptId ||
          diagnosisInput.prerequisites.find(
            (p) =>
              p.concept.toLowerCase().trim() ===
                result.blockingConcept?.toLowerCase().trim() ||
              p.conceptId === result.blockingConcept
          )?.conceptId ||
          diagnosisInput.targetConceptId;

        return (
          <div className="pt-2">
            <Link
              id="start-recovery-plan-btn"
              href={`/dashboard/practice?conceptId=${targetPracticeConceptId}${diagnosisInput.courseId ? `&courseId=${diagnosisInput.courseId}` : ""}`}
              className={cn(
                buttonVariants(),
                "gap-2 w-full rounded-md py-3.5 h-12 font-bold border-2 border-border shadow-[2px_2px_0px_var(--shadow-color)] hover:shadow-[3px_3px_0px_var(--shadow-color)] cursor-pointer"
              )}
            >
              <Zap className="h-4 w-4" />
              Start Recovery Plan: Practice {result.blockingConcept}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        );

      })()}
    </div>
  );
}
