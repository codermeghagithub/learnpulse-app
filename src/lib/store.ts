import { create } from "zustand";

/**
 * Global course selection state for student and teacher dashboard views.
 * Persists the chosen course ID in both Zustand in-memory state and a client cookie
 * so Next.js server components can read the active course during server-side rendering.
 */
interface CourseStore {
  selectedCourseId: string | null;
  setSelectedCourseId: (courseId: string) => void;
}

export const useCourseStore = create<CourseStore>((set) => ({
  selectedCourseId: null,

  setSelectedCourseId: (courseId: string) => {
    // Keep cookie in sync so server components know which course the user selected
    if (typeof document !== "undefined") {
      document.cookie = `selectedCourseId=${encodeURIComponent(courseId)}; path=/; max-age=86400; SameSite=Lax`;
    }
    set({ selectedCourseId: courseId });
  },
}));
