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
      <button
        id="run-diagnosis-btn"
        onClick={runDiagnosis}
        className="flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-3 text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
      >
        <Brain className="h-4 w-4" />
        Run AI Diagnosis
      </button>
    );
  }

  if (state.status === "loading") {
    return (
      <div className="mt-4 w-full glass-card rounded-2xl p-8 text-center space-y-4 animate-fade-in">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 mx-auto">
          <Brain className="h-7 w-7" />
        </div>
        <div>
          <p className="font-semibold text-foreground">
            Analyzing your recent learning signals…
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Tracing prerequisites • Ranking root causes • Building recovery plan
          </p>
        </div>
        <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="mt-4 w-full glass-card rounded-2xl p-6 space-y-4 border-destructive/30 animate-fade-in">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span className="font-semibold text-sm">Diagnosis failed</span>
        </div>
        <p className="text-sm text-muted-foreground">{state.message}</p>
        <button
          onClick={() => setState({ status: "idle" })}
          className="text-sm text-primary hover:underline cursor-pointer"
        >
          Try again
        </button>
      </div>
    );
  }

  // Done — render full diagnosis result
  const { result } = state;
  return (
    <div className="mt-4 w-full space-y-5 animate-slide-up">
      {/* Header */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">AI Diagnosis Complete</h3>
              <p className="text-xs text-muted-foreground">
                {result.isAiGenerated
                  ? "Powered by Gemini 2.5 Flash"
                  : "Deterministic analysis"}
              </p>
            </div>
          </div>
          {/* Confidence */}
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Confidence</p>
            <p className="font-display font-bold text-lg text-foreground tabular-nums">
              {(result.confidence * 100).toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Root cause */}
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
            <Target className="h-4 w-4" />
            Root cause identified
          </div>
          <p className="text-sm font-medium text-foreground">{result.rootCause}</p>
          <p className="text-xs text-muted-foreground">
            Blocking concept:{" "}
            <span className="font-semibold text-foreground">
              {result.blockingConcept}
            </span>
          </p>
        </div>

        {/* Explanation */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Lightbulb className="h-4 w-4" />
            Why this matters
          </div>
          <p className="text-sm leading-relaxed text-foreground/90">{result.explanation}</p>
        </div>
      </div>

      {/* Recovery plan */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <ListChecks className="h-4 w-4 text-primary" />
          Recovery plan
        </div>
        <ol className="space-y-3">
          {result.actionPlan.map((step, idx) => (
            <li
              key={idx}
              className="flex gap-4 rounded-xl border border-border p-4 bg-card/50"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm text-foreground">{step.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {step.description}
                </p>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground font-mono">
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
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary text-primary-foreground py-3.5 font-semibold hover:bg-primary/90 transition-colors shadow-sm"
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
