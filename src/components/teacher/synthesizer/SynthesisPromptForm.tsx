"use client";

import { Sparkles, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CURRICULUM_PRESETS } from "@/lib/constants/curriculumPresets";

interface SynthesisPromptFormProps {
  topicText: string;
  setTopicText: (val: string) => void;
  status: "idle" | "error";
  errorMessage?: string;
  onSynthesize: () => void;
}

// Input form for course syllabus text and preconfigured academic subjects
export function SynthesisPromptForm({
  topicText,
  setTopicText,
  status,
  errorMessage,
  onSynthesize,
}: SynthesisPromptFormProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label
          htmlFor="topic-text"
          className="text-xs font-medium text-muted-foreground"
        >
          Subject / Syllabus Text
        </Label>
        <Textarea
          id="topic-text"
          value={topicText}
          onChange={(e) => setTopicText(e.target.value)}
          placeholder="e.g. Artificial Intelligence: State Space Search, Heuristic Search, Minimax, Logic, Planning, Neural Networks..."
          rows={4}
          maxLength={3000}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground text-right">
          {topicText.length}/3000 characters
        </p>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground font-medium">
          Quick examples:
        </p>
        <div className="flex flex-wrap gap-2">
          {CURRICULUM_PRESETS.map((sub, i) => (
            <Button
              key={i}
              id={`example-subject-${i}`}
              type="button"
              variant={topicText.startsWith(sub.name) ? "secondary" : "outline"}
              size="xs"
              onClick={() => setTopicText(sub.text)}
              className={cn(
                "text-xs text-left",
                topicText.startsWith(sub.name) && "border-primary font-medium"
              )}
            >
              {sub.name}
            </Button>
          ))}
        </div>
      </div>

      {status === "error" && errorMessage && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-3 text-xs text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <Button
        id="synthesize-btn"
        disabled={topicText.trim().length < 5}
        onClick={onSynthesize}
        size="lg"
        className="w-full font-semibold"
      >
        <Sparkles className="h-4 w-4" />
        Synthesize Prerequisite Graph with AI
      </Button>
    </div>
  );
}
