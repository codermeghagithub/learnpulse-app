"use client";

import { useState } from "react";
import { createCourseAction } from "@/app/actions/authoring";
import { BookPlus, Loader2, AlertCircle } from "lucide-react";

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
      setError(err instanceof Error ? err.message : "Failed to create course");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive animate-fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="title" className="block text-sm font-medium">
          Course Title <span className="text-primary">*</span>
        </label>
        <input
          id="course-title-input"
          name="title"
          type="text"
          required
          placeholder="e.g. Cloud Computing & Distributed Systems"
          className="w-full rounded-xl border border-border bg-input/50 px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
        <p className="text-xs text-muted-foreground">
          A clear, distinctive name for the course visible to students and teachers.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="subject" className="block text-sm font-medium">
          Subject / Department <span className="text-primary">*</span>
        </label>
        <input
          id="course-subject-input"
          name="subject"
          type="text"
          required
          defaultValue="Computer Science"
          placeholder="e.g. Computer Science"
          className="w-full rounded-xl border border-border bg-input/50 px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
      </div>

      <button
        type="submit"
        id="submit-course-btn"
        disabled={loading}
        className="flex items-center justify-center gap-2 w-full rounded-xl gradient-brand glow-brand text-white py-3.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-sm"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating Course…
          </>
        ) : (
          <>
            <BookPlus className="h-4 w-4" />
            Create Course & Author Concepts
          </>
        )}
      </button>
    </form>
  );
}
