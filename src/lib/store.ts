import { create } from "zustand";

/**
 * Global course selection state for student and teacher views.
 * Simple, beginner-friendly in-memory state.
 */
interface CourseState {
  selectedCourseId: string | null;
  setSelectedCourseId: (courseId: string) => void;
}

export const useCourseStore = create<CourseState>((set) => ({
  selectedCourseId: null,
  setSelectedCourseId: (courseId: string) => set({ selectedCourseId: courseId }),
}));
