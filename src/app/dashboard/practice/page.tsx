import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { PracticeClient } from "./PracticeClient";
import { CourseSelector } from "@/components/CourseSelector";
import { Zap } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ conceptId?: string; courseId?: string }>;
}

export const metadata = {
  title: "Practice — LearnPulse",
  description: "Practice questions to improve your mastery scores.",
};

export default async function PracticePage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "student") redirect("/login");

  const { conceptId, courseId: paramCourseId } = (await searchParams) ?? {};

  // Fetch available courses
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, subject")
    .order("title");

  const validCourses = courses ?? [];

  // Determine selected course:
  // 1. Explicit paramCourseId if valid
  // 2. Or course of the incoming conceptId if specified
  // 3. Or database persisted selectedCourseId
  // 4. Or persisted cookie selectedCourseId
  // 5. Or first available course
  const dbCourseId = (user.user_metadata?.selectedCourseId as string) || null;
  let selectedCourseId =
    paramCourseId && validCourses.some((c) => c.id === paramCourseId)
      ? paramCourseId
      : null;

  if (!selectedCourseId && conceptId) {
    const { data: conceptRow } = await supabase
      .from("concepts")
      .select("course_id")
      .eq("id", conceptId)
      .maybeSingle();

    if (conceptRow?.course_id && validCourses.some((c) => c.id === conceptRow.course_id)) {
      selectedCourseId = conceptRow.course_id;
    }
  }

  if (!selectedCourseId && dbCourseId && validCourses.some((c) => c.id === dbCourseId)) {
    selectedCourseId = dbCourseId;
  }

  if (!selectedCourseId) {
    const cookieStore = await cookies();
    const cookieCourseId = cookieStore.get("selectedCourseId")?.value;
    if (cookieCourseId && validCourses.some((c) => c.id === cookieCourseId)) {
      selectedCourseId = cookieCourseId;
    }
  }

  if (!selectedCourseId) {
    selectedCourseId = validCourses[0]?.id ?? null;
  }

  if (selectedCourseId && selectedCourseId !== dbCourseId) {
    await supabase.auth.updateUser({
      data: { selectedCourseId },
    });
  }

  // Fetch all concepts for the selected course
  const { data: courseConcepts } = selectedCourseId
    ? await supabase
        .from("concepts")
        .select("id, name, difficulty")
        .eq("course_id", selectedCourseId)
        .order("created_at", { ascending: true })
    : { data: [] };

  const validConcepts = courseConcepts ?? [];
  const conceptIds = validConcepts.map((c) => c.id);

  // Fetch student's mastery for these course concepts
  const { data: masteryRows } =
    conceptIds.length > 0
      ? await supabase
          .from("mastery")
          .select("concept_id, score, attempts_count, correct_count")
          .eq("user_id", user.id)
          .in("concept_id", conceptIds)
      : { data: [] };

  const masteryMap = new Map((masteryRows ?? []).map((m) => [m.concept_id, m]));

  interface ConceptInfo {
    id: string;
    name: string;
    score: number;
    attemptsCount: number;
    correctCount: number;
  }

  const conceptList: ConceptInfo[] = validConcepts.map((c) => {
    const m = masteryMap.get(c.id);
    return {
      id: c.id,
      name: c.name,
      score: m?.score ?? 0,
      attemptsCount: m?.attempts_count ?? 0,
      correctCount: m?.correct_count ?? 0,
    };
  });

  // Determine active concept:
  // 1. conceptId from params if in this course
  // 2. Otherwise weakest concept (< 70) or first concept in this course
  let activeConcept = conceptList.find((c) => c.id === conceptId);
  if (!activeConcept && conceptList.length > 0) {
    const weakest = [...conceptList].sort((a, b) => a.score - b.score)[0];
    activeConcept = weakest ?? conceptList[0];
  }

  if (!activeConcept) {
    return (
      <div className="px-8 py-8 max-w-3xl mx-auto space-y-8">
        <div className="animate-slide-up">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Practice
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Answer questions to improve your mastery scores
          </p>
        </div>

        {validCourses.length > 0 && (
          <div className="animate-slide-up">
            <CourseSelector
              courses={validCourses}
              selectedCourseId={selectedCourseId ?? ""}
              basePath="/dashboard/practice"
            />
          </div>
        )}

        <div className="glass-card rounded-2xl p-12 text-center space-y-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-brand mx-auto">
            <Zap className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-xl font-bold">No practice material yet</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Your teacher hasn&apos;t added any questions to this course yet. Check back soon!
          </p>
        </div>
      </div>
    );
  }

  // Fetch all questions for active concept
  const { data: allQuestions } = await supabase
    .from("questions")
    .select("id, question_text, options, correct_answer, explanation, difficulty")
    .eq("concept_id", activeConcept.id)
    .order("created_at", { ascending: true });

  const validQuestions = allQuestions ?? [];
  const questionIds = validQuestions.map((q) => q.id);

  // Fetch student's past successful attempts for these questions
  const { data: masteredAttempts } = questionIds.length > 0
    ? await supabase
        .from("attempts")
        .select("question_id")
        .eq("user_id", user.id)
        .eq("is_correct", true)
        .in("question_id", questionIds)
    : { data: [] };

  const masteredQuestionIds = new Set((masteredAttempts ?? []).map((a) => a.question_id));

  // Filter out questions the student has already answered correctly
  const unmasteredQuestions = validQuestions.filter((q) => !masteredQuestionIds.has(q.id));
  const isAlreadyMastered = validQuestions.length > 0 && unmasteredQuestions.length === 0;

  // If there are unmastered questions, serve only them (no repetitive questions)
  // If all are already mastered, serve allQuestions in review mode
  const questionsToServe = unmasteredQuestions.length > 0 ? unmasteredQuestions : validQuestions;

  // Never send correct_answer to the client — strip it
  const safeQuestions = questionsToServe.map((q) => ({
    id: q.id,
    question_text: q.question_text,
    options: q.options,
    difficulty: q.difficulty,
    explanation: q.explanation,
  }));
  const safeAllQuestions = validQuestions.map((q) => ({
    id: q.id,
    question_text: q.question_text,
    options: q.options,
    difficulty: q.difficulty,
    explanation: q.explanation,
  }));

  return (
    <PracticeClient
      key={activeConcept.id}
      conceptList={conceptList}
      activeConcept={activeConcept}
      questions={questionsToServe}
      safeQuestions={safeQuestions}
      allQuestions={validQuestions}
      safeAllQuestions={safeAllQuestions}
      totalConceptQuestions={validQuestions.length}
      masteredCount={masteredQuestionIds.size}
      isAlreadyMastered={isAlreadyMastered}
      initialMastery={activeConcept.score}
      userId={user.id}
      courses={validCourses}
      selectedCourseId={selectedCourseId ?? ""}
    />
  );
}
