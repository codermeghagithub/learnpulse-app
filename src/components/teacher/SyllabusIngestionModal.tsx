"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        type="button"
        id="open-syllabus-ingest-btn"
        className={cn(
          buttonVariants({ size: "sm" }),
          "gap-2 rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
        )}
      >
        <Sparkles className="h-4 w-4" />
        <span>1-Click AI Ingestion</span>
      </DialogTrigger>

      <DialogContent className="max-w-xl sm:max-w-xl p-6 sm:p-7 space-y-5 rounded-2xl border-primary/30">
        {/* Header */}
        <DialogHeader className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-primary/20 bg-primary/10 text-[10px] font-semibold text-primary w-fit">
            <Zap className="h-3 w-3" />
            <span>AICTE Smart Curriculum Engine</span>
          </div>
          <DialogTitle className="text-lg font-bold text-foreground">
            1-Click Syllabus Ingestion
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Synthesize atomic concepts, prerequisite DAG edges, and diagnostic
            MCQs for{" "}
            <span className="font-semibold text-foreground">
              {courseTitle}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        {/* AICTE Presets */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground">
            Choose an AICTE Standard Curriculum Preset:
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {AICTE_PRESETS.map((preset) => (
              <Button
                key={preset.title}
                type="button"
                variant={topicText === preset.text ? "secondary" : "outline"}
                size="sm"
                disabled={loading}
                onClick={() => {
                  setTopicText(preset.text);
                }}
                className={cn(
                  "text-[11px] px-2.5 py-1.5 h-auto rounded-lg cursor-pointer font-medium text-left",
                  topicText === preset.text
                    ? "border-primary bg-primary/15 text-primary font-bold shadow-xs"
                    : "border-border/80 hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-foreground",
                )}
              >
                {preset.title}
              </Button>
            ))}
          </div>
        </div>

        {/* Textarea */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">
            Or Paste Syllabus Topics / Module Notes:
          </Label>
          <Textarea
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
        <DialogFooter className="flex items-center justify-end gap-3 pt-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(false)}
            disabled={loading}
            className="rounded-xl text-xs font-medium cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            id="confirm-ingest-syllabus-btn"
            size="sm"
            onClick={() => handleIngest()}
            disabled={loading || !topicText.trim()}
            className="gap-2 rounded-xl text-xs font-semibold disabled:opacity-50 cursor-pointer shadow-sm"
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
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
