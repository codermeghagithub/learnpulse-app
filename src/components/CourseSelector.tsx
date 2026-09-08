"use client";

import { useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BookOpen, Cpu, Database, Network, Box } from "lucide-react";

import { useCourseStore } from "@/lib/store";
import { createClient } from "@/utils/supabase/client";

interface Course {
  id: string;
  title: string;
  subject?: string;
}

interface CourseSelectorProps {
  courses: Course[];
  selectedCourseId: string;
  basePath: string;
}

function getCourseIcon(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes("operating")) return Cpu;
  if (lower.includes("data structure") || lower.includes("dsa")) return BookOpen;
  if (lower.includes("database") || lower.includes("dbms")) return Database;
  if (lower.includes("network")) return Network;
  if (lower.includes("object") || lower.includes("oops")) return Box;
  return BookOpen;
}

export function CourseSelector({
  courses,
  selectedCourseId,
  basePath,
}: CourseSelectorProps) {
  const setSelectedCourseId = useCourseStore((state) => state.setSelectedCourseId);

  useEffect(() => {
    if (selectedCourseId) {
      setSelectedCourseId(selectedCourseId);
    }
  }, [selectedCourseId, setSelectedCourseId]);

  if (!courses || courses.length === 0) return null;

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Courses
        </span>
      </div>

      {/* Tabs container */}
      <div
        id="course-selector"
        role="tablist"
        aria-label="Select course"
        className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar"
      >
        {courses.map((course) => {
          const isSelected = course.id === selectedCourseId;
          const Icon = getCourseIcon(course.title);
          const slug = course.title.toLowerCase().replace(/[^a-z0-9]/g, "-");

          return (
            <Link
              key={course.id}
              href={`${basePath}?courseId=${course.id}`}
              id={`course-tab-${slug}`}
              role="tab"
              aria-selected={isSelected}
              onClick={() => {
                setSelectedCourseId(course.id);
                try {
                  const supabase = createClient();
                  supabase.auth.updateUser({
                    data: { selectedCourseId: course.id },
                  }).catch(() => {});
                } catch {}
              }}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0 border",
                isSelected
                  ? "gradient-brand glow-brand text-white border-primary/40 shadow-sm"
                  : "glass-card text-muted-foreground hover:text-foreground hover:border-primary/30"
              )}
            >
              <Icon className={cn("h-4 w-4", isSelected ? "text-white" : "text-primary/70")} />
              <span>{course.title}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
