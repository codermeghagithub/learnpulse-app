"use client";

import { useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BookOpen, Cpu, Database, Network, Box, Compass, Plus } from "lucide-react";

import { useCourseStore } from "@/lib/store";
import { createClient } from "@/utils/supabase/client";
import type { Course } from "@/types/curriculum";

interface CourseSelectorProps {
  courses: Course[];
  selectedCourseId: string;
  basePath: string;
  showExploreLink?: boolean;
  label?: string;
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
  showExploreLink,
  label,
}: CourseSelectorProps) {
  const setSelectedCourseId = useCourseStore((state) => state.setSelectedCourseId);
  const isStudentArea = basePath.startsWith("/dashboard");
  const shouldShowExplore = showExploreLink ?? isStudentArea;

  useEffect(() => {
    if (selectedCourseId) {
      setSelectedCourseId(selectedCourseId);
    }
  }, [selectedCourseId, setSelectedCourseId]);

  if (!courses || courses.length === 0) return null;

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {label ?? (isStudentArea ? "Enrolled courses" : "Courses")}
        </span>
        {shouldShowExplore && (
          <Link
            href="/dashboard/courses"
            className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1.5"
          >
            <Compass className="h-3.5 w-3.5 stroke-[2.5]" />
            Explore Courses
          </Link>
        )}
      </div>

      {/* Ergonomic Horizontally Swipeable Tabs Bar */}
      <div
        id="course-selector"
        role="tablist"
        aria-label="Select course"
        className="flex w-full items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 snap-x"
      >
        {courses.map((course) => {
          const isSelected = course.id === selectedCourseId;
          const Icon = getCourseIcon(course.title);
          const slug = course.title.toLowerCase().replace(/[^a-z0-9]/g, "-");

          return (
            <Link
              key={course.id}
              id={`course-tab-${slug}`}
              href={`${basePath}?courseId=${course.id}`}
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
                "inline-flex items-center gap-2 rounded-md border-2 border-border px-4 py-2 min-h-11 text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 snap-start cursor-pointer transition-all duration-100",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-[2px_2px_0px_var(--shadow-color)] hover:shadow-[3px_3px_0px_var(--shadow-color)]"
                  : "bg-card text-foreground shadow-[2px_2px_0px_var(--shadow-color)] hover:shadow-[3px_3px_0px_var(--shadow-color)] hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4 stroke-[2.5]" />
              <span>{course.title}</span>
            </Link>
          );
        })}

        {shouldShowExplore && (
          <Link
            href="/dashboard/courses"
            id="explore-courses-tab-pill"
            className="inline-flex items-center gap-1.5 rounded-md border-2 border-dashed border-border bg-card px-4 py-2 min-h-11 text-xs sm:text-sm font-bold text-primary shadow-[1px_1px_0px_var(--shadow-color)] hover:bg-primary/10 whitespace-nowrap shrink-0 snap-start cursor-pointer transition-all"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Explore Courses</span>
          </Link>
        )}
      </div>
    </div>
  );
}
