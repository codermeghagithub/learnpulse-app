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
import { z } from "zod";

// Input validation schemas

const courseInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Course title must be at least 2 characters.")
    .max(120, "Course title cannot exceed 120 characters."),
  subject: z
    .string()
    .trim()
    .min(2, "Subject department must be at least 2 characters.")
    .max(100, "Subject cannot exceed 100 characters.")
    .default("Computer Science"),
});

const conceptInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Concept name must be at least 2 characters.")
    .max(120, "Concept name cannot exceed 120 characters."),
  description: z
    .string()
    .trim()
    .max(1000, "Description cannot exceed 1000 characters.")
    .optional(),
  difficulty: z.enum(["easy", "medium", "hard"], {
    message: "Difficulty must be easy, medium, or hard.",
  }),
});

const edgeInputSchema = z.object({
  prerequisiteId: z.string().uuid("Invalid prerequisite concept ID."),
  conceptId: z.string().uuid("Invalid concept ID."),
  weight: z.number().int().min(1).max(10).default(2),
});

const questionInputSchema = z.object({
  concept_id: z.string().uuid("Invalid concept ID."),
  question_text: z
    .string()
    .trim()
    .min(5, "Question text must be at least 5 characters.")
    .max(1000, "Question text cannot exceed 1000 characters."),
  options: z
    .array(
      z.object({
        key: z.string().trim().min(1).max(10),
        text: z.string().trim().min(1, "Option text cannot be empty.").max(500, "Option text cannot exceed 500 characters."),
      })
    )
    .length(4, "Exactly 4 options (A, B, C, D) are required."),
  correct_answer: z.enum(["A", "B", "C", "D"], {
    message: "Correct answer must be one of A, B, C, or D.",
  }),
  explanation: z
    .string()
    .trim()
    .max(1000, "Explanation cannot exceed 1000 characters.")
    .optional(),
  difficulty: z.enum(["easy", "medium", "hard"], {
    message: "Difficulty must be easy, medium, or hard.",
  }),
});

const uuidSchema = z.string().uuid("Invalid identifier format.");

import { requireAuth } from "@/lib/auth";

// Auth helpers
const getTeacherUser = () => requireAuth("teacher");

// Verifies teacher owns the specified course
async function verifyCourseOwnership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  courseId: string,
  teacherId: string
) {
  const parsedCourseId = uuidSchema.safeParse(courseId);
  if (!parsedCourseId.success) {
    throw new Error("Invalid course ID");
  }

  const { data: course } = await supabase
    .from("courses")
    .select("id, title")
    .eq("id", parsedCourseId.data)
    .eq("teacher_id", teacherId)
    .maybeSingle();

  if (!course) {
    throw new Error("Course not found or unauthorized");
  }

  return course;
}

// Course operations

export async function createCourseAction(formData: FormData) {
  let newCourseId: string | null = null;
  try {
    const { supabase, user } = await getTeacherUser();

    const parsed = courseInputSchema.safeParse({
      title: formData.get("title"),
      subject: formData.get("subject") || "Computer Science",
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid course details." };
    }

    const { title, subject } = parsed.data;

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
      console.error("[authoring:createCourseAction] Database error:", error);
      if (error?.code === "23505") {
        return { error: "A course with this title already exists in your account." };
      }
      return { error: "Unable to create course. Please try again." };
    }

    newCourseId = newCourse.id;
    revalidatePath("/teacher");
    revalidatePath("/dashboard");
  } catch (err) {
    console.error("[authoring:createCourseAction] Unexpected error:", err);
    return { error: "An unexpected error occurred while creating the course." };
  }

  if (newCourseId) {
    redirect(`/teacher/courses/${newCourseId}/concepts`);
  }
}

// Concept operations

