"use client";

import { useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BookOpen, Cpu, Database, Network, Box, Compass, Plus } from "lucide-react";

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

import { buttonVariants } from "@/components/ui/button";

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
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">
          {label ?? (isStudentArea ? "Enrolled courses" : "Courses")}
        </span>
        {shouldShowExplore && (
          <Link
            href="/dashboard/courses"
            className="text-[11px] font-medium text-primary hover:underline inline-flex items-center gap-1"
          >
            <Compass className="h-3 w-3" />
            Explore Courses
          </Link>
        )}
      </div>

      {/* Tabs container */}
      <div
        id="course-selector"
        role="tablist"
        aria-label="Select course"
        className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar"
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
                buttonVariants({ variant: isSelected ? "default" : "outline", size: "sm" }),
                "gap-2 rounded-lg px-3.5 py-2 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer h-8",
                isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted/60"
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", isSelected ? "text-primary-foreground" : "text-muted-foreground")} />
              <span>{course.title}</span>
            </Link>
          );
        })}

        {shouldShowExplore && (
          <Link
            href="/dashboard/courses"
            id="explore-courses-tab-pill"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1.5 rounded-lg px-3 py-2 text-xs font-medium border-dashed border-primary/35 text-primary hover:bg-primary/5 hover:text-primary whitespace-nowrap shrink-0 cursor-pointer h-8"
            )}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Explore Courses</span>
          </Link>
        )}
      </div>
    </div>
  );
}
