import { create } from "zustand";

interface CourseStore {
  selectedCourseId: string | null;
  setSelectedCourseId: (courseId: string) => void;
}

export const useCourseStore = create<CourseStore>((set) => ({
  selectedCourseId: null,
  setSelectedCourseId: (courseId: string) => {
    if (typeof document !== "undefined") {
      document.cookie = `selectedCourseId=${encodeURIComponent(courseId)}; path=/; max-age=86400; SameSite=Lax`;
    }
    set({ selectedCourseId: courseId });
  },
}));
