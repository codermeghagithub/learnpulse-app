import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { synthesizeDag } from "@/lib/ai/gemini";
import {
  synthesizedConceptSchema,
  synthesizedEdgeSchema,
  synthesizedQuestionSchema,
} from "@/lib/ai/schemas";
import { buildAdjacencyList, topologicalSort } from "@/lib/algorithms/graph";
import { z } from "zod";

// ─── Request Validation ───────────────────────────────────────────────────────

const requestSchema = z
  .object({
    /** Free-form topic text, syllabus excerpt, or comma-separated topic list. */
    topicText: z.string().max(3000).optional().default(""),
    /** Explicit course / subject name (e.g. "Artificial Intelligence", "Data Mining and Warehousing") */
    courseTitle: z.string().min(2).max(120).optional(),
    /** Academic department / discipline (e.g. "Computer Science & Engineering") */
    courseSubject: z.string().min(2).max(100).optional(),
    /** Teacher-reviewed / edited concepts to persist directly */
    concepts: z.array(synthesizedConceptSchema).min(1).max(30).optional(),
    /** Teacher-reviewed / edited edges to persist directly */
    edges: z.array(synthesizedEdgeSchema).optional(),
    /** Teacher-reviewed / edited practice questions */
    questions: z.array(synthesizedQuestionSchema).optional(),
    /** Optional: if provided, adds synthesized DAG directly to an existing course */
    targetCourseId: z.string().uuid().optional(),
    /**
     * If true, persist the synthesized course + concepts + edges + questions to the database.
     * If false (default), only return the preview without writing anything.
     */
    persist: z.boolean().default(false),
  })

  .refine(
    (data) =>
      (data.concepts && data.concepts.length > 0) ||
      (data.courseTitle && data.courseTitle.trim().length >= 2) ||
      (data.topicText && data.topicText.trim().length >= 5),
    {
      message:
        "Please provide a Course/Subject name (e.g. 'Artificial Intelligence') or syllabus topic text.",
    }
  );

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // Auth check — only authenticated teachers can persist a course
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check — read from DB, never trust the client
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "teacher") {
      return NextResponse.json({ error: "Forbidden — teacher role required" }, { status: 403 });
    }

    // Validate request body
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      console.warn("[/api/ai/synthesize-dag] Validation failure:", parsed.error.format());
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 }
      );
    }

    const {
      topicText,
      courseTitle,
      courseSubject,
      concepts: clientConcepts,
      edges: clientEdges,
      questions: clientQuestions,
      targetCourseId,
      persist,
    } = parsed.data;


    // If teacher already reviewed/edited the concepts in preview and sent them to persist,
    // use the teacher's exact reviewed version — NEVER re-call AI on persist!
    let effectiveConcepts = clientConcepts;
    let effectiveEdges = clientEdges ?? [];
    let effectiveQuestions = clientQuestions ?? [];
    let isAiGenerated = false;
    let finalCourseTitle = courseTitle?.trim() || "";
    let finalCourseSubject = courseSubject?.trim() || "Computer Science";

    if (!effectiveConcepts || effectiveConcepts.length === 0) {
      // Free-form synthesis needed (preview mode)
      const effectiveTopicText =
        topicText && topicText.trim().length >= 5
          ? topicText.trim()
          : `Comprehensive university curriculum and foundational concepts for the course: ${courseTitle}`;

      const dagResult = await synthesizeDag(effectiveTopicText, courseTitle);
      effectiveConcepts = dagResult.concepts;
      effectiveEdges = dagResult.edges;
      effectiveQuestions = dagResult.questions ?? [];
      isAiGenerated = dagResult.isAiGenerated;
      finalCourseTitle = courseTitle?.trim() || dagResult.courseTitle;
      finalCourseSubject = courseSubject?.trim() || dagResult.courseSubject;
    }

    // ── Cycle Detection via Kahn's Algorithm ──────────────────────────────────
    // Convert edges to the ConceptEdge format expected by graph.ts
    // We use concept names as temporary IDs for validation before DB insertion.
    const nameToTempId = new Map<string, string>();
    effectiveConcepts.forEach((c, i) => {
      nameToTempId.set(c.name, `temp_${i}`);
    });

    const tempEdges = effectiveEdges.map((e) => ({
      prerequisite_id: nameToTempId.get(e.prerequisiteName) ?? "",
      concept_id: nameToTempId.get(e.conceptName) ?? "",
      weight: e.weight,
    }));

    const adj = buildAdjacencyList(tempEdges);
    const sortedIds = topologicalSort(Array.from(nameToTempId.values()), adj);

    // If topologicalSort returns null, graph contains a cycle — reject it
    if (!sortedIds) {
      return NextResponse.json(
        { error: "Course prerequisite graph contains a dependency cycle. Please remove circular dependencies." },
        { status: 422 }
      );
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Preview mode: return validated DAG without writing to the database
    if (!persist) {
      return NextResponse.json({
        courseTitle: finalCourseTitle,
        courseSubject: finalCourseSubject,
        concepts: effectiveConcepts,
        edges: effectiveEdges,
        questions: effectiveQuestions,
        isAiGenerated,
        cycleDetected: false,
        persisted: false,
      });
    }

    // ── Persist to Database ───────────────────────────────────────────────────
    let effectiveCourseId: string;

    if (!targetCourseId) {
      // 1. Insert new course with the academic course title
      const { data: newCourse, error: courseError } = await supabase
        .from("courses")
        .insert({
          teacher_id: user.id,
          title: finalCourseTitle,
          subject: finalCourseSubject,
        })
        .select("id")
        .single();

      if (courseError || !newCourse) {
        console.error("[synthesize-dag] Course insert failed:", courseError);
        return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
      }
      effectiveCourseId = newCourse.id;
    } else {
      // Verify teacher owns the target course
      const { data: existingCourse } = await supabase
        .from("courses")
        .select("id")
        .eq("id", targetCourseId)
        .eq("teacher_id", user.id)
        .single();

      if (!existingCourse) {
        return NextResponse.json({ error: "Target course not found or unauthorized" }, { status: 404 });
      }
      effectiveCourseId = targetCourseId;
    }


    // 2. Insert concepts (in topological order to satisfy any future FK ordering)
    const { data: insertedConcepts, error: conceptsError } = await supabase
      .from("concepts")
      .insert(
        effectiveConcepts.map((c) => ({
          course_id: effectiveCourseId,
          name: c.name,
          description: c.description,
          difficulty: c.difficulty,
        }))
      )
      .select("id, name");


    if (conceptsError || !insertedConcepts) {
      console.error("[synthesize-dag] Concepts insert failed:", conceptsError);
      // ACID Rollback: Remove the orphan course created in step 1
      if (!targetCourseId) {
        console.warn("[synthesize-dag] Rolling back newly created course:", effectiveCourseId);
        await supabase.from("courses").delete().eq("id", effectiveCourseId);
      }
      return NextResponse.json({ error: "Failed to insert concepts: rolled back course" }, { status: 500 });
    }

    // 3. Build name → real DB UUID map
    const nameToDbId = new Map(insertedConcepts.map((c) => [c.name, c.id]));

    // 4. Insert edges (skip any whose names didn't resolve to a DB ID)
    const edgesToInsert = effectiveEdges
      .map((e) => ({
        course_id: effectiveCourseId,
        prerequisite_id: nameToDbId.get(e.prerequisiteName),
        concept_id: nameToDbId.get(e.conceptName),
        weight: e.weight,
      }))
      .filter((e) => e.prerequisite_id && e.concept_id);

    if (edgesToInsert.length > 0) {
      const { error: edgesError } = await supabase.from("concept_edges").insert(edgesToInsert);
      if (edgesError) {
        console.error("[synthesize-dag] Edges insert failed:", edgesError);
        // Non-fatal: edges failing doesn't destroy the course — teacher can add them manually
      }
    }

    // 5. Insert practice questions linked to concepts
    if (effectiveQuestions.length > 0) {
      const questionsToInsert: Array<{
        course_id: string;
        concept_id: string;
        question_text: string;
        options: Array<{ key: string; text: string }>;
        correct_answer: string;
        explanation: string;
        difficulty: string;
      }> = [];

      for (const q of effectiveQuestions) {
        const conceptId = nameToDbId.get(q.conceptName);
        if (conceptId) {
          questionsToInsert.push({
            course_id: effectiveCourseId,
            concept_id: conceptId,
            question_text: q.questionText,
            options: q.options,
            correct_answer: q.correctAnswer,
            explanation: q.explanation,
            difficulty: q.difficulty,
          });
        }
      }

      if (questionsToInsert.length > 0) {
        const { error: questionsError } = await supabase.from("questions").insert(questionsToInsert);
        if (questionsError) {
          console.error("[synthesize-dag] Questions insert failed:", questionsError);
        }
      }
    }

    return NextResponse.json({
      courseTitle: finalCourseTitle,
      courseSubject: finalCourseSubject,
      concepts: effectiveConcepts,
      edges: effectiveEdges,
      questions: effectiveQuestions,
      courseId: effectiveCourseId,
      cycleDetected: false,
      persisted: true,
    });

  } catch (err) {
    console.error("[/api/ai/synthesize-dag] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
