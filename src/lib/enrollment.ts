import type { createClient } from "@/utils/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Fetch the list of course IDs that a student is actively enrolled in.
 * Dual-tier resolution: checks database `enrollments` table with user_metadata fallback.
 */
export async function getStudentEnrolledCourseIds(
  supabase: SupabaseServerClient,
  userId: string,
  userMetadata?: Record<string, unknown>
): Promise<string[]> {
  try {
    const { data: enrollmentRows, error } = await supabase
      .from("enrollments")
      .select("course_id")
      .eq("user_id", userId);

    if (!error && enrollmentRows && enrollmentRows.length > 0) {
      return enrollmentRows.map((r: { course_id: string }) => r.course_id);
    }
  } catch (err) {
    // Table may not be migrated yet in Supabase
    console.warn("[getStudentEnrolledCourseIds] Note:", err);
  }

  // Resilient fallback 1: read from user_metadata passed directly
  if (userMetadata && Array.isArray(userMetadata.enrolledCourseIds)) {
    return userMetadata.enrolledCourseIds as string[];
  }

  // Resilient fallback 2: if userMetadata was not provided (e.g. called from teacher views), fetch via admin service role
  if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
      const admin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { persistSession: false } }
      );
      const { data: userData } = await admin.auth.admin.getUserById(userId);
      if (
        userData?.user?.user_metadata?.enrolledCourseIds &&
        Array.isArray(userData.user.user_metadata.enrolledCourseIds)
      ) {
        return userData.user.user_metadata.enrolledCourseIds as string[];
      }
    } catch (adminErr) {
      console.warn("[getStudentEnrolledCourseIds] Admin fallback note:", adminErr);
    }
  }

  return [];
}

/**
 * Fetch the student roster enrolled in a given course.
 * Dual-tier resolution: checks database `enrollments` table joined with `profiles`,
 * and falls back to user_metadata scanning if the table is not yet migrated.
 */
interface EnrolledProfileRow {
  user_id: string;
  profiles: { id: string; full_name: string } | null;
}

export async function getEnrolledStudentsForCourse(
  supabase: SupabaseServerClient,
  courseId: string
): Promise<Array<{ id: string; full_name: string }>> {
  try {
    const { data: enrollmentRows, error } = await supabase
      .from("enrollments")
      .select("user_id, profiles:user_id(id, full_name)")
      .eq("course_id", courseId);

    if (!error && enrollmentRows && enrollmentRows.length > 0) {
      return (enrollmentRows as unknown as EnrolledProfileRow[])
        .map((r) => r.profiles)
        .filter((p): p is { id: string; full_name: string } => Boolean(p && p.id));
    }
  } catch (err) {
    console.warn("[getEnrolledStudentsForCourse] DB query note:", err);
  }

  // Resilient fallback: scan student user metadata via admin service role if available
  if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
      const admin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { persistSession: false } }
      );
      const { data: { users } } = await admin.auth.admin.listUsers();
      if (users && users.length > 0) {
        const enrolled = users
          .filter((u) => {
            const list = u.user_metadata?.enrolledCourseIds;
            return Array.isArray(list) && list.includes(courseId);
          })
          .map((u) => ({
            id: u.id,
            full_name: (u.user_metadata?.full_name as string) || u.email || "Student",
          }));
        return enrolled;
      }
    } catch (err) {
      console.warn("[getEnrolledStudentsForCourse] Admin fallback note:", err);
    }
  }

  return [];
}

