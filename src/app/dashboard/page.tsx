import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { MasteryBar } from "@/components/mastery/MasteryBar";
import { RiskBadge } from "@/components/risk/RiskBadge";
import { computeRisk, inactivityScore, declineScore } from "@/lib/algorithms/risk";
import { MasteryExplainerModal } from "@/components/mastery/MasteryExplainerModal";
import { getAccuracyText } from "@/lib/masteryLevels";
import { getDaysSince } from "@/lib/utils";
import {
  BookOpen,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Zap,
  Target,
} from "lucide-react";

import { CourseSelector } from "@/components/CourseSelector";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard — LearnPulse",
  description: "Your learning health overview, weak concepts, and risk indicators.",
};

interface PageProps {
  searchParams: Promise<{ courseId?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const { courseId: paramCourseId } = (await searchParams) ?? {};
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "student") redirect("/login");

  // Fetch available courses
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, subject")
    .order("title");

  const validCourses = courses ?? [];

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

  const selectedCourse = validCourses.find((c) => c.id === activeCourseId) ?? validCourses[0] ?? null;
  const selectedCourseId = selectedCourse?.id ?? null;

  // Sync to database if selected course is different from DB record
  if (selectedCourseId && selectedCourseId !== dbCourseId) {
    await supabase.auth.updateUser({
      data: { selectedCourseId },
    });
  }

  // Fetch all concepts for the selected course
  const { data: courseConcepts } = selectedCourseId
    ? await supabase
        .from("concepts")
        .select("id, name, difficulty, created_at")
        .eq("course_id", selectedCourseId)
        .order("created_at", { ascending: true })
    : { data: [] };

  const validConcepts = courseConcepts ?? [];
  const conceptIds = validConcepts.map((c) => c.id);

  // Fetch mastery records for these concepts for the current user
  const { data: masteryRows } =
    conceptIds.length > 0
      ? await supabase
          .from("mastery")
          .select("score, attempts_count, correct_count, updated_at, concept_id")
          .eq("user_id", user.id)
          .in("concept_id", conceptIds)
      : { data: [] };

  const masteryMap = new Map(
    (masteryRows ?? []).map((m) => [m.concept_id, m])
  );

