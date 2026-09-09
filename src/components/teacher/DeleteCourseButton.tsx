"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { deleteCourseAction } from "@/app/actions/authoring";

interface DeleteCourseButtonProps {
  courseId: string;
  courseTitle: string;
}

export function DeleteCourseButton({
  courseId,
  courseTitle,
}: DeleteCourseButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Are you sure you want to delete the course "${courseTitle}"?\n\nThis will permanently remove the course, along with all its concepts, prerequisite dependencies, and practice questions.`
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await deleteCourseAction(courseId);
      if (res?.error) {
        alert(`Failed to delete course: ${res.error}`);
        setLoading(false);
      } else {
        router.push("/teacher");
        router.refresh();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete course");
      setLoading(false);
    }
  }

  return (
    <button
      id={`delete-course-btn-${courseId}`}
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/90 font-medium bg-destructive/10 hover:bg-destructive/15 border border-destructive/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
      title="Delete this course"
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Trash2 className="h-3 w-3" />
      )}
      Delete Course
    </button>
  );
}
