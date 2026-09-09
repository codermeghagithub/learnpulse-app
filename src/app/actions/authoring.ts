"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  buildAdjacencyList,
  topologicalSort,
  bfsPrerequisites,
  type ConceptEdge,
} from "@/lib/algorithms/graph";

/**
 * Verify current session is an authenticated teacher.
 */
async function getTeacherUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "teacher") {
    throw new Error("Forbidden: Teacher role required");
  }

  return { supabase, user };
}

/**
 * Verify teacher owns the specified course.
 */
async function verifyCourseOwnership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  courseId: string,
  teacherId: string
) {
  const { data: course } = await supabase
    .from("courses")
    .select("id, title")
    .eq("id", courseId)
    .eq("teacher_id", teacherId)
    .maybeSingle();

  if (!course) {
    throw new Error("Course not found or unauthorized");
  }

  return course;
}

/**
 * 1. Create a new Course
 */
export async function createCourseAction(formData: FormData) {
  const { supabase, user } = await getTeacherUser();

  const title = (formData.get("title") as string)?.trim();
  const subject = (formData.get("subject") as string)?.trim() || "Computer Science";

  if (!title || title.length < 2) {
    return { error: "Course title must be at least 2 characters." };
  }

  const { data: newCourse, error } = await supabase
    .from("courses")
    .insert({
      teacher_id: user.id,
      title,
      subject,
    })
    .select("id")
    .single();

  if (error || !newCourse) {
    return { error: error?.message || "Failed to create course." };
  }

  revalidatePath("/teacher");
  revalidatePath("/dashboard");
  redirect(`/teacher/courses/${newCourse.id}/concepts`);
}

/**
 * 2. Add a Concept to Course
 */
