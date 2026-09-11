"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { z } from "zod";

const uuidSchema = z.string().uuid("Invalid course ID format.");

// Ensures current session belongs to an authenticated student
async function getStudentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized: Please sign in to enroll.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "student") {
    throw new Error("Forbidden: Only students can enroll in courses.");
  }

  return { supabase, user, profile };
}

// Enrolls the student in a course and synchronizes auth metadata
export async function enrollInCourseAction(courseId: string) {
  try {
    const { supabase, user } = await getStudentUser();

    const parsed = uuidSchema.safeParse(courseId);
    if (!parsed.success) {
      return { error: "Invalid course identifier." };
    }

    const validCourseId = parsed.data;

    const { data: course, error: courseErr } = await supabase
      .from("courses")
      .select("id, title")
      .eq("id", validCourseId)
      .single();

    if (courseErr || !course) {
      return { error: "Course not found or no longer available." };
    }

    const { error: dbError } = await supabase.from("enrollments").insert({
      user_id: user.id,
      course_id: validCourseId,
    });

    const isTableMissing =
      dbError?.code === "PGRST205" ||
      dbError?.message?.includes("does not exist") ||
      dbError?.message?.includes("schema cache");

    if (dbError && dbError.code !== "23505" && !isTableMissing) {
      console.warn("[enrollInCourseAction] Database enrollments insert note:", dbError.message);
    }

    const currentEnrolled: string[] = Array.isArray(user.user_metadata?.enrolledCourseIds)
      ? user.user_metadata.enrolledCourseIds
      : [];
    const updatedList = Array.from(new Set([...currentEnrolled, validCourseId]));

    await supabase.auth.updateUser({
      data: {
        enrolledCourseIds: updatedList,
        selectedCourseId: validCourseId,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/courses");
    revalidatePath("/dashboard/practice");
    revalidatePath("/teacher");

    return { success: true, courseId: validCourseId, courseTitle: course.title };
  } catch (err) {
    console.error("[enrollInCourseAction] Unexpected error:", err);
    if (err instanceof Error && (err.message.includes("Unauthorized") || err.message.includes("Forbidden"))) {
      return { error: err.message };
    }
    return {
      error: "Unable to complete course enrollment. Please try again later.",
    };
  }
}

// Unenrolls the student from a course and updates default selection
export async function unenrollFromCourseAction(courseId: string) {
  try {
    const { supabase, user } = await getStudentUser();

    const parsed = uuidSchema.safeParse(courseId);
    if (!parsed.success) {
      return { error: "Invalid course identifier." };
    }

    const validCourseId = parsed.data;

    await supabase
      .from("enrollments")
      .delete()
      .eq("user_id", user.id)
      .eq("course_id", validCourseId);

    const currentEnrolled: string[] = Array.isArray(user.user_metadata?.enrolledCourseIds)
      ? user.user_metadata.enrolledCourseIds
      : [];
    const updatedList = currentEnrolled.filter((id) => id !== validCourseId);

    const currentSelected = user.user_metadata?.selectedCourseId;
    const nextSelected =
      currentSelected === validCourseId ? updatedList[0] ?? null : currentSelected;

    await supabase.auth.updateUser({
      data: {
        enrolledCourseIds: updatedList,
        selectedCourseId: nextSelected,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/courses");
    revalidatePath("/dashboard/practice");
    revalidatePath("/teacher");

    return { success: true };
  } catch (err) {
    console.error("[unenrollFromCourseAction] Unexpected error:", err);
    if (err instanceof Error && (err.message.includes("Unauthorized") || err.message.includes("Forbidden"))) {
      return { error: err.message };
    }
    return {
      error: "Unable to drop course. Please try again later.",
    };
  }
}