export async function createConceptAction(
  courseId: string,
  data: {
    name: string;
    description?: string;
    difficulty: "easy" | "medium" | "hard";
  }
) {
  try {
    const { supabase, user } = await getTeacherUser();
    await verifyCourseOwnership(supabase, courseId, user.id);

    const parsed = conceptInputSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid concept details." };
    }

    const { name, description, difficulty } = parsed.data;

    const { data: newConcept, error } = await supabase
      .from("concepts")
      .insert({
        course_id: courseId,
        name,
        description: description || null,
        difficulty,
      })
      .select("id, name, difficulty")
      .single();

    if (error || !newConcept) {
      console.error("[authoring:createConceptAction] Database error:", error);
      if (error?.code === "23505") {
        return { error: "A concept with this name already exists in this course." };
      }
      return { error: "Unable to add concept. Please try again." };
    }

    revalidatePath(`/teacher/courses/${courseId}/concepts`);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/practice");
    revalidatePath("/teacher");

    return { success: true, concept: newConcept };
  } catch (err) {
    console.error("[authoring:createConceptAction] Unexpected error:", err);
    return { error: "An unexpected error occurred while adding the concept." };
  }
}

export async function deleteConceptAction(courseId: string, conceptId: string) {
  try {
    const { supabase, user } = await getTeacherUser();
    await verifyCourseOwnership(supabase, courseId, user.id);

    const parsedConceptId = uuidSchema.safeParse(conceptId);
    if (!parsedConceptId.success) {
      return { error: "Invalid concept ID format." };
    }

    const { error } = await supabase
      .from("concepts")
      .delete()
      .eq("id", parsedConceptId.data)
      .eq("course_id", courseId);

    if (error) {
      console.error("[authoring:deleteConceptAction] Database error:", error);
      return { error: "Unable to delete concept. Please try again." };
    }

    revalidatePath(`/teacher/courses/${courseId}/concepts`);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/practice");
    revalidatePath("/teacher");

    return { success: true };
  } catch (err) {
    console.error("[authoring:deleteConceptAction] Unexpected error:", err);
    return { error: "An unexpected error occurred while deleting the concept." };
  }
}

// Edge operations

export async function createPrerequisiteEdgeAction(
  courseId: string,
  prerequisiteId: string,
  conceptId: string,
  weight: number = 2
) {
  try {
    const { supabase, user } = await getTeacherUser();
    await verifyCourseOwnership(supabase, courseId, user.id);

    const parsed = edgeInputSchema.safeParse({ prerequisiteId, conceptId, weight });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid prerequisite edge parameters." };
    }

    const { prerequisiteId: validPrereqId, conceptId: validConceptId, weight: validWeight } = parsed.data;

    if (validPrereqId === validConceptId) {
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
      (e) => e.prerequisite_id === validPrereqId && e.concept_id === validConceptId
    );
    if (alreadyExists) {
      return { error: "This prerequisite relationship already exists." };
    }

    // Construct hypothetical edge list with proposed edge
    const proposedEdge: ConceptEdge = {
      prerequisite_id: validPrereqId,
      concept_id: validConceptId,
      weight: validWeight,
    };
    const potentialEdges: ConceptEdge[] = [...existingEdges, proposedEdge];

    // Mandatory cycle check via topological sort
    const adj = buildAdjacencyList(potentialEdges);
    const topoResult = topologicalSort(allConceptIds, adj);

    if (topoResult === null) {
      const currentAdj = buildAdjacencyList(existingEdges);
      const existingPrereqsOfA = bfsPrerequisites(validPrereqId, currentAdj);
      const blocker = existingPrereqsOfA.find((n) => n.id === validConceptId);

      const nameA = conceptNameMap.get(validPrereqId) || "Prerequisite Concept";
      const nameB = conceptNameMap.get(validConceptId) || "Target Concept";

      const reason = blocker
        ? `This would make "${nameB}" depend on itself through "${nameA}".`
        : "Adding this dependency creates a circular prerequisite chain.";

      return { error: `Cycle detected: ${reason}` };
    }

    // Valid DAG — save edge
    const { data: newEdge, error } = await supabase
      .from("concept_edges")
      .insert({
        course_id: courseId,
        prerequisite_id: validPrereqId,
        concept_id: validConceptId,
        weight: validWeight,
      })
      .select("id")
      .single();

    if (error || !newEdge) {
      console.error("[authoring:createPrerequisiteEdgeAction] Database error:", error);
      return { error: "Unable to establish prerequisite edge. Please try again." };
    }

    revalidatePath(`/teacher/courses/${courseId}/concepts`);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/gaps");

    return { success: true };
  } catch (err) {
    console.error("[authoring:createPrerequisiteEdgeAction] Unexpected error:", err);
    return { error: "An unexpected error occurred while creating the prerequisite relationship." };
  }
}

