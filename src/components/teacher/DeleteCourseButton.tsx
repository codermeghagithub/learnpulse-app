"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "react-toastify";
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

  async function performDelete() {
    setLoading(true);
    const toastId = toast.loading(`Deleting "${courseTitle}"...`);

    try {
      const res = await deleteCourseAction(courseId);
      if (res?.error) {
        toast.update(toastId, {
          render: `Failed to delete course: ${res.error}`,
          type: "error",
          isLoading: false,
          autoClose: 4000,
          closeButton: true,
        });
        setLoading(false);
      } else {
        toast.update(toastId, {
          render: `Course "${courseTitle}" successfully deleted`,
          type: "success",
          isLoading: false,
          autoClose: 2500,
          closeButton: true,
        });
        router.push("/teacher");
        router.refresh();
      }
    } catch (err) {
      toast.update(toastId, {
        render: err instanceof Error ? err.message : "Failed to delete course",
        type: "error",
        isLoading: false,
        autoClose: 4000,
        closeButton: true,
      });
      setLoading(false);
    }
  }

  function handleTriggerToast() {
    toast(
      ({ closeToast }) => (
        <div className="space-y-3 py-1">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-destructive/15 text-destructive flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-foreground">
                Delete &ldquo;{courseTitle}&rdquo;?
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This will permanently remove the course, along with all its concepts, prerequisite dependencies, and practice questions.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
            <button
              type="button"
              onClick={closeToast}
              className="px-3 py-1.5 text-xs rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                closeToast();
                await performDelete();
              }}
              className="px-3.5 py-1.5 text-xs rounded-lg bg-destructive text-white hover:bg-destructive/90 transition-colors font-semibold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Yes, Delete Course
            </button>
          </div>
        </div>
      ),
      {
        toastId: `delete-confirm-${courseId}`,
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        closeButton: true,
      }
    );
  }

  return (
    <button
      id={`delete-course-btn-${courseId}`}
      type="button"
      onClick={handleTriggerToast}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/90 font-medium bg-destructive/10 hover:bg-destructive/15 border border-destructive/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
      title="Delete this course"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
      Delete Course
    </button>
  );
}
