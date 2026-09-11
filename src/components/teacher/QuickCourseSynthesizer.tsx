"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Sparkles, Zap, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { SynthesisResult, SynthesizedConcept } from "@/types/curriculum";
import { SynthesisPromptForm } from "./synthesizer/SynthesisPromptForm";
import { SynthesisPreview } from "./synthesizer/SynthesisPreview";

interface QuickCourseSynthesizerProps {
  isModal?: boolean;
  onClose?: () => void;
}

// Orchestrator for AI-powered curriculum synthesis, preview editing, and database persistence
export function QuickCourseSynthesizer({
  isModal = false,
  onClose,
}: QuickCourseSynthesizerProps = {}) {
  const router = useRouter();
  const [topicText, setTopicText] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "preview" | "saving" | "saved" | "error"
  >("idle");
  const [result, setResult] = useState<SynthesisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");

  async function handleSynthesize() {
    const trimmed = topicText.trim();
    if (trimmed.length < 5) return;

    setStatus("loading");
    setResult(null);
    setErrorMessage("");
    setIsEditingTitle(false);

    try {
      const inferredTitle = trimmed.includes(":")
        ? trimmed.split(":")[0].trim()
        : undefined;

      const res = await fetch("/api/ai/synthesize-dag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicText: trimmed,
          courseTitle: inferredTitle,
          persist: false,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `Request failed with status ${res.status}`);
      }

      setResult(data as SynthesisResult);
      setEditedTitle(data.courseTitle || inferredTitle || "New Course");
      setStatus("preview");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Synthesis failed. Please try again."
      );
      setStatus("error");
    }
  }

  function handleDeleteConcept(indexToDelete: number) {
    if (!result) return;
    const conceptToDelete = result.concepts[indexToDelete];
    setResult({
      ...result,
      concepts: result.concepts.filter((_, i) => i !== indexToDelete),
      edges: result.edges.filter(
        (e) =>
          e.prerequisiteName !== conceptToDelete.name &&
          e.conceptName !== conceptToDelete.name
      ),
      questions: (result.questions ?? []).filter(
        (q) => q.conceptName !== conceptToDelete.name
      ),
    });
  }

  function handleAddConcept(newConcept: SynthesizedConcept) {
    if (!result) return;
    setResult({
      ...result,
      concepts: [...result.concepts, newConcept],
    });
  }

  function handleDeleteEdge(indexToDelete: number) {
    if (!result) return;
    setResult({
      ...result,
      edges: result.edges.filter((_, i) => i !== indexToDelete),
    });
  }

  function handleDeleteQuestion(indexToDelete: number) {
    if (!result) return;
    setResult({
      ...result,
      questions: (result.questions ?? []).filter((_, i) => i !== indexToDelete),
    });
  }

  async function handleConfirmAndSave() {
    if (!result) return;
    setStatus("saving");
    const finalTitle = editedTitle.trim() || result.courseTitle;

    try {
      const res = await fetch("/api/ai/synthesize-dag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseTitle: finalTitle,
          courseSubject: result.courseSubject,
          concepts: result.concepts,
          edges: result.edges,
          questions: result.questions ?? [],
          topicText: topicText.trim() || finalTitle,
          persist: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to save course");
      }

      setResult(data as SynthesisResult);
      setStatus("saved");

      if (data.courseId) {
        onClose?.();
        router.push(`/teacher/courses/${data.courseId}/concepts`);
        router.refresh();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed. Please try again.";
      setErrorMessage(msg);
      toast.error(msg);
      setStatus("preview");
    }
  }

  function handleReset() {
    setTopicText("");
    setResult(null);
    setEditedTitle("");
    setIsEditingTitle(false);
    setStatus("idle");
    setErrorMessage("");
  }

  return (
    <div
      className={cn(
        isModal
          ? "space-y-5"
          : "glass-card rounded-xl p-6 space-y-5 border-2 border-border bg-card shadow-[4px_4px_0px_var(--shadow-color)]"
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-yellow/20 text-foreground border-2 border-border shadow-[1px_1px_0px_var(--shadow-color)] mt-0.5">
          <Zap className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="font-bold text-base flex items-center gap-2">
            AI Course Synthesizer
            <Badge
              variant="outline"
              className="border-1.5 border-border bg-primary/15 text-[10px] font-bold text-primary rounded-xs"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Zero Authoring
            </Badge>
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Paste any subject syllabus — AI extracts concepts, prerequisite dependencies,
            and practice questions. Review and edit everything before saving.
          </p>
        </div>
      </div>

      {/* Input Form */}
      {(status === "idle" || status === "error") && (
        <SynthesisPromptForm
          topicText={topicText}
          setTopicText={setTopicText}
          status={status}
          errorMessage={errorMessage}
          onSynthesize={handleSynthesize}
        />
      )}

      {/* Loading State */}
      {status === "loading" && (
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <div className="text-sm text-center space-y-1">
            <p className="font-medium text-foreground">
              Synthesizing Subject Knowledge Graph & Practice Questions…
            </p>
            <p className="text-xs">
              Extracting concepts, inferring prerequisite DAG, generating diagnostic MCQs
            </p>
          </div>
        </div>
      )}

      {/* Preview + Confirmation */}
      {(status === "preview" || status === "saving" || status === "saved") && result && (
        <SynthesisPreview
          result={result}
          status={status}
          errorMessage={errorMessage}
          editedTitle={editedTitle}
          setEditedTitle={setEditedTitle}
          isEditingTitle={isEditingTitle}
          setIsEditingTitle={setIsEditingTitle}
          onDeleteConcept={handleDeleteConcept}
          onAddConcept={handleAddConcept}
          onDeleteEdge={handleDeleteEdge}
          onDeleteQuestion={handleDeleteQuestion}
          onConfirmAndSave={handleConfirmAndSave}
          onDiscard={handleReset}
        />
      )}
    </div>
  );
}