export async function deletePrerequisiteEdgeAction(courseId: string, edgeId: string) {
  try {
    const { supabase, user } = await getTeacherUser();
    await verifyCourseOwnership(supabase, courseId, user.id);

    const parsedEdgeId = uuidSchema.safeParse(edgeId);
    if (!parsedEdgeId.success) {
      return { error: "Invalid edge ID format." };
    }

    const { error } = await supabase
      .from("concept_edges")
      .delete()
      .eq("id", parsedEdgeId.data)
      .eq("course_id", courseId);

    if (error) {
      console.error("[authoring:deletePrerequisiteEdgeAction] Database error:", error);
      return { error: "Unable to delete prerequisite relationship." };
    }

    revalidatePath(`/teacher/courses/${courseId}/concepts`);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/gaps");

    return { success: true };
  } catch (err) {
    console.error("[authoring:deletePrerequisiteEdgeAction] Unexpected error:", err);
    return { error: "An unexpected error occurred while deleting the prerequisite relationship." };
  }
}

// Question operations

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
  try {
    const { supabase, user } = await getTeacherUser();
    await verifyCourseOwnership(supabase, courseId, user.id);

    const parsed = questionInputSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid question details." };
    }

    const {
      concept_id,
      question_text,
      options,
      correct_answer,
      explanation,
      difficulty,
    } = parsed.data;

    const { data: newQ, error } = await supabase
      .from("questions")
      .insert({
        course_id: courseId,
        concept_id,
        question_text,
        options,
        correct_answer,
        explanation: explanation || null,
        difficulty,
      })
      .select("id")
      .single();

    if (error || !newQ) {
      console.error("[authoring:createQuestionAction] Database error:", error);
      return { error: "Unable to create practice question. Please try again." };
    }

    revalidatePath(`/teacher/courses/${courseId}/concepts`);
    revalidatePath("/dashboard/practice");
    revalidatePath("/teacher");

    return { success: true, questionId: newQ.id };
  } catch (err) {
    console.error("[authoring:createQuestionAction] Unexpected error:", err);
    return { error: "An unexpected error occurred while creating the question." };
  }
}

export async function deleteQuestionAction(courseId: string, questionId: string) {
  try {
    const { supabase, user } = await getTeacherUser();
    await verifyCourseOwnership(supabase, courseId, user.id);

    const parsedQId = uuidSchema.safeParse(questionId);
    if (!parsedQId.success) {
      return { error: "Invalid question ID format." };
    }

    const { error } = await supabase
      .from("questions")
      .delete()
      .eq("id", parsedQId.data)
      .eq("course_id", courseId);

    if (error) {
      console.error("[authoring:deleteQuestionAction] Database error:", error);
      return { error: "Unable to delete question." };
    }

    revalidatePath(`/teacher/courses/${courseId}/concepts`);
    revalidatePath("/dashboard/practice");

    return { success: true };
  } catch (err) {
    console.error("[authoring:deleteQuestionAction] Unexpected error:", err);
    return { error: "An unexpected error occurred while deleting the question." };
  }
}

export async function deleteCourseAction(courseId: string) {
  try {
    const { supabase, user } = await getTeacherUser();
    await verifyCourseOwnership(supabase, courseId, user.id);

    const parsedCourseId = uuidSchema.safeParse(courseId);
    if (!parsedCourseId.success) {
      return { error: "Invalid course ID format." };
    }

    const { error } = await supabase
      .from("courses")
      .delete()
      .eq("id", parsedCourseId.data)
      .eq("teacher_id", user.id);

    if (error) {
      console.error("[authoring:deleteCourseAction] Database error:", error);
      return { error: "Unable to delete course. Please try again." };
    }

    revalidatePath("/teacher");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/practice");

    return { success: true };
  } catch (err) {
    console.error("[authoring:deleteCourseAction] Unexpected error:", err);
    return { error: "An unexpected error occurred while deleting the course." };
  }
}