  // Fetch recent attempts for decline calculation
  const { data: recentAttempts } = await supabase
    .from("attempts")
    .select("is_correct, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const masteryHistory = recentAttempts
    ? recentAttempts.map((a) => (a.is_correct ? 80 : 20))
    : [];

  // Compute per-concept risk scores for all concepts in this course
  const conceptsWithRisk = validConcepts.map((concept) => {
    const row = masteryMap.get(concept.id);
    if (!row) {
      // 0% mastery and unpracticed: technically needs attention and is At Risk
      const risk = computeRisk({
        masteryScore: 0,
        decline: 0,
        repeatedErrors: 0,
        inactivity: 1, // 30+ days idle / unpracticed
      });

      return {
        id: concept.id,
        name: concept.name,
        difficulty: concept.difficulty,
        score: 0,
        attemptsCount: 0,
        correctCount: 0,
        hasAttempted: false,
        risk,
      };
    }

    const daysSinceLast = getDaysSince(row.updated_at);

    const repeatedErrors =
      row.attempts_count > 0 ? 1 - row.correct_count / row.attempts_count : 0;

    const risk = computeRisk({
      masteryScore: row.score,
      decline: declineScore(masteryHistory),
      repeatedErrors,
      inactivity: inactivityScore(daysSinceLast),
    });

    return {
      id: concept.id,
      name: concept.name,
      difficulty: concept.difficulty,
      score: row.score,
      attemptsCount: row.attempts_count,
      correctCount: row.correct_count,
      hasAttempted: true,
      risk,
    };
  });

  const attemptedConcepts = conceptsWithRisk.filter((c) => c.hasAttempted);

  // Learning Health % = average mastery across all course concepts
  const learningHealth =
    conceptsWithRisk.length > 0
      ? conceptsWithRisk.reduce((sum, c) => sum + c.score, 0) / conceptsWithRisk.length
      : 0;

  // Any concept below 60% (including unstarted 0% concepts) needs attention
  const weakConcepts = conceptsWithRisk.filter((c) => c.score < 60);
  const atRiskCount = conceptsWithRisk.filter(
    (c) => c.risk.bucket === "At Risk" || c.risk.bucket === "Critical"
  ).length;

  return (
    <div className="px-8 py-8 max-w-4xl mx-auto space-y-8">
      {/* Page header */}
      <div className="animate-slide-up flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            Good day, {profile.full_name.split(" ")[0]} 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Here&apos;s your learning health overview
          </p>
        </div>
        <MasteryExplainerModal buttonText="How is Mastery calculated?" variant="button" />
      </div>

      {/* Course selector tabs */}
      {validCourses.length > 0 && (
        <div className="animate-slide-up">
          <CourseSelector
            courses={validCourses}
            selectedCourseId={selectedCourseId ?? ""}
            basePath="/dashboard"
          />
        </div>
      )}

      {validConcepts.length === 0 ? (
        /* ── Empty state: No concepts in course ── */
        <div className="animate-slide-up glass-card rounded-2xl p-12 text-center space-y-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-brand glow-brand mx-auto">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">No Concepts Added Yet</h2>
            <p className="text-muted-foreground text-sm mt-2 max-w-sm mx-auto">
              This course does not have any concepts authored yet.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* If no concepts attempted at all yet, show getting-started prompt */}
          {attemptedConcepts.length === 0 && (
            <div className="animate-slide-up glass-card rounded-2xl p-6 flex items-center justify-between border-primary/20 bg-primary/5">
              <div>
                <h3 className="font-semibold text-sm text-foreground">
                  Welcome to {selectedCourse?.title}!
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Start your first practice session to build your learning health and identify gaps.
                </p>
              </div>
              <Link
                href={`/dashboard/practice${selectedCourseId ? `?courseId=${selectedCourseId}` : ""}`}
                id="empty-state-cta"
                className="inline-flex items-center gap-1.5 rounded-xl gradient-brand glow-brand text-white px-4 py-2 text-xs font-semibold hover:opacity-90 transition-opacity shrink-0 ml-4"
              >
                <Zap className="h-3.5 w-3.5" />
                Start Practicing
              </Link>
            </div>
          )}

          {/* ── Stats row ── */}
          <div className="grid grid-cols-3 gap-4 animate-slide-up">
            {/* Learning Health */}
            <div className="glass-card rounded-2xl p-5 space-y-3 col-span-1">
              <div className="flex items-center justify-between text-muted-foreground text-sm">
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Learning Health
                </span>
                <MasteryExplainerModal variant="icon" />
              </div>
              <div className="text-4xl font-bold gradient-text">
                {learningHealth.toFixed(0)}%
              </div>
              <MasteryBar score={learningHealth} showLabel={false} size="sm" />
            </div>

            {/* Concepts tracked */}
            <div className="glass-card rounded-2xl p-5 space-y-1 col-span-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Target className="h-4 w-4" />
                Concepts Tracked
              </div>
              <div className="text-4xl font-bold">{conceptsWithRisk.length}</div>
              <p className="text-xs text-muted-foreground">in this course</p>
            </div>

            {/* At-risk count */}
            <div className="glass-card rounded-2xl p-5 space-y-1 col-span-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <AlertTriangle className="h-4 w-4" />
                At Risk
              </div>
              <div
                className={`text-4xl font-bold ${
                  atRiskCount > 0
                    ? "text-mastery-low"
                    : "text-mastery-high"
                }`}
              >
                {atRiskCount}
              </div>
              <p className="text-xs text-muted-foreground">need attention</p>
            </div>
          </div>

          {/* ── Weak concepts list ── */}
          {weakConcepts.length > 0 && (
            <div className="animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-base">
                  Concepts Needing Attention
                </h2>
                <span className="text-xs text-muted-foreground">
                  {weakConcepts.length} concept{weakConcepts.length > 1 ? "s" : ""} below 60%
                </span>
              </div>

              <div className="space-y-3">
                {weakConcepts.map((concept, idx) => (
                  <Link
                    key={concept.id}
                    href={`/dashboard/gaps/${concept.id}`}
                    id={`concept-card-${idx}`}
                    className="group block glass-card rounded-xl p-4 hover:border-primary/30 transition-all duration-200 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm group-hover:text-primary transition-colors">
                        {concept.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <RiskBadge bucket={concept.risk.bucket} />
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors group-hover:translate-x-0.5" />
                      </div>
                    </div>
                    <MasteryBar
                      score={concept.score}
                      attemptsCount={concept.attemptsCount}
                      correctCount={concept.correctCount}
                      showLabel={true}
                      size="sm"
                    />
                    <div className="text-[11px] text-muted-foreground/90 font-medium">
                      {getAccuracyText(concept.correctCount, concept.attemptsCount, concept.score)}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ── All concepts ── */}
          <div className="animate-slide-up">
            <h2 className="font-semibold text-base mb-4">All Concepts</h2>
            <div className="space-y-3">
              {conceptsWithRisk.map((concept, idx) => (
                <Link
                  key={concept.id}
                  href={`/dashboard/gaps/${concept.id}`}
                  id={`all-concept-${idx}`}
                  className="group block glass-card rounded-xl p-4 hover:border-primary/30 transition-all duration-200 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm group-hover:text-primary transition-colors">
                      {concept.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <RiskBadge bucket={concept.risk.bucket} />
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                  <MasteryBar
                    score={concept.score}
                    attemptsCount={concept.attemptsCount}
                    correctCount={concept.correctCount}
                    showLabel={true}
                    size="sm"
                  />
                  <div className="text-[11px] text-muted-foreground/90 font-medium">
                    {getAccuracyText(concept.correctCount, concept.attemptsCount, concept.score)}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
