import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { MasteryBar } from "@/components/mastery/MasteryBar";
import { RiskBadge } from "@/components/risk/RiskBadge";
import { computeRisk, inactivityScore } from "@/lib/algorithms/risk";
import { getMasteryStage } from "@/lib/masteryLevels";
import { MasteryExplainerModal } from "@/components/mastery/MasteryExplainerModal";
import { getDaysSince } from "@/lib/utils";
import {
  Users,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  GraduationCap,
} from "lucide-react";

import { CourseSelector } from "@/components/CourseSelector";

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
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-brand mx-auto">
          <GraduationCap className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold">No courses yet</h1>
        <p className="text-muted-foreground text-sm">
          Your courses will appear here once the demo workspace is seeded.
        </p>
      </div>
    );
  }

  // Determine selected course with database persistence and session cookie fallback
  const dbCourseId = (user.user_metadata?.selectedCourseId as string) || null;
  const cookieStore = await cookies();
  const cookieCourseId = cookieStore.get("selectedCourseId")?.value;
  const activeCourseId =
    paramCourseId && validCourses.some((c) => c.id === paramCourseId)
      ? paramCourseId
      : dbCourseId && validCourses.some((c) => c.id === dbCourseId)
        ? dbCourseId
        : cookieCourseId && validCourses.some((c) => c.id === cookieCourseId)
          ? cookieCourseId
          : null;

  const selectedCourse = validCourses.find((c) => c.id === activeCourseId) ?? validCourses[0];
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

  const conceptIds = (concepts ?? []).map((c) => c.id);

  // Fetch all mastery records for these concepts (all students)
  const { data: allMastery } =
    conceptIds.length > 0
      ? await supabase
          .from("mastery")
          .select(
            "user_id, concept_id, score, attempts_count, correct_count, updated_at",
          )
          .in("concept_id", conceptIds)
      : { data: [] };

  // Compute class average per concept
  const masteryByConcept = new Map<string, number[]>();
  for (const m of allMastery ?? []) {
    if (!masteryByConcept.has(m.concept_id))
      masteryByConcept.set(m.concept_id, []);
    masteryByConcept.get(m.concept_id)!.push(m.score);
  }

  const conceptAverages = (concepts ?? [])
    .map((c) => {
      const scores = masteryByConcept.get(c.id) ?? [];
      const avg =
        scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0;
      return { ...c, average: avg, studentCount: scores.length };
    })
    .sort((a, b) => a.average - b.average);

  // Compute per-student risk scores
  const studentMasteryMap = new Map<
    string,
    { scores: number[]; lastAttempt?: string; errors: number; total: number }
  >();
  for (const m of allMastery ?? []) {
    if (!studentMasteryMap.has(m.user_id)) {
      studentMasteryMap.set(m.user_id, { scores: [], errors: 0, total: 0 });
    }
    const entry = studentMasteryMap.get(m.user_id)!;
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

  // Fetch student profile names
  const studentIds = Array.from(studentMasteryMap.keys());
  const { data: studentProfiles } =
    studentIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", studentIds)
      : { data: [] };

  const studentProfileMap = new Map(
    (studentProfiles ?? []).map((p) => [p.id, p.full_name]),
  );

  // Compute risk for each student
  const studentsWithRisk = studentIds
    .map((sid) => {
      const data = studentMasteryMap.get(sid)!;
      const avgMastery =
        data.scores.reduce((a, b) => a + b, 0) / (data.scores.length || 1);
      const daysSinceLast = getDaysSince(data.lastAttempt);
      const repeatedErrors = data.total > 0 ? data.errors / data.total : 0;

      const risk = computeRisk({
        masteryScore: avgMastery,
        decline: 0,
        repeatedErrors,
        inactivity: inactivityScore(daysSinceLast),
      });

      return {
        id: sid,
        name: studentProfileMap.get(sid) ?? "Unknown Student",
        avgMastery,
        risk,
        conceptCount: data.scores.length,
      };
    })
    .sort((a, b) => b.risk.score - a.risk.score);

  const atRiskStudents = studentsWithRisk.filter(
    (s) => s.risk.bucket === "At Risk" || s.risk.bucket === "Critical",
  );

  const classAvg =
    studentsWithRisk.length > 0
      ? studentsWithRisk.reduce((sum, s) => sum + s.avgMastery, 0) /
        studentsWithRisk.length
      : 0;

  return (
    <div className="px-8 py-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="animate-slide-up flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Class Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Read-only view of your class learning health
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MasteryExplainerModal buttonText="How is Mastery calculated?" variant="button" />
          <Link
            href="/teacher/courses/new"
            id="create-course-header-btn"
            className="inline-flex items-center gap-2 rounded-xl gradient-brand glow-brand text-white px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity self-start sm:self-auto shadow-sm"
          >
            <GraduationCap className="h-4 w-4" />
            Create Course
          </Link>
        </div>
      </div>

      {/* Course selector tabs + management link */}
      <div className="animate-slide-up space-y-3">
        <div className="flex items-center justify-between">
          <CourseSelector
            courses={validCourses}
            selectedCourseId={selectedCourseId}
            basePath="/teacher"
          />
        </div>
        <div className="flex justify-end">
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
      <div className="grid grid-cols-3 gap-4 animate-slide-up">
        <div className="glass-card rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Class Average
            </div>
            <MasteryExplainerModal variant="icon" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold gradient-text">
              {classAvg.toFixed(0)}%
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              {getMasteryStage(classAvg, studentsWithRisk.length > 0 ? 1 : 0).stageName}
            </span>
          </div>
          <MasteryBar score={classAvg} attemptsCount={studentsWithRisk.length > 0 ? 1 : 0} showLabel={false} size="sm" />
        </div>

        <div className="glass-card rounded-2xl p-5 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Users className="h-4 w-4" />
            Students
          </div>
          <div className="text-4xl font-bold">{studentsWithRisk.length}</div>
          <p className="text-xs text-muted-foreground">tracked this session</p>
        </div>

        <div className="glass-card rounded-2xl p-5 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <AlertTriangle className="h-4 w-4" />
            At Risk
          </div>
          <div
            className={`text-4xl font-bold ${atRiskStudents.length > 0 ? "text-mastery-low" : "text-mastery-high"}`}
          >
            {atRiskStudents.length}
          </div>
          <p className="text-xs text-muted-foreground">
            students need attention
          </p>
        </div>
      </div>

      {/* Concept averages */}
      <div className="animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-base">
            Concept Mastery Averages
          </h2>
          <MasteryExplainerModal variant="badge" />
        </div>
        <div className="space-y-3">
          {conceptAverages.map((concept) => (
            <div
              key={concept.id}
              className="glass-card rounded-xl p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{concept.name}</span>
                <span className="text-xs text-muted-foreground">
                  {concept.studentCount === 0
                    ? "No student attempts yet"
                    : `${concept.studentCount} student${concept.studentCount !== 1 ? "s" : ""} active`}
                </span>
              </div>
              <MasteryBar
                score={concept.average}
                attemptsCount={concept.studentCount > 0 ? 1 : 0}
                size="sm"
              />
            </div>
          ))}
        </div>
      </div>

      {/* At-risk students */}
      {studentsWithRisk.length > 0 && (
        <div className="animate-slide-up">
          <h2 className="font-semibold text-base mb-4">
            Student Learning Risk Indicators
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              (sorted by risk)
            </span>
          </h2>
          <div className="space-y-3">
            {studentsWithRisk.map((student, idx) => (
              <Link
                key={student.id}
                href={`/teacher/students/${student.id}`}
                id={`student-card-${idx}`}
                className="group flex items-center justify-between glass-card rounded-xl p-4 hover:border-primary/30 transition-all duration-200"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary font-semibold text-sm">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                      {student.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {student.avgMastery.toFixed(0)}% avg mastery •{" "}
                      {student.conceptCount} concept
                      {student.conceptCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <RiskBadge bucket={student.risk.bucket} />
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
