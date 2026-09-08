import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { MasteryBar } from "@/components/mastery/MasteryBar";
import { RiskBadge } from "@/components/risk/RiskBadge";
import { computeRisk, inactivityScore } from "@/lib/algorithms/risk";
import { getAccuracyText } from "@/lib/masteryLevels";
import { MasteryExplainerModal } from "@/components/mastery/MasteryExplainerModal";
import { ArrowLeft, BookOpen, Shield } from "lucide-react";
import { getDaysSince } from "@/lib/utils";

interface PageProps {
  params: Promise<{ studentId: string }>;
}

export default async function TeacherStudentPage({ params }: PageProps) {
  const { studentId } = await params;
  const supabase = await createClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Role check — must be teacher
  const { data: teacherProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (teacherProfile?.role !== "teacher") redirect("/login");

  // Verify teacher can read this student (teacher_can_read_student via RLS)
  const { data: studentProfile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", studentId)
    .single();

  if (!studentProfile || studentProfile.role !== "student") notFound();

  // Fetch all mastery for student
  const { data: masteryRows } = await supabase
    .from("mastery")
    .select(`
      score, attempts_count, correct_count, updated_at, concept_id,
      concepts!inner(id, name, difficulty, course_id)
    `)
    .eq("user_id", studentId)
    .order("score", { ascending: true });

  const hasMastery = masteryRows && masteryRows.length > 0;

  // For each concept, compute risk
  const conceptsWithRisk = hasMastery
    ? masteryRows.map((row) => {
        const daysSinceLast = getDaysSince(row.updated_at);
        const repeatedErrors =
          row.attempts_count > 0
            ? 1 - row.correct_count / row.attempts_count
            : 0;
        const risk = computeRisk({
          masteryScore: row.score,
          decline: 0,
          repeatedErrors,
          inactivity: inactivityScore(daysSinceLast),
        });
        return {
          id: (row.concepts as unknown as { id: string }).id,
          name: (row.concepts as unknown as { name: string }).name,
          courseId: (row.concepts as unknown as { course_id: string }).course_id,
          score: row.score,
          attemptsCount: row.attempts_count ?? 0,
          correctCount: row.correct_count ?? 0,
          risk,
        };
      })
    : [];

  const weakConcepts = conceptsWithRisk.filter((c) => c.score < 60);
  const avgMastery =
    conceptsWithRisk.length > 0
      ? conceptsWithRisk.reduce((sum, c) => sum + c.score, 0) / conceptsWithRisk.length
      : 0;

  return (
    <div className="px-8 py-8 max-w-3xl mx-auto space-y-8">
      {/* Back */}
      <div className="flex items-center justify-between">
        <Link
          href="/teacher"
          id="back-to-class"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to class overview
        </Link>
        <MasteryExplainerModal buttonText="How is Mastery calculated?" variant="button" />
      </div>

      {/* Student header */}
      <div className="glass-card rounded-2xl p-6 space-y-4 animate-slide-up">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full gradient-brand text-white text-lg font-bold">
              {studentProfile.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold">{studentProfile.full_name}</h1>
              <p className="text-sm text-muted-foreground">Student</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground border border-border rounded-lg px-3 py-1.5">
            <Shield className="h-3.5 w-3.5" />
            Read only
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Average Mastery</span>
            <span className="font-semibold">{avgMastery.toFixed(0)}%</span>
          </div>
          <MasteryBar
            score={avgMastery}
            attemptsCount={conceptsWithRisk.length > 0 ? 1 : 0}
            showLabel={false}
            size="md"
          />
        </div>
      </div>

      {/* Weak concepts */}
      {weakConcepts.length > 0 && (
        <div className="animate-slide-up">
          <h2 className="font-semibold text-base mb-4">Concepts Needing Attention</h2>
          <div className="space-y-3">
            {weakConcepts.map((concept, idx) => (
              <div
                key={concept.id}
                id={`teacher-concept-${idx}`}
                className="glass-card rounded-xl p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{concept.name}</span>
                  <RiskBadge bucket={concept.risk.bucket} />
                </div>
                <MasteryBar
                  score={concept.score}
                  attemptsCount={concept.attemptsCount}
                  correctCount={concept.correctCount}
                  size="sm"
                />
                <div className="text-[11px] text-muted-foreground font-medium">
                  {getAccuracyText(concept.correctCount, concept.attemptsCount, concept.score)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All concepts */}
      {conceptsWithRisk.length > 0 ? (
        <div className="animate-slide-up">
          <h2 className="font-semibold text-base mb-4">All Concepts</h2>
          <div className="space-y-3">
            {conceptsWithRisk.map((concept) => (
              <div key={concept.id} className="glass-card rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{concept.name}</span>
                  <div className="flex items-center gap-2">
                    <RiskBadge bucket={concept.risk.bucket} />
                  </div>
                </div>
                <MasteryBar
                  score={concept.score}
                  attemptsCount={concept.attemptsCount}
                  correctCount={concept.correctCount}
                  size="sm"
                />
                <div className="text-[11px] text-muted-foreground font-medium">
                  {getAccuracyText(concept.correctCount, concept.attemptsCount, concept.score)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-8 text-center text-muted-foreground text-sm">
          <BookOpen className="h-8 w-8 mx-auto mb-3 opacity-40" />
          This student hasn&apos;t completed any practice yet.
        </div>
      )}
    </div>
  );
}
