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
        throw new Error(errData.error ?? `Server error: ${res.status}`);
      }

      const data = await res.json();
      setState({ status: "done", result: data });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Diagnosis failed",
      });
    }
  }

  if (state.status === "idle") {
    return (
      <button
        id="run-diagnosis-btn"
        onClick={runDiagnosis}
        className="flex items-center gap-2 rounded-xl gradient-brand glow-brand text-white px-5 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        <Brain className="h-4 w-4" />
        Run AI Diagnosis
      </button>
    );
  }

  if (state.status === "loading") {
    return (
      <div className="mt-4 w-full glass-card rounded-2xl p-8 text-center space-y-4 animate-fade-in">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-brand glow-brand mx-auto animate-pulse-slow">
          <Brain className="h-7 w-7 text-white" />
        </div>
        <div>
          <p className="font-semibold">
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
          className="text-sm text-primary hover:underline"
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-brand">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold">AI Diagnosis Complete</h3>
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
            <p className="font-bold text-lg gradient-text">
              {(result.confidence * 100).toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Root cause */}
        <div className="rounded-xl border border-(--mastery-low)/30 bg-(--mastery-low)/8 p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-mastery-low">
            <Target className="h-4 w-4" />
            Root Cause Identified
          </div>
          <p className="text-sm font-medium">{result.rootCause}</p>
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
          <p className="text-sm leading-relaxed">{result.explanation}</p>
        </div>
      </div>

      {/* Recovery plan */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 font-semibold">
          <ListChecks className="h-4 w-4 text-primary" />
          Recovery Plan
        </div>
        <ol className="space-y-3">
          {result.actionPlan.map((step, idx) => (
            <li
              key={idx}
              className="flex gap-4 rounded-xl border border-border p-4"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg gradient-brand text-white text-xs font-bold">
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">{step.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {step.description}
                </p>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
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
          <Link
            id="start-recovery-plan-btn"
            href={`/dashboard/practice?conceptId=${targetPracticeConceptId}${diagnosisInput.courseId ? `&courseId=${diagnosisInput.courseId}` : ""}`}
            className="flex items-center justify-center gap-2 w-full rounded-xl gradient-brand glow-brand text-white py-4 font-semibold hover:opacity-90 transition-opacity"
          >
            <Zap className="h-4 w-4" />
            Start Recovery Plan: Practice {result.blockingConcept}
            <ChevronRight className="h-4 w-4" />
          </Link>
        );
      })()}
    </div>
  );
}
