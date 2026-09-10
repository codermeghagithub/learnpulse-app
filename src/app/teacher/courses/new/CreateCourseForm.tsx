"use client";

import { useState } from "react";
import { createCourseAction } from "@/app/actions/authoring";
import { BookPlus, Loader2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateCourseForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    try {
      const result = await createCourseAction(formData);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
    } catch (err) {
      // Next.js redirect throws a NEXT_REDIRECT digest error which should bubble
      if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
        throw err;
      }
      console.error("Create course error:", err);
      setError(
        "Unable to create course. Please check the details and try again.",
      );
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-md border-2 border-destructive bg-destructive/10 p-4 text-sm font-bold text-destructive animate-fade-in shadow-[2px_2px_0px_var(--shadow-color)]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-2">
        <Label
          htmlFor="course-title-input"
          className="block text-xs font-bold uppercase tracking-wider text-foreground"
        >
          Course Title <span className="text-primary">*</span>
        </Label>
        <Input
          id="course-title-input"
          name="title"
          type="text"
          required
          minLength={2}
          maxLength={120}
          placeholder="e.g. Cloud Computing & Distributed Systems"
          className="w-full rounded-md border-2 border-border bg-card px-4 py-3 h-11 text-sm text-foreground transition-colors"
        />
        <p className="text-xs text-muted-foreground font-medium">
          A clear, distinctive name for the course visible to students and
          teachers.
        </p>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="course-subject-input"
          className="block text-xs font-bold uppercase tracking-wider text-foreground"
        >
          Subject / Department <span className="text-primary">*</span>
        </Label>
        <Input
          id="course-subject-input"
          name="subject"
          type="text"
          required
          minLength={2}
          maxLength={100}
          defaultValue="Computer Science"
          placeholder="e.g. Computer Science"
          className="w-full rounded-md border-2 border-border bg-card px-4 py-3 h-11 text-sm text-foreground transition-colors"
        />
      </div>

      <Button
        type="submit"
        id="submit-course-btn"
        disabled={loading}
        className="gap-2 w-full rounded-md py-3.5 h-12 text-sm font-bold shadow-[2px_2px_0px_var(--shadow-color)] hover:shadow-[3px_3px_0px_var(--shadow-color)] cursor-pointer"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Creating Course…
          </>
        ) : (
          <>
            <BookPlus className="h-4 w-4 mr-2" />
            Create Course & Author Concepts
          </>
        )}
      </Button>
    </form>
  );
}
