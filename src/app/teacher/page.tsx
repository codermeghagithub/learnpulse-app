import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { MasteryBar } from "@/components/mastery/MasteryBar";
import { RiskBadge } from "@/components/risk/RiskBadge";
import { computeRisk, inactivityScore } from "@/lib/algorithms/risk";
import { getMasteryStage } from "@/lib/masteryLevels";
import { MasteryExplainerModal } from "@/components/mastery/MasteryExplainerModal";
import { cn, getDaysSince } from "@/lib/utils";
import {
  Users,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  GraduationCap,
  Sparkles,
} from "lucide-react";

import { CourseSelector } from "@/components/CourseSelector";
import { CreateCourseModal } from "@/components/teacher/CreateCourseModal";
import { DeleteCourseButton } from "@/components/teacher/DeleteCourseButton";
import { getEnrolledStudentsForCourse } from "@/lib/enrollment";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Class Overview — LearnPulse",
  description:
    "Read-only teacher view: class average mastery and at-risk student list.",
};

interface PageProps {
  searchParams: Promise<{ courseId?: string }>;
}

export default async function TeacherPage({ searchParams }: PageProps) {
  const { courseId: paramCourseId } = (await searchParams) ?? {};
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "teacher") redirect("/login");

  // Fetch teacher's courses
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, subject")
    .eq("teacher_id", user.id)
    .order("title");

  const validCourses = courses ?? [];

  if (validCourses.length === 0) {
    return (
      <div className="px-8 py-16 max-w-3xl mx-auto text-center space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary mx-auto">
          <GraduationCap className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          No courses yet
        </h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Create your first course to begin tracking student risk, concept
          mastery, and prerequisite diagnostics.
        </p>
        <div className="pt-2">
          <CreateCourseModal />
        </div>
      </div>
    );
  }

  // Determine selected course from URL parameter or user metadata
  const dbCourseId = (user.user_metadata?.selectedCourseId as string) || null;
  const activeCourseId =
    paramCourseId && validCourses.some((c) => c.id === paramCourseId)
      ? paramCourseId
      : dbCourseId && validCourses.some((c) => c.id === dbCourseId)
        ? dbCourseId
        : null;

  const selectedCourse =
    validCourses.find((c) => c.id === activeCourseId) ?? validCourses[0];
  const selectedCourseId = selectedCourse.id;

  if (selectedCourseId && selectedCourseId !== dbCourseId) {
    await supabase.auth.updateUser({
      data: { selectedCourseId },
    });
  }

  // Fetch all concepts in selected course
  const { data: concepts } = await supabase
    .from("concepts")
    .select("id, name, difficulty, course_id")
    .eq("course_id", selectedCourseId);

  const conceptList = concepts ?? [];
  const conceptIds = conceptList.map((c) => c.id);

  // 1. Fetch student profiles actively enrolled in the selected course
  const classStudents = await getEnrolledStudentsForCourse(
    supabase,
    selectedCourseId,
  );

  // 2. Fetch mastery records in the selected course
  const { data: courseMastery } =
    conceptIds.length > 0
      ? await supabase
          .from("mastery")
          .select(
            "user_id, concept_id, score, attempts_count, correct_count, updated_at",
          )
          .in("concept_id", conceptIds)
      : { data: [] };

  // Compute class average per concept in this course
  const masteryByConcept = new Map<string, number[]>();
  for (const m of courseMastery ?? []) {
    if (!masteryByConcept.has(m.concept_id))
      masteryByConcept.set(m.concept_id, []);
    masteryByConcept.get(m.concept_id)!.push(m.score);
  }

  const conceptAverages = conceptList
    .map((c) => {
      const scores = masteryByConcept.get(c.id) ?? [];
      const avg =
        scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0;
      return { ...c, average: avg, studentCount: scores.length };
    })
    .sort((a, b) => a.average - b.average);

  // Map course-specific student mastery
  const studentCourseDataMap = new Map<
    string,
    { scores: number[]; lastAttempt?: string; errors: number; total: number }
  >();
  for (const m of courseMastery ?? []) {
    if (!studentCourseDataMap.has(m.user_id)) {
      studentCourseDataMap.set(m.user_id, { scores: [], errors: 0, total: 0 });
    }
    const entry = studentCourseDataMap.get(m.user_id)!;
    entry.scores.push(m.score);
    entry.total += m.attempts_count;
    entry.errors += m.attempts_count - m.correct_count;
    if (
      !entry.lastAttempt ||
      (m.updated_at && m.updated_at > entry.lastAttempt)
    ) {
      entry.lastAttempt = m.updated_at;
    }
  }

  // Build performance roster for students enrolled in this course
  const studentRoster = classStudents.map((student) => {
    const courseData = studentCourseDataMap.get(student.id);

    const hasCourseAttempts = !!courseData && courseData.scores.length > 0;
    const courseAvgMastery = hasCourseAttempts
      ? courseData.scores.reduce((a, b) => a + b, 0) / courseData.scores.length
      : 0;
    const courseDaysSinceLast = courseData
      ? getDaysSince(courseData.lastAttempt)
      : 999;
    const courseRepeatedErrors =
      courseData && courseData.total > 0
        ? courseData.errors / courseData.total
        : 0;

    const courseRisk = computeRisk({
      masteryScore: courseAvgMastery,
      decline: 0,
      repeatedErrors: courseRepeatedErrors,
      inactivity: inactivityScore(courseDaysSinceLast),
    });

    return {
      id: student.id,
      name: student.full_name,
      hasCourseAttempts,
      courseAvgMastery,
      courseConceptCount: courseData?.scores.length ?? 0,
      courseTotalAttempts: courseData?.total ?? 0,
      courseRisk,
    };
  });

  // Sort roster:
  // 1. Active students with highest risk first
  // 2. Unstarted students alphabetically by name
  studentRoster.sort((a, b) => {
    if (a.hasCourseAttempts && !b.hasCourseAttempts) return -1;
    if (!a.hasCourseAttempts && b.hasCourseAttempts) return 1;
    if (a.hasCourseAttempts && b.hasCourseAttempts) {
      return b.courseRisk.score - a.courseRisk.score;
    }
    return a.name.localeCompare(b.name);
  });

  const activeStudentsInCourse = studentRoster.filter(
    (s) => s.hasCourseAttempts,
  );
  const atRiskStudentsInCourse = activeStudentsInCourse.filter(
    (s) =>
      s.courseRisk.bucket === "At Risk" || s.courseRisk.bucket === "Critical",
  );

  const courseClassAvg =
    activeStudentsInCourse.length > 0
      ? activeStudentsInCourse.reduce((sum, s) => sum + s.courseAvgMastery, 0) /
        activeStudentsInCourse.length
      : 0;

  // Strict course isolation: selected course metrics must NEVER fall back to global stats
  const displayClassAvg = courseClassAvg;
  const displayAttemptsCount = activeStudentsInCourse.length;

  return (
    <div className="px-8 py-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Class Overview
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Read-only analytical view of class mastery, retention, and student
            risk
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MasteryExplainerModal
            buttonText="How is Mastery calculated?"
            variant="button"
          />
          <CreateCourseModal />
        </div>
      </div>

      {/* Course selector tabs + management link */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <CourseSelector
            courses={validCourses}
            selectedCourseId={selectedCourseId}
            basePath="/teacher"
          />
        </div>
        <div className="flex items-center justify-end gap-2.5">
          <DeleteCourseButton
            courseId={selectedCourseId}
            courseTitle={selectedCourse?.title ?? "Course"}
          />
          <Link
            href={`/teacher/courses/${selectedCourseId}/concepts`}
            id="manage-curriculum-btn"
            className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline bg-primary/10 hover:bg-primary/15 px-3 py-1.5 rounded-lg transition-colors"
          >
            Author Concepts, Prerequisites & Questions
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Class Average */}
        <div className="glass-card rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-sm">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <TrendingUp className="h-4 w-4 text-primary" />
              Class Average
            </div>
            <MasteryExplainerModal variant="icon" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-display font-semibold tracking-tight text-foreground tabular-nums">
              {displayClassAvg.toFixed(0)}%
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              {getMasteryStage(displayClassAvg, displayAttemptsCount).stageName}
            </span>
          </div>
          <MasteryBar
            score={displayClassAvg}
            attemptsCount={displayAttemptsCount}
            showLabel={false}
            size="sm"
          />
          <p className="text-[11px] text-muted-foreground truncate">
            {activeStudentsInCourse.length > 0
              ? `In ${selectedCourse.title}`
              : `In ${selectedCourse.title} (no attempts yet)`}
          </p>
        </div>

        {/* Card 2: Total Students */}
        <div className="glass-card rounded-2xl p-5 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
            <Users className="h-4 w-4 text-primary" />
            Enrolled Students
          </div>
          <div className="text-3xl sm:text-4xl font-display font-semibold tracking-tight text-foreground tabular-nums pt-1">
            {classStudents.length}
          </div>
          <p className="text-xs text-muted-foreground">
            {classStudents.length === 1
              ? "student enrolled"
              : "students enrolled"}
          </p>
        </div>

        {/* Card 3: At Risk */}
        <div className="glass-card rounded-2xl p-5 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
            <AlertTriangle className="h-4 w-4 text-warning" />
            At-Risk Students
          </div>
          <div
            className={cn(
              "text-3xl sm:text-4xl font-display font-semibold tracking-tight tabular-nums pt-1",
              atRiskStudentsInCourse.length > 0
                ? "text-destructive"
                : "text-success",
            )}
          >
            {atRiskStudentsInCourse.length}
          </div>
          <p className="text-xs text-muted-foreground">
            {atRiskStudentsInCourse.length} flagged in {selectedCourse.title}
          </p>
        </div>
      </div>

      {/* Concept averages */}
      <div className="animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-base">Concept Mastery Averages</h2>
          <MasteryExplainerModal variant="badge" />
        </div>
        <div className="space-y-3">
          {conceptAverages.length > 0 ? (
            conceptAverages.map((concept) => (
              <div
                key={concept.id}
                className="glass-card rounded-xl p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{concept.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {concept.studentCount === 0
                      ? "No attempts yet"
                      : `${concept.studentCount} student${concept.studentCount !== 1 ? "s" : ""} active`}
                  </span>
                </div>
                <MasteryBar
                  score={concept.average}
                  attemptsCount={concept.studentCount > 0 ? 1 : 0}
                  size="sm"
                />
              </div>
            ))
          ) : (
            <div className="glass-card rounded-xl p-6 text-center text-xs text-muted-foreground">
              No concepts defined for this course yet. Use &ldquo;Author
              Concepts&rdquo; above to add curriculum.
            </div>
          )}
        </div>
      </div>

      {/* Student Performance & Risk Indicators — ALWAYS VISIBLE */}
      <div className="animate-slide-up space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="font-semibold text-base flex items-center gap-2">
              Student Performance & Learning Health
              <span className="text-xs font-normal text-muted-foreground">
                ({studentRoster.length} students enrolled)
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live concept mastery, cognitive risk indicators, and individual
              drill-down profiles.
            </p>
          </div>
        </div>

        {/* Informational notice when course has no attempts yet */}
        {studentRoster.length > 0 && activeStudentsInCourse.length === 0 && (
          <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 flex items-start gap-3">
            <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p className="font-semibold text-foreground">
                No student practice recorded in {selectedCourse.title} yet
              </p>
              <p>
                All {studentRoster.length} enrolled class students are listed
                below with their overall platform progress.
              </p>
            </div>
          </div>
        )}

        {/* Empty state when 0 students enrolled in this course */}
        {studentRoster.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 text-center space-y-3 border-dashed border-2 border-border/80">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary mx-auto">
              <Users className="h-6 w-6" />
            </div>
            <p className="font-semibold text-sm text-foreground">
              No students enrolled in this course yet
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Students have the freedom to self-enroll in {selectedCourse.title}{" "}
              from their Course Catalog. Once enrolled, their live mastery and
              cognitive risk will appear here.
            </p>
          </div>
        ) : (
          /* Student Roster Cards */
          <div className="space-y-3">
            {studentRoster.map((student, idx) => (
              <Link
                key={student.id}
                href={`/teacher/students/${student.id}?courseId=${selectedCourseId}`}
                id={`student-card-${idx}`}
                className="group flex items-center justify-between glass-card rounded-xl p-4 hover:border-primary/40 hover:bg-card/80 transition-all duration-200"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1 pr-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 font-semibold text-sm font-display">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm group-hover:text-primary transition-colors truncate text-foreground">
                        {student.name}
                      </p>
                      {!student.hasCourseAttempts && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium border border-border">
                          Not started
                        </span>
                      )}
                    </div>

                    {student.hasCourseAttempts ? (
                      <div className="flex items-center text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {student.courseAvgMastery.toFixed(0)}% course mastery
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        0% mastery in this course (no attempts)
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {student.hasCourseAttempts ? (
                    <RiskBadge bucket={student.courseRisk.bucket} />
                  ) : (
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-muted text-muted-foreground font-medium border border-border">
                      Unranked
                    </span>
                  )}
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
