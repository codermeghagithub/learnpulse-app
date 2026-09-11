// Data service for teacher class overview, student mastery metrics, and risk calculation

import { createClient } from "@/utils/supabase/server";
import { getEnrolledStudentsForCourse } from "@/lib/enrollment";
import { computeRisk, inactivityScore, type RiskResult } from "@/lib/algorithms/risk";
import { getDaysSince } from "@/lib/utils";
import type { Course } from "@/types/curriculum";

export interface TeacherCourseConcept {
  id: string;
  name: string;
  difficulty: string;
  course_id?: string;
  average: number;
  studentCount: number;
}

export interface StudentRosterItem {
  id: string;
  name: string;
  hasCourseAttempts: boolean;
  courseAvgMastery: number;
  courseConceptCount: number;
  courseTotalAttempts: number;
  courseRisk: RiskResult;
}

export interface TeacherDashboardData {
  validCourses: Course[];
  selectedCourse: Course | null;
  selectedCourseId: string | null;
  conceptAverages: TeacherCourseConcept[];
  classStudents: Array<{ id: string; full_name: string }>;
  studentRoster: StudentRosterItem[];
  activeStudentsInCourse: StudentRosterItem[];
  atRiskStudentsInCourse: StudentRosterItem[];
  displayClassAvg: number;
  displayAttemptsCount: number;
}

// Loads teacher courses, active enrollment, concept mastery averages, and student risk scores
export async function getTeacherDashboardData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  userMetadataCourseId: string | null,
  paramCourseId?: string
): Promise<TeacherDashboardData> {
  // Fetch teacher's courses
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, subject")
    .eq("teacher_id", userId)
    .order("title");

  const validCourses: Course[] = courses ?? [];

  if (validCourses.length === 0) {
    return {
      validCourses: [],
      selectedCourse: null,
      selectedCourseId: null,
      conceptAverages: [],
      classStudents: [],
      studentRoster: [],
      activeStudentsInCourse: [],
      atRiskStudentsInCourse: [],
      displayClassAvg: 0,
      displayAttemptsCount: 0,
    };
  }

  // Determine selected course from URL parameter or user metadata
  const activeCourseId =
    paramCourseId && validCourses.some((c) => c.id === paramCourseId)
      ? paramCourseId
      : userMetadataCourseId && validCourses.some((c) => c.id === userMetadataCourseId)
        ? userMetadataCourseId
        : null;

  const selectedCourse =
    validCourses.find((c) => c.id === activeCourseId) ?? validCourses[0];
  const selectedCourseId = selectedCourse.id;

  if (selectedCourseId && selectedCourseId !== userMetadataCourseId) {
    await supabase.auth.updateUser({
      data: { selectedCourseId },
    });
  }

  // Fetch all concepts in selected course
  const { data: concepts } = await supabase
    .from("concepts")
    .select("id, name, difficulty, course_id")
    .eq("course_id", selectedCourseId);

  const conceptList = concepts ?? [];
  const conceptIds = conceptList.map((c) => c.id);

  // Fetch student profiles actively enrolled in the selected course
  const classStudents = await getEnrolledStudentsForCourse(supabase, selectedCourseId);

  // Fetch mastery records in the selected course
  const { data: courseMastery } =
    conceptIds.length > 0
      ? await supabase
          .from("mastery")
          .select("user_id, concept_id, score, attempts_count, correct_count, updated_at")
          .in("concept_id", conceptIds)
      : { data: [] };

  // Compute class average per concept in this course
  const masteryByConcept = new Map<string, number[]>();
  for (const m of courseMastery ?? []) {
    if (!masteryByConcept.has(m.concept_id)) {
      masteryByConcept.set(m.concept_id, []);
    }
    masteryByConcept.get(m.concept_id)!.push(m.score);
  }

  const conceptAverages: TeacherCourseConcept[] = conceptList
    .map((c) => {
      const scores = masteryByConcept.get(c.id) ?? [];
      const avg =
        scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0;
      return { ...c, average: avg, studentCount: scores.length };
    })
    .sort((a, b) => a.average - b.average);

  // Map course-specific student mastery
  const studentCourseDataMap = new Map<
    string,
    { scores: number[]; lastAttempt?: string; errors: number; total: number }
  >();

  for (const m of courseMastery ?? []) {
    if (!studentCourseDataMap.has(m.user_id)) {
      studentCourseDataMap.set(m.user_id, { scores: [], errors: 0, total: 0 });
    }
    const entry = studentCourseDataMap.get(m.user_id)!;
    entry.scores.push(m.score);
    entry.total += m.attempts_count;
    entry.errors += m.attempts_count - m.correct_count;
    if (!entry.lastAttempt || (m.updated_at && m.updated_at > entry.lastAttempt)) {
      entry.lastAttempt = m.updated_at;
    }
  }

  // Build performance roster for students enrolled in this course
  const studentRoster: StudentRosterItem[] = classStudents.map((student) => {
    const courseData = studentCourseDataMap.get(student.id);

    const hasCourseAttempts = !!courseData && courseData.scores.length > 0;
    const courseAvgMastery = hasCourseAttempts
      ? courseData.scores.reduce((a, b) => a + b, 0) / courseData.scores.length
      : 0;
    const courseDaysSinceLast = courseData
      ? getDaysSince(courseData.lastAttempt)
      : 999;
    const courseRepeatedErrors =
      courseData && courseData.total > 0
        ? courseData.errors / courseData.total
        : 0;

    const courseRisk = computeRisk({
      masteryScore: courseAvgMastery,
      decline: 0,
      repeatedErrors: courseRepeatedErrors,
      inactivity: inactivityScore(courseDaysSinceLast),
    });

    return {
      id: student.id,
      name: student.full_name,
      hasCourseAttempts,
      courseAvgMastery,
      courseConceptCount: courseData?.scores.length ?? 0,
      courseTotalAttempts: courseData?.total ?? 0,
      courseRisk,
    };
  });

  // Sort roster: active high-risk students first, then unstarted alphabetically
  studentRoster.sort((a, b) => {
    if (a.hasCourseAttempts && !b.hasCourseAttempts) return -1;
    if (!a.hasCourseAttempts && b.hasCourseAttempts) return 1;
    if (a.hasCourseAttempts && b.hasCourseAttempts) {
      return b.courseRisk.score - a.courseRisk.score;
    }
    return a.name.localeCompare(b.name);
  });

  const activeStudentsInCourse = studentRoster.filter((s) => s.hasCourseAttempts);
  const atRiskStudentsInCourse = activeStudentsInCourse.filter(
    (s) => s.courseRisk.bucket === "At Risk" || s.courseRisk.bucket === "Critical"
  );

  const courseClassAvg =
    activeStudentsInCourse.length > 0
      ? activeStudentsInCourse.reduce((sum, s) => sum + s.courseAvgMastery, 0) /
        activeStudentsInCourse.length
      : 0;

  return {
    validCourses,
    selectedCourse,
    selectedCourseId,
    conceptAverages,
    classStudents,
    studentRoster,
    activeStudentsInCourse,
    atRiskStudentsInCourse,
    displayClassAvg: courseClassAvg,
    displayAttemptsCount: activeStudentsInCourse.length,
  };
}
