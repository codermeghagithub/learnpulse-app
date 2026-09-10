import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { MasteryBar } from "@/components/mastery/MasteryBar";
import { RiskBadge } from "@/components/risk/RiskBadge";
import { computeRisk, inactivityScore } from "@/lib/algorithms/risk";
import { getAccuracyText, getMasteryStage } from "@/lib/masteryLevels";
import { MasteryExplainerModal } from "@/components/mastery/MasteryExplainerModal";
import { ArrowLeft, BookOpen, Shield } from "lucide-react";
import { getDaysSince, cn } from "@/lib/utils";
import { CourseSelector } from "@/components/CourseSelector";
import { getStudentEnrolledCourseIds } from "@/lib/enrollment";

interface PageProps {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ courseId?: string }>;
}

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: "bg-success/10 text-success border-success/30",
  medium: "bg-warning/10 text-warning border-warning/30",
  hard: "bg-destructive/10 text-destructive border-destructive/30",
};

export default async function TeacherStudentPage({
  params,
  searchParams,
}: PageProps) {
  const { studentId } = await params;
  const { courseId: paramCourseId } = (await searchParams) ?? {};
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Role check — must be teacher
  const { data: teacherProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (teacherProfile?.role !== "teacher") redirect("/login");

  // Verify student profile
  const { data: studentProfile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", studentId)
    .single();

  if (!studentProfile || studentProfile.role !== "student") notFound();

  // Fetch course IDs that this student is actively enrolled in
  const studentEnrolledCourseIds = await getStudentEnrolledCourseIds(
    supabase,
    studentId
  );

  // Fetch all teacher courses to support subject switching, filtered strictly to student's enrolled courses
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, subject")
    .eq("teacher_id", user.id)
    .order("title");

  const allTeacherCourses = courses ?? [];
  const validCourses = allTeacherCourses.filter((c) =>
    studentEnrolledCourseIds.includes(c.id)
  );

  const selectedCourse =
    paramCourseId && validCourses.some((c) => c.id === paramCourseId)
      ? validCourses.find((c) => c.id === paramCourseId)!
      : validCourses[0] ?? null;

  const selectedCourseId = selectedCourse?.id;

  // Fetch ALL concepts in the selected course to ensure complete curriculum alignment
  const { data: allCourseConcepts } = selectedCourseId
    ? await supabase
        .from("concepts")
        .select("id, name, difficulty, course_id, created_at")
        .eq("course_id", selectedCourseId)
        .order("created_at", { ascending: true })
    : { data: [] };

  const courseConcepts = allCourseConcepts ?? [];
  const conceptIds = courseConcepts.map((c) => c.id);

  // Fetch genuine student mastery records for this course's concepts
  const { data: masteryRows } =
    conceptIds.length > 0
      ? await supabase
          .from("mastery")
          .select(
            "concept_id, score, attempts_count, correct_count, updated_at",
          )
          .eq("user_id", studentId)
          .in("concept_id", conceptIds)
      : { data: [] };

  const masteryMap = new Map(
    (masteryRows ?? []).map((m) => [m.concept_id, m]),
  );

  // Synchronize every concept in the curriculum with the student's actual performance
  const conceptsWithRisk = courseConcepts.map((concept) => {
    const row = masteryMap.get(concept.id);
    const isAttempted = !!row && (row.attempts_count ?? 0) > 0;

    let risk: ReturnType<typeof computeRisk> | null = null;
    if (isAttempted && row) {
      const daysSinceLast = getDaysSince(row.updated_at);
      const repeatedErrors =
        row.attempts_count > 0
          ? 1 - (row.correct_count ?? 0) / row.attempts_count
          : 0;

      risk = computeRisk({
        masteryScore: row.score,
        decline: 0,
        repeatedErrors,
        inactivity: inactivityScore(daysSinceLast),
      });
    }

    return {
      id: concept.id,
      name: concept.name,
      difficulty: concept.difficulty as "easy" | "medium" | "hard",
      score: row?.score ?? 0,
      attemptsCount: row?.attempts_count ?? 0,
      correctCount: row?.correct_count ?? 0,
      isAttempted,
      risk,
    };
  });

  const attemptedConcepts = conceptsWithRisk.filter(
    (c): c is typeof c & { risk: ReturnType<typeof computeRisk> } =>
      c.isAttempted && c.risk !== null,
  );
  const weakConcepts = attemptedConcepts.filter((c) => c.score < 60);
  const avgMastery =
    attemptedConcepts.length > 0
      ? attemptedConcepts.reduce((sum, c) => sum + c.score, 0) /
        attemptedConcepts.length
      : 0;

  return (
    <div className="px-8 py-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Back button and Explainer */}
      <div className="flex items-center justify-between">
        <Link
          href={selectedCourseId ? `/teacher?courseId=${selectedCourseId}` : "/teacher"}
          id="back-to-class"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Class Overview
        </Link>
        <MasteryExplainerModal
          buttonText="How is Mastery calculated?"
          variant="button"
        />
      </div>

      {/* Student header */}
      <div className="glass-card rounded-2xl p-6 sm:p-7 space-y-5 animate-slide-up">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 text-base font-display font-semibold shadow-xs">
              {studentProfile.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{studentProfile.full_name}</h1>
              <p className="text-xs text-muted-foreground">
                Individual student diagnostic profile
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground border border-border rounded-lg px-3 py-1.5 bg-background/50">
            <Shield className="h-3.5 w-3.5 text-primary" />
            Teacher Read-Only
          </div>
        </div>

        {/* Subject switcher tabs */}
        {validCourses.length > 0 && selectedCourseId && (
          <div className="pt-1 border-t border-border/60">
            <CourseSelector
              courses={validCourses}
              selectedCourseId={selectedCourseId}
              basePath={`/teacher/students/${studentId}`}
              label="Enrolled courses"
            />
          </div>
        )}

        {/* Average Mastery for selected subject */}
        {selectedCourse && (
          <div className="space-y-2 pt-2 border-t border-border/60">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Mastery in {selectedCourse.title}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-display font-semibold text-base text-foreground tabular-nums">
                  {avgMastery.toFixed(0)}%
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  {attemptedConcepts.length > 0
                    ? getMasteryStage(avgMastery, attemptedConcepts.length).stageName
                    : "No Practice Yet"}
                </span>
              </div>
            </div>
            <MasteryBar
              score={avgMastery}
              attemptsCount={attemptedConcepts.length > 0 ? attemptedConcepts.length : 0}
              showLabel={false}
              size="md"
            />
          </div>
        )}
      </div>

      {validCourses.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted border border-border text-muted-foreground mx-auto">
            <BookOpen className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            No Enrolled Courses
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {studentProfile.full_name} has not enrolled in any of your courses yet.
          </p>
          <div className="pt-2">
            <Link
              href="/teacher"
              className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Return to Class Overview
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Weak concepts needing intervention */}
      {weakConcepts.length > 0 && (
        <div className="animate-slide-up space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-base text-destructive flex items-center gap-2">
              Concepts Needing Attention
              <span className="text-xs px-2 py-0.5 rounded-md bg-destructive/10 text-destructive border border-destructive/20 font-medium">
                {weakConcepts.length} Weak
              </span>
            </h2>
          </div>
          <div className="space-y-3">
            {weakConcepts.map((concept, idx) => (
              <div
                key={concept.id}
                id={`teacher-concept-weak-${idx}`}
                className="glass-card rounded-xl p-4 space-y-2.5 border-destructive/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground">
                      {concept.name}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full border font-medium capitalize",
                        DIFFICULTY_COLOR[concept.difficulty] ?? "bg-muted text-muted-foreground",
                      )}
                    >
                      {concept.difficulty}
                    </span>
                  </div>
                  <RiskBadge bucket={concept.risk.bucket} />
                </div>
                <MasteryBar
                  score={concept.score}
                  attemptsCount={concept.attemptsCount}
                  correctCount={concept.correctCount}
                  size="sm"
                />
                <div className="text-[11px] text-muted-foreground font-medium">
                  {getAccuracyText(
                    concept.correctCount,
                    concept.attemptsCount,
                    concept.score,
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Complete Curriculum Breakdown: Displays ALL 4, 5, or 6 Concepts of the Subject */}
      <div className="animate-slide-up space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-base flex items-center gap-2">
            All Curriculum Concepts
            <span className="text-xs font-normal text-muted-foreground">
              ({conceptsWithRisk.length} concepts in {selectedCourse?.title ?? "Course"})
            </span>
          </h2>
        </div>

        {conceptsWithRisk.length > 0 ? (
          <div className="space-y-3">
            {conceptsWithRisk.map((concept) => (
              <div
                key={concept.id}
                className={cn(
                  "glass-card rounded-xl p-4 space-y-2.5 transition-colors",
                  !concept.isAttempted && "opacity-70 bg-background/30",
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground">
                      {concept.name}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full border font-medium capitalize",
                        DIFFICULTY_COLOR[concept.difficulty] ?? "bg-muted text-muted-foreground",
                      )}
                    >
                      {concept.difficulty}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {concept.isAttempted && concept.risk ? (
                      <RiskBadge bucket={concept.risk.bucket} />
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium border border-border">
                        Pending Practice
                      </span>
                    )}
                  </div>
                </div>

                {concept.isAttempted ? (
                  <>
                    <MasteryBar
                      score={concept.score}
                      attemptsCount={concept.attemptsCount}
                      correctCount={concept.correctCount}
                      size="sm"
                    />
                    <div className="text-[11px] text-muted-foreground font-medium">
                      {getAccuracyText(
                        concept.correctCount,
                        concept.attemptsCount,
                        concept.score,
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-muted-foreground italic pt-1">
                    Student has not attempted practice questions for this concept yet.
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-8 text-center text-muted-foreground text-sm">
            <BookOpen className="h-8 w-8 mx-auto mb-3 opacity-40" />
            No concepts authored for this course yet.
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}
