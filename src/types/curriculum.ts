// Core domain types for curriculum courses, concepts, edges, and quiz questions

export type Difficulty = "easy" | "medium" | "hard";

export interface Course {
  id: string;
  title: string;
  subject?: string | null;
  teacher_id?: string;
  created_at?: string;
}

export interface Concept {
  id: string;
  name: string;
  description: string | null;
  difficulty: string;
  course_id?: string;
}

export interface Edge {
  id: string;
  prerequisite_id: string;
  concept_id: string;
  weight: number;
}

export interface QuestionOption {
  key: string;
  text: string;
}

export interface Question {
  id: string;
  concept_id: string;
  question_text: string;
  options: QuestionOption[];
  correct_answer: string;
  explanation?: string;
  difficulty: Difficulty;
}

export interface SynthesizedConcept {
  name: string;
  description: string;
  difficulty: Difficulty;
}

export interface SynthesizedEdge {
  prerequisiteName: string;
  conceptName: string;
  weight: number;
}

export interface SynthesizedQuestion {
  conceptName: string;
  questionText: string;
  options: Array<{ key: "A" | "B" | "C" | "D"; text: string }>;
  correctAnswer: "A" | "B" | "C" | "D";
  explanation: string;
  difficulty: Difficulty;
}

export interface SynthesisResult {
  courseTitle: string;
  courseSubject: string;
  concepts: SynthesizedConcept[];
  edges: SynthesizedEdge[];
  questions?: SynthesizedQuestion[];
  isAiGenerated: boolean;
  courseId?: string;
}
