"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Zap,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Layers,
  Network,
  X,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SyllabusIngestionModalProps {
  courseId: string;
  courseTitle: string;
  courseSubject: string;
  onSuccess?: () => void;
}

const AICTE_PRESETS = [
  {
    title: "Artificial Intelligence & ML",
    text: "Artificial Intelligence: State Space Search, Heuristic Search (A*), Minimax & Alpha-Beta Pruning, Constraint Satisfaction, Propositional Logic, Knowledge Representation, Machine Learning Basics",
  },
  {
    title: "Database Engineering",
    text: "Database Engineering: Relational Model, SQL Queries, Schema Normalization (1NF-BCNF), Transaction ACID, Concurrency Control, Indexing & B+ Trees",
  },
  {
    title: "Operating Systems",
    text: "Operating Systems: Process Scheduling, Concurrency & Synchronization, Deadlock Prevention, Memory Management & Paging, Virtual Memory, File Systems",
  },
  {
    title: "Computer Networks",
    text: "Computer Networks: OSI Model, Data Link Framing, IP Addressing & Subnetting, Routing Protocols, TCP/UDP Transport, Congestion Control, DNS & HTTP",
  },
  {
    title: "Data Structures & Algorithms",
    text: "Data Structures and Algorithms: Array Manipulations, Linked Lists, Stacks & Queues, Binary Trees & BSTs, Graph Traversals (BFS/DFS), Dynamic Programming",
  },
];

export function SyllabusIngestionModal({
  courseId,
  courseTitle,
  courseSubject,
  onSuccess,
}: SyllabusIngestionModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [topicText, setTopicText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleIngest(textToIngest?: string) {
    const text = (textToIngest || topicText).trim();
    if (!text || text.length < 5) {
      setError(
        "Please select a syllabus template or enter at least 5 characters.",
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/synthesize-dag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicText: text,
          courseTitle,
          courseSubject,
          targetCourseId: courseId,
          persist: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? `Synthesis failed: ${res.status}`);
      }

      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setTopicText("");
        if (onSuccess) onSuccess();
        router.refresh();
      }, 1200);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Syllabus ingestion failed",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        id="open-syllabus-ingest-btn"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl gradient-brand glow-brand text-white px-3.5 py-2 text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
      >
        <Sparkles className="h-4 w-4" />
        <span>1-Click AI Ingestion</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="glass-card rounded-2xl p-6 sm:p-7 max-w-xl w-full border-primary/30 space-y-5 relative shadow-2xl animate-scale-in">
            {/* Close */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              disabled={loading}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-primary/20 bg-primary/10 text-[10px] font-semibold text-primary">
                <Zap className="h-3 w-3" />
                <span>AICTE Smart Curriculum Engine</span>
              </div>
              <h2 className="text-lg font-bold text-foreground">
                1-Click Syllabus Ingestion
              </h2>
              <p className="text-xs text-muted-foreground">
                Synthesize atomic concepts, prerequisite DAG edges, and
                diagnostic MCQs for{" "}
                <span className="font-semibold text-foreground">
                  {courseTitle}
                </span>
                .
              </p>
            </div>

            {/* AICTE Presets */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">
                Choose an AICTE Standard Curriculum Preset:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {AICTE_PRESETS.map((preset) => (
                  <button
                    key={preset.title}
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setTopicText(preset.text);
                    }}
                    className={cn(
                      "text-[11px] px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer font-medium text-left",
                      topicText === preset.text
                        ? "border-primary bg-primary/15 text-primary font-bold shadow-xs"
                        : "border-border/80 hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {preset.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Or Paste Syllabus Topics / Module Notes:
              </label>
              <textarea
                value={topicText}
                onChange={(e) => setTopicText(e.target.value)}
                disabled={loading}
                rows={4}
                placeholder="e.g. Unit 1: Memory Management, Paging, Segmentation, Page Faults, Virtual Memory, Inverted Page Tables..."
                className="w-full text-xs p-3 rounded-xl border border-border/80 bg-background/60 focus:outline-hidden transition-colors resize-none"
              />
            </div>

            {/* Error / Success Feedback */}
            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>
                  Concepts & Prerequisite DAG synthesized and saved to database!
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={loading}
                className="px-4 py-2 rounded-xl border border-border text-xs font-medium hover:bg-background transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-ingest-syllabus-btn"
                onClick={() => handleIngest()}
                disabled={loading || !topicText.trim()}
                className="inline-flex items-center gap-2 rounded-xl gradient-brand text-white px-5 py-2.5 text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Analyzing DAG & Ingesting…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Synthesize & Ingest</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
