"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  CheckCircle2,
  Plus,
  Loader2,
  ArrowRight,
  Sparkles,
  Search,
  X,
  Layers,
  HelpCircle,
} from "lucide-react";
import {
  enrollInCourseAction,
  unenrollFromCourseAction,
} from "@/app/actions/enrollment";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export interface CatalogCourse {
  id: string;
  title: string;
  subject: string;
  teacherName: string;
  conceptCount: number;
  questionCount: number;
  isEnrolled: boolean;
}

interface CourseCatalogClientProps {
  courses: CatalogCourse[];
  initialEnrolledIds: string[];
}

export function CourseCatalogClient({
  courses,
  initialEnrolledIds,
}: CourseCatalogClientProps) {
  const router = useRouter();
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(
    new Set(initialEnrolledIds),
  );
  const [loadingCourseId, setLoadingCourseId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "enrolled">("all");
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  async function handleToggleEnroll(course: CatalogCourse) {
    const isCurrentlyEnrolled = enrolledIds.has(course.id);
    setLoadingCourseId(course.id);
    setActionFeedback(null);

    try {
      if (isCurrentlyEnrolled) {
        const res = await unenrollFromCourseAction(course.id);
        if (res.error) {
          setActionFeedback(res.error);
        } else {
          setEnrolledIds((prev) => {
            const next = new Set(prev);
            next.delete(course.id);
            return next;
          });
          setActionFeedback(`Dropped ${course.title}.`);
          router.refresh();
        }
      } else {
        const res = await enrollInCourseAction(course.id);
        if (res.error) {
          setActionFeedback(res.error);
        } else {
          setEnrolledIds((prev) => new Set([...prev, course.id]));
          setActionFeedback(`Successfully enrolled in ${course.title}!`);
          router.refresh();
        }
      }
    } catch (err) {
      console.error("Enrollment toggle error:", err);
      setActionFeedback("Something went wrong. Please try again.");
    } finally {
      setLoadingCourseId(null);
    }
  }

  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subject.toLowerCase().includes(searchQuery.toLowerCase());

    if (filter === "enrolled") {
      return matchesSearch && enrolledIds.has(c.id);
    }
    return matchesSearch;
  });

  return (
    <div className="px-6 sm:px-8 py-8 max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            Student Freedom of Choice
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Course Catalog
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Choose the courses you want to take. LearnPulse only tracks your
            mastery, diagnostic gaps, and prerequisite health for the courses
            you actively enroll in.
          </p>
        </div>

        <Link
          href="/dashboard"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "self-start sm:self-auto bg-primary/10 hover:bg-primary/15 text-primary border-primary/20 rounded-xl transition-colors shrink-0 font-semibold cursor-pointer"
          )}
        >
          Back to Dashboard
          <ArrowRight className="h-3.5 w-3.5 ml-1" />
        </Link>
      </div>

      {/* Action feedback toast */}
      {actionFeedback && (
        <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground animate-fade-in shadow-xs">
          <span>{actionFeedback}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => setActionFeedback(null)}
            className="text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by course title or department..."
            className="w-full rounded-xl pl-10 pr-4 py-2.5 h-10 text-xs sm:text-sm bg-muted/40 border-border"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/50 border border-border shrink-0 self-start sm:self-auto">
          <Button
            type="button"
            variant={filter === "all" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter("all")}
            className={cn(
              "rounded-lg text-xs font-medium h-8 cursor-pointer",
              filter === "all" ? "bg-card text-foreground shadow-xs font-semibold" : "text-muted-foreground"
            )}
          >
            All Courses ({courses.length})
          </Button>
          <Button
            type="button"
            variant={filter === "enrolled" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter("enrolled")}
            className={cn(
              "rounded-lg text-xs font-medium h-8 cursor-pointer",
              filter === "enrolled" ? "bg-card text-foreground shadow-xs font-semibold" : "text-muted-foreground"
            )}
          >
            My Enrolled ({enrolledIds.size})
          </Button>
        </div>
      </div>

      {/* Course Grid */}
      {filteredCourses.length === 0 ? (
        <Card className="glass-card rounded-2xl p-12 text-center space-y-4 border-dashed border-2 border-border/80 ring-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 mx-auto">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-base text-foreground">
            {filter === "enrolled"
              ? "No enrolled courses yet"
              : "No courses found"}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
            {filter === "enrolled"
              ? "Browse all available courses and enroll in the ones you want to study."
              : "No courses match your search. Try another search term or check back later."}
          </p>
          {filter === "enrolled" && courses.length > 0 && (
            <Button
              type="button"
              variant="link"
              onClick={() => setFilter("all")}
              className="text-xs font-semibold text-primary pt-2 cursor-pointer h-auto p-0"
            >
              Browse All Courses
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredCourses.map((course) => {
            const isEnrolled = enrolledIds.has(course.id);
            const isLoading = loadingCourseId === course.id;

            return (
              <Card
                key={course.id}
                className={cn(
                  "group relative flex flex-col justify-between glass-card rounded-2xl p-6 transition-all duration-200 border hover:border-primary/40 shadow-xs hover:shadow-md ring-0",
                  isEnrolled
                    ? "border-primary/30 bg-primary/2"
                    : "border-border",
                )}
              >
                <div className="space-y-4">
                  {/* Top badges */}
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-muted border-border text-muted-foreground">
                      {course.subject}
                    </Badge>
                    {isEnrolled ? (
                      <Badge variant="outline" className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-success/15 text-success border-success/30">
                        <CheckCircle2 className="h-3 w-3" />
                        Enrolled
                      </Badge>
                    ) : (
                      <span className="text-[11px] font-medium text-muted-foreground">
                        Not Enrolled
                      </span>
                    )}
                  </div>

                  {/* Title & Teacher */}
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Instructor:{" "}
                      <span className="font-medium text-foreground">
                        {course.teacherName}
                      </span>
                    </p>
                  </div>

                  {/* Course stats */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border/60">
                    <div className="flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-primary" />
                      <span>
                        {course.conceptCount}{" "}
                        {course.conceptCount === 1 ? "Concept" : "Concepts"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <HelpCircle className="h-3.5 w-3.5 text-primary" />
                      <span>
                        {course.questionCount}{" "}
                        {course.questionCount === 1 ? "Question" : "Questions"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-6 mt-4 border-t border-border/60 flex items-center justify-between gap-3">
                  {isEnrolled ? (
                    <>
                      <Link
                        href={`/dashboard?courseId=${course.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline py-2"
                      >
                        Open in Dashboard
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleEnroll(course)}
                        disabled={isLoading}
                        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 h-8"
                      >
                        {isLoading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        ) : (
                          "Drop Course"
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      size="default"
                      onClick={() => handleToggleEnroll(course)}
                      disabled={isLoading}
                      className="w-full rounded-xl py-2.5 text-xs font-semibold shadow-xs cursor-pointer"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                          Enrolling…
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Enroll in Course
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
