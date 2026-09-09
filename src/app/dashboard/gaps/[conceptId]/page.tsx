import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { GapKnowledgeView } from "./GapKnowledgeView";
import { MasteryBar } from "@/components/mastery/MasteryBar";

import { RiskBadge } from "@/components/risk/RiskBadge";
import { computeRisk, inactivityScore } from "@/lib/algorithms/risk";
import { buildAdjacencyList, bfsPrerequisites } from "@/lib/algorithms/graph";
import { RunDiagnosisButton } from "./RunDiagnosisButton";
import { CourseSelector } from "@/components/CourseSelector";
import { MasteryExplainerModal } from "@/components/mastery/MasteryExplainerModal";
import { ArrowLeft, BookOpen, Zap } from "lucide-react";
import { getDaysSince } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ conceptId: string }>;
}

export async function generateMetadata() {
  return { title: "Gap Analysis — LearnPulse" };
}

export default async function GapPage({ params }: PageProps) {
  const { conceptId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "student") redirect("/login");

  // Fetch target concept
  const { data: targetConcept } = await supabase
    .from("concepts")
    .select("id, name, description, difficulty, course_id")
    .eq("id", conceptId)
    .single();

  if (!targetConcept) notFound();

  // Sync active course to database
  const dbCourseId = (user.user_metadata?.selectedCourseId as string) || null;
  if (targetConcept.course_id && targetConcept.course_id !== dbCourseId) {
    await supabase.auth.updateUser({
      data: { selectedCourseId: targetConcept.course_id },
    });
  }

  // Fetch available courses
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, subject")
    .order("title");

  const validCourses = courses ?? [];

  // Fetch target mastery
  const { data: targetMastery } = await supabase
    .from("mastery")
    .select("score, attempts_count, correct_count, updated_at")
    .eq("user_id", user.id)
    .eq("concept_id", conceptId)
    .maybeSingle();

  // Fetch ALL edges for this course in one query (no N+1)
  const { data: edges } = await supabase
    .from("concept_edges")
    .select("prerequisite_id, concept_id, weight")
    .eq("course_id", targetConcept.course_id);

  const adj = buildAdjacencyList(edges ?? []);
  const prereqNodes = bfsPrerequisites(conceptId, adj);

  // Fetch mastery for all prerequisite concepts in one query
  const prereqIds = prereqNodes.map((n) => n.id);
  const { data: prereqMasteryRows } = prereqIds.length > 0
    ? await supabase
        .from("mastery")
        .select("concept_id, score")
        .eq("user_id", user.id)
        .in("concept_id", prereqIds)
    : { data: [] };

  const masteryMap = new Map(
    (prereqMasteryRows ?? []).map((m) => [m.concept_id, m.score])
  );

  // Fetch concept names for prerequisites
  const { data: prereqConcepts } = prereqIds.length > 0
    ? await supabase
        .from("concepts")
        .select("id, name, difficulty")
        .in("id", prereqIds)
    : { data: [] };

  const conceptNameMap = new Map(
    (prereqConcepts ?? []).map((c) => [c.id, c.name])
  );

  // Build chain nodes for rendering
  const chainNodes = [
    {
      id: conceptId,
      name: targetConcept.name,
      mastery: targetMastery?.score ?? 0,
      depth: 0,
      isTarget: true,
    },
    ...prereqNodes.map((n) => ({
      id: n.id,
      name: conceptNameMap.get(n.id) ?? n.id,
      mastery: masteryMap.get(n.id) ?? 0,
      depth: n.depth,
    })),
  ];

  // Compute risk for target concept
  const daysSinceLast = getDaysSince(targetMastery?.updated_at);
  const repeatedErrors =
    (targetMastery?.attempts_count ?? 0) > 0
      ? 1 - (targetMastery?.correct_count ?? 0) / targetMastery!.attempts_count
      : 0;
  const risk = computeRisk({
    masteryScore: targetMastery?.score ?? 0,
    decline: 0,
    repeatedErrors,
    inactivity: inactivityScore(daysSinceLast),
  });

  // Build diagnosis input for the button
  const diagnosisInput = {
    targetConceptId: conceptId,
    targetConceptName: targetConcept.name,
    targetMastery: targetMastery?.score ?? 0,
    courseId: targetConcept.course_id,
    prerequisites: prereqNodes.map((n) => ({
      conceptId: n.id,
      concept: conceptNameMap.get(n.id) ?? n.id,
      mastery: masteryMap.get(n.id) ?? 0,
      edgeWeight: n.weight,
    })),
  };

  return (
    <div className="px-8 py-8 max-w-3xl mx-auto space-y-8">
      {/* Back */}
      <div className="flex items-center justify-between">
        <Link
          href={`/dashboard?courseId=${targetConcept.course_id}`}
          id="back-to-dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
        <MasteryExplainerModal buttonText="How is Mastery calculated?" variant="button" />
      </div>

      {/* Course selector tabs */}
      {validCourses.length > 0 && (
        <div className="animate-slide-up">
          <CourseSelector
            courses={validCourses}
            selectedCourseId={targetConcept.course_id}
            basePath="/dashboard"
          />
        </div>
      )}

      {/* Target concept header */}
      <div className="glass-card rounded-2xl p-6 space-y-4 animate-slide-up">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{targetConcept.name}</h1>
            {targetConcept.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {targetConcept.description}
              </p>
            )}
          </div>
          <RiskBadge bucket={risk.bucket} />
        </div>

        <MasteryBar
          score={targetMastery?.score ?? 0}
          attemptsCount={targetMastery?.attempts_count ?? 0}
          correctCount={targetMastery?.correct_count ?? 0}
          showAccuracySubtitle={true}
          size="lg"
        />

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {targetMastery?.attempts_count ?? 0} attempts
          </span>
          <span className="capitalize">{targetConcept.difficulty} difficulty</span>
        </div>
      </div>

      {/* Prerequisite knowledge visualization & 60-Second Concept Bite */}
      <div className="animate-slide-up">
        <GapKnowledgeView
          nodes={chainNodes}
          edges={(edges ?? [])
            .filter(
              (e) =>
                chainNodes.some((n) => n.id === e.prerequisite_id) &&
                chainNodes.some((n) => n.id === e.concept_id)
            )
            .map((e) => ({
              fromId: e.prerequisite_id,
              toId: e.concept_id,
              weight: e.weight,
            }))}
          courseId={targetConcept.course_id}
          targetConcept={{
            id: targetConcept.id,
            name: targetConcept.name,
            description: targetConcept.description,
          }}
        />
      </div>


      {/* Actions */}
      <div className="flex gap-3 animate-slide-up">
        <RunDiagnosisButton
          diagnosisInput={diagnosisInput}
          userId={user.id}
        />
        <Link
          href={`/dashboard/practice?conceptId=${conceptId}&courseId=${targetConcept.course_id}`}
          id="gap-practice-btn"
          className="flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-medium hover:border-primary/40 hover:bg-primary/5 transition-all"
        >
          <Zap className="h-4 w-4" />
          Practice Now
        </Link>
      </div>
    </div>
  );
}
