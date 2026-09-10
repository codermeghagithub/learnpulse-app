"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "react-toastify";
import { deleteCourseAction } from "@/app/actions/authoring";

import { Button } from "@/components/ui/button";

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
      console.error("Delete course error:", err);
      toast.update(toastId, {
        render: "Failed to delete course. Please try again.",
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={closeToast}
              className="text-xs rounded-lg cursor-pointer h-8"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={async () => {
                closeToast();
                await performDelete();
              }}
              className="text-xs rounded-lg font-semibold shadow-xs cursor-pointer inline-flex items-center gap-1.5 h-8"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Yes, Delete Course
            </Button>
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
    <Button
      id={`delete-course-btn-${courseId}`}
      type="button"
      variant="outline"
      size="sm"
      onClick={handleTriggerToast}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-xs text-destructive hover:text-destructive font-medium bg-destructive/10 hover:bg-destructive/15 border-destructive/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer h-8"
      title="Delete this course"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
      Delete Course
    </Button>
  );
}