export async function createConceptAction(
  courseId: string,
  data: {
    name: string;
    description?: string;
    difficulty: "easy" | "medium" | "hard";
  }
) {
  const { supabase, user } = await getTeacherUser();
  await verifyCourseOwnership(supabase, courseId, user.id);

  const name = data.name.trim();
  if (!name || name.length < 2) {
    return { error: "Concept name must be at least 2 characters." };
  }

  const { data: newConcept, error } = await supabase
    .from("concepts")
    .insert({
      course_id: courseId,
      name,
      description: data.description?.trim() || null,
      difficulty: data.difficulty,
    })
    .select("id, name, difficulty")
    .single();

  if (error || !newConcept) {
    return { error: error?.message || "Failed to create concept." };
  }

  revalidatePath(`/teacher/courses/${courseId}/concepts`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/practice");
  revalidatePath("/teacher");

  return { success: true, concept: newConcept };
}

/**
 * Delete a Concept
 */
export async function deleteConceptAction(courseId: string, conceptId: string) {
  const { supabase, user } = await getTeacherUser();
  await verifyCourseOwnership(supabase, courseId, user.id);

  const { error } = await supabase
    .from("concepts")
    .delete()
    .eq("id", conceptId)
    .eq("course_id", courseId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/teacher/courses/${courseId}/concepts`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/practice");
  revalidatePath("/teacher");

  return { success: true };
}

/**
 * 3. Add a Prerequisite Edge (with mandatory cycle detection)
 * "A is prerequisite of B" means: conceptId depends on prerequisiteId.
 */
export async function createPrerequisiteEdgeAction(
  courseId: string,
  prerequisiteId: string,
  conceptId: string,
  weight: number = 2
) {
  const { supabase, user } = await getTeacherUser();
  await verifyCourseOwnership(supabase, courseId, user.id);

  if (prerequisiteId === conceptId) {
    return { error: "A concept cannot be a prerequisite of itself." };
  }

  // Fetch all concepts for this course
  const { data: concepts } = await supabase
    .from("concepts")
    .select("id, name")
    .eq("course_id", courseId);

  const conceptList = concepts ?? [];
  const allConceptIds = conceptList.map((c) => c.id);
  const conceptNameMap = new Map(conceptList.map((c) => [c.id, c.name]));

  // Fetch existing edges for this course
  const { data: existingEdgesRaw } = await supabase
    .from("concept_edges")
    .select("id, prerequisite_id, concept_id, weight")
    .eq("course_id", courseId);

  const existingEdges: ConceptEdge[] = (existingEdgesRaw ?? []).map((e) => ({
    prerequisite_id: e.prerequisite_id,
    concept_id: e.concept_id,
    weight: Number(e.weight),
  }));

  // Check duplicate
  const alreadyExists = existingEdges.some(
    (e) =>
      e.prerequisite_id === prerequisiteId && e.concept_id === conceptId
  );
  if (alreadyExists) {
    return { error: "This prerequisite relationship already exists." };
  }

  // Construct hypothetical edge list with proposed edge
  const proposedEdge: ConceptEdge = {
    prerequisite_id: prerequisiteId,
    concept_id: conceptId,
    weight,
  };
  const potentialEdges: ConceptEdge[] = [...existingEdges, proposedEdge];

  // ── MANDATORY CYCLE CHECK ──
  // Reusing existing topologicalSort and buildAdjacencyList from graph.ts
  const adj = buildAdjacencyList(potentialEdges);
  const topoResult = topologicalSort(allConceptIds, adj);

  if (topoResult === null) {
    // Cycle detected!
    // Tracing existing path to explain why:
    // Adding prerequisiteId -> conceptId caused a cycle because conceptId was already a prerequisite of prerequisiteId
    const currentAdj = buildAdjacencyList(existingEdges);
    const existingPrereqsOfA = bfsPrerequisites(prerequisiteId, currentAdj);
    const blocker = existingPrereqsOfA.find((n) => n.id === conceptId);

    const nameA = conceptNameMap.get(prerequisiteId) || "Concept A";
    const nameB = conceptNameMap.get(conceptId) || "Concept B";

    const reason = blocker
      ? `This would make "${nameB}" depend on itself through "${nameA}".`
      : `Adding this dependency creates a circular prerequisite chain.`;

    return { error: `Cycle detected: ${reason}` };
  }

  // Valid DAG — save edge
  const { data: newEdge, error } = await supabase
    .from("concept_edges")
    .insert({
      course_id: courseId,
      prerequisite_id: prerequisiteId,
      concept_id: conceptId,
      weight,
    })
    .select("id")
    .single();

  if (error || !newEdge) {
    return { error: error?.message || "Failed to create prerequisite relationship." };
  }

  revalidatePath(`/teacher/courses/${courseId}/concepts`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/gaps");

  return { success: true };
}

/**
 * Delete a Prerequisite Edge
 */
export async function deletePrerequisiteEdgeAction(courseId: string, edgeId: string) {
  const { supabase, user } = await getTeacherUser();
  await verifyCourseOwnership(supabase, courseId, user.id);

  const { error } = await supabase
    .from("concept_edges")
    .delete()
    .eq("id", edgeId)
    .eq("course_id", courseId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/teacher/courses/${courseId}/concepts`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/gaps");

  return { success: true };
}

/**
 * 4. Question Creation
 */
export async function createQuestionAction(
  courseId: string,
  data: {
    concept_id: string;
    question_text: string;
    options: Array<{ key: string; text: string }>;
    correct_answer: string;
    explanation?: string;
    difficulty: "easy" | "medium" | "hard";
  }
) {
  const { supabase, user } = await getTeacherUser();
  await verifyCourseOwnership(supabase, courseId, user.id);

  const questionText = data.question_text.trim();
  if (!questionText || questionText.length < 5) {
    return { error: "Question text must be at least 5 characters." };
  }

  if (!data.options || data.options.length !== 4) {
    return { error: "Exactly 4 options (A, B, C, D) are required." };
  }

  for (const opt of data.options) {
    if (!opt.text.trim()) {
      return { error: `Option ${opt.key} text cannot be empty.` };
    }
  }

  if (!["A", "B", "C", "D"].includes(data.correct_answer)) {
    return { error: "Correct answer must be one of A, B, C, or D." };
  }

  const { data: newQ, error } = await supabase
    .from("questions")
    .insert({
      course_id: courseId,
      concept_id: data.concept_id,
      question_text: questionText,
      options: data.options,
      correct_answer: data.correct_answer,
      explanation: data.explanation?.trim() || null,
      difficulty: data.difficulty,
    })
    .select("id")
    .single();

  if (error || !newQ) {
    return { error: error?.message || "Failed to create question." };
  }

  revalidatePath(`/teacher/courses/${courseId}/concepts`);
  revalidatePath("/dashboard/practice");
  revalidatePath("/teacher");

  return { success: true, questionId: newQ.id };
}

/**
 * Delete a Question
 */
export async function deleteQuestionAction(courseId: string, questionId: string) {
  const { supabase, user } = await getTeacherUser();
  await verifyCourseOwnership(supabase, courseId, user.id);

  const { error } = await supabase
    .from("questions")
    .delete()
    .eq("id", questionId)
    .eq("course_id", courseId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/teacher/courses/${courseId}/concepts`);
  revalidatePath("/dashboard/practice");

  return { success: true };
}

/**
 * 6. Delete an entire Course (cascades to concepts, edges, questions, attempts, mastery)
 */
export async function deleteCourseAction(courseId: string) {
  const { supabase, user } = await getTeacherUser();
  await verifyCourseOwnership(supabase, courseId, user.id);

  const { error } = await supabase
    .from("courses")
    .delete()
    .eq("id", courseId)
    .eq("teacher_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/teacher");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/practice");

  return { success: true };
}
