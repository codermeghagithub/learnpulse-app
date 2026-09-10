import { describe, it, expect, vi } from "vitest";
import { getStudentEnrolledCourseIds } from "@/lib/enrollment";

describe("Course Enrollment System", () => {
  it("resolves enrolled course IDs from the database enrollments table when present", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ course_id: "course-uuid-1" }, { course_id: "course-uuid-2" }],
            error: null,
          }),
        }),
      }),
    };

    type SupabaseClientParam = Parameters<typeof getStudentEnrolledCourseIds>[0];

    const enrolledIds = await getStudentEnrolledCourseIds(
      mockSupabase as unknown as SupabaseClientParam,
      "student-uuid",
      { enrolledCourseIds: ["fallback-id"] }
    );

    expect(enrolledIds).toEqual(["course-uuid-1", "course-uuid-2"]);
    expect(mockSupabase.from).toHaveBeenCalledWith("enrollments");
  });

  it("resiliently falls back to user_metadata when enrollments table is empty or unmigrated", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { code: "PGRST205", message: "Could not find table public.enrollments" },
          }),
        }),
      }),
    };

    type SupabaseClientParam = Parameters<typeof getStudentEnrolledCourseIds>[0];

    const enrolledIds = await getStudentEnrolledCourseIds(
      mockSupabase as unknown as SupabaseClientParam,
      "student-uuid",
      { enrolledCourseIds: ["meta-course-1", "meta-course-2"] }
    );

    expect(enrolledIds).toEqual(["meta-course-1", "meta-course-2"]);
  });

  it("returns empty array when student has no enrollments anywhere", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    };

    type SupabaseClientParam = Parameters<typeof getStudentEnrolledCourseIds>[0];

    const enrolledIds = await getStudentEnrolledCourseIds(
      mockSupabase as unknown as SupabaseClientParam,
      "student-uuid",
      {}
    );

    expect(enrolledIds).toEqual([]);
  });

  it("handles null or undefined metadata gracefully", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockRejectedValue(new Error("Network error")),
        }),
      }),
    };

    type SupabaseClientParam = Parameters<typeof getStudentEnrolledCourseIds>[0];

    const enrolledIds = await getStudentEnrolledCourseIds(
      mockSupabase as unknown as SupabaseClientParam,
      "student-uuid",
      undefined
    );

    expect(enrolledIds).toEqual([]);
  });
});
