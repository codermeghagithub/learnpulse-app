"use client";

import { useState } from "react";
import { Plus, Trash2, AlertCircle, Loader2, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { createQuestionAction, deleteQuestionAction } from "@/app/actions/authoring";
import type { Concept, Question } from "./types";

interface QuestionsTabProps {
  courseId: string;
  concepts: Concept[];
  questions: Question[];
  conceptMap: Map<string, string>;
  onQuestionAdded: (question: Question) => void;
  onQuestionDeleted: (questionId: string) => void;
}

export function QuestionsTab({
  courseId,
  concepts,
  questions,
  conceptMap,
  onQuestionAdded,
  onQuestionDeleted,
}: QuestionsTabProps) {
  const [conceptId, setConceptId] = useState(concepts[0]?.id ?? "");
  const [qText, setQText] = useState("");
  const [optA, setOptA] = useState("");
  const [optB, setOptB] = useState("");
  const [optC, setOptC] = useState("");
  const [optD, setOptD] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("A");
  const [explanation, setExplanation] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const targetConcept = conceptId || concepts[0]?.id;
    if (!targetConcept) {
      setError("Please create a concept first.");
      return;
    }
    if (qText.trim().length < 5) {
      setError("Question text must be at least 5 characters.");
      return;
    }
    if (!optA.trim() || !optB.trim() || !optC.trim() || !optD.trim()) {
      setError("All four options (A, B, C, D) are required.");
      return;
    }

    setLoading(true);
    const options = [
      { key: "A", text: optA.trim() },
      { key: "B", text: optB.trim() },
      { key: "C", text: optC.trim() },
      { key: "D", text: optD.trim() },
    ];

    const res = await createQuestionAction(courseId, {
      concept_id: targetConcept,
      question_text: qText.trim(),
      options,
      correct_answer: correctAnswer,
      explanation: explanation.trim() || undefined,
      difficulty,
    });
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      onQuestionAdded({
        id: res.questionId ?? Math.random().toString(),
        concept_id: targetConcept,
        question_text: qText.trim(),
        options,
        correct_answer: correctAnswer,
        explanation: explanation.trim() || undefined,
        difficulty,
      });
      setQText("");
      setOptA("");
      setOptB("");
      setOptC("");
      setOptD("");
      setExplanation("");
    }
  }

  async function handleDeleteQuestion(qId: string) {
    const res = await deleteQuestionAction(courseId, qId);
    if (res.success) {
      onQuestionDeleted(qId);
    }
  }

  if (concepts.length === 0) {
    return (
      <div className="glass-card rounded-xl p-10 text-center space-y-3 animate-fade-in">
        <HelpCircle className="h-8 w-8 text-muted-foreground mx-auto" />
        <p className="font-semibold">No concepts available</p>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Questions must be anchored to a specific concept. Add at least one concept in the Concepts tab first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            Author Practice Question (MCQ)
          </h2>
          <p className="text-xs text-muted-foreground">
            Students will practice these questions to build and track their EWMA mastery score.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAddQuestion} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="q-concept-select" className="text-xs font-medium">
                Target Concept <span className="text-primary">*</span>
              </Label>
              <Select
                id="q-concept-select"
                required
                value={conceptId || concepts[0]?.id}
                onChange={(e) => setConceptId(e.target.value)}
              >
                {concepts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.difficulty})
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="q-difficulty-select" className="text-xs font-medium">
                Question Difficulty
              </Label>
              <Select
                id="q-difficulty-select"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}
              >
                <option value="easy">Easy (Multiplier: 0.8)</option>
                <option value="medium">Medium (Multiplier: 1.0)</option>
                <option value="hard">Hard (Multiplier: 1.2)</option>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="q-text-input" className="text-xs font-medium">
              Question Prompt <span className="text-primary">*</span>
            </Label>
            <Textarea
              id="q-text-input"
              rows={2}
              required
              value={qText}
              onChange={(e) => setQText(e.target.value)}
              placeholder="What is the primary difference between...?"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-medium">
              Answer Choices & Correct Option <span className="text-primary">*</span>
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: "A", val: optA, set: setOptA },
                { key: "B", val: optB, set: setOptB },
                { key: "C", val: optC, set: setOptC },
                { key: "D", val: optD, set: setOptD },
              ].map((item) => (
                <div
                  key={item.key}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border p-2.5 transition-all",
                    correctAnswer === item.key ? "border-primary bg-primary/10" : "border-border bg-input/40"
                  )}
                >
                  <input
                    type="radio"
                    id={`radio-${item.key}`}
                    name="correct_answer_radio"
                    checked={correctAnswer === item.key}
                    onChange={() => setCorrectAnswer(item.key)}
                    className="text-primary focus:ring-primary h-4 w-4"
                  />
                  <span className="text-xs font-bold text-muted-foreground w-4">
                    {item.key}
                  </span>
                  <input
                    type="text"
                    required
                    value={item.val}
                    onChange={(e) => item.set(e.target.value)}
                    placeholder={`Option ${item.key} text`}
                    className="flex-1 bg-transparent text-sm focus:outline-none"
                  />
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Click the radio button next to the correct answer choice.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="q-explanation-input" className="text-xs font-medium">
              Answer Explanation
            </Label>
            <Textarea
              id="q-explanation-input"
              rows={2}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Why is this the correct answer? This is displayed to the student after submission."
            />
          </div>

          <Button
            type="submit"
            id="add-question-btn"
            disabled={loading}
            className="cursor-pointer"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Save Question
          </Button>
        </form>
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-semibold">
          Course Practice Questions ({questions.length})
        </h2>

        {questions.length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center space-y-2 text-muted-foreground text-sm">
            No questions added yet for this course. Add at least 1-2 questions per concept so students can practice.
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map((q, idx) => {
              const cName = conceptMap.get(q.concept_id) ?? "Unknown";
              return (
                <div
                  key={q.id}
                  className="glass-card rounded-xl p-4 space-y-3 border-2 border-border shadow-[2px_2px_0px_var(--shadow-color)] hover:shadow-[3px_3px_0px_var(--shadow-color)] transition-all text-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {cName}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {q.difficulty}
                        </Badge>
                      </div>
                      <p className="font-medium text-foreground pt-1">
                        Q{idx + 1}. {q.question_text}
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 cursor-pointer"
                      title="Delete question"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {q.options.map((opt) => (
                      <div
                        key={opt.key}
                        className={cn(
                          "px-3 py-1.5 rounded-lg border",
                          opt.key === q.correct_answer
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500 font-semibold"
                            : "border-border/50 text-muted-foreground"
                        )}
                      >
                        <span className="mr-1.5 font-bold">{opt.key}.</span> {opt.text}
                      </div>
                    ))}
                  </div>

                  {q.explanation && (
                    <p className="text-xs text-muted-foreground border-t border-border/50 pt-2 italic">
                      Explanation: {q.explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
