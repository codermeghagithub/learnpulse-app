import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { CourseAuthoringClient } from "./CourseAuthoringClient";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select("title")
    .eq("id", id)
    .maybeSingle();

  return {
    title: course ? `${course.title} — Curriculum Authoring` : "Curriculum Authoring",
  };
}

export default async function CourseAuthoringPage({ params }: PageProps) {
  const { id: courseId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "teacher") redirect("/dashboard");

  // Fetch course ensuring this teacher owns it
  const { data: course } = await supabase
    .from("courses")
    .select("id, title, subject, teacher_id")
    .eq("id", courseId)
    .eq("teacher_id", user.id)
    .maybeSingle();

  if (!course) notFound();

  // Fetch concepts
  const { data: concepts } = await supabase
    .from("concepts")
    .select("id, name, description, difficulty, created_at")
    .eq("course_id", courseId)
    .order("created_at", { ascending: true });

  const conceptList = concepts ?? [];

  // Fetch prerequisite edges
  const { data: edgesRaw } = await supabase
    .from("concept_edges")
    .select("id, prerequisite_id, concept_id, weight")
    .eq("course_id", courseId);

  const edgeList = edgesRaw ?? [];

  // Fetch questions
  const { data: questionsRaw } = await supabase
    .from("questions")
    .select("id, concept_id, question_text, options, correct_answer, explanation, difficulty, created_at")
    .eq("course_id", courseId)
    .order("created_at", { ascending: true });

  const questionList = (questionsRaw ?? []).map((q) => ({
    id: q.id,
    concept_id: q.concept_id,
    question_text: q.question_text,
    options: q.options as Array<{ key: string; text: string }>,
    correct_answer: q.correct_answer,
    explanation: q.explanation ?? undefined,
    difficulty: q.difficulty as "easy" | "medium" | "hard",
  }));

  return (
    <CourseAuthoringClient
      course={course}
      initialConcepts={conceptList}
      initialEdges={edgeList}
      initialQuestions={questionList}
    />
  );
}
