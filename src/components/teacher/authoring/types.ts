export interface Concept {
  id: string;
  name: string;
  description: string | null;
  difficulty: string;
}

export interface Edge {
  id: string;
  prerequisite_id: string;
  concept_id: string;
  weight: number;
}

export interface Question {
  id: string;
  concept_id: string;
  question_text: string;
  options: Array<{ key: string; text: string }>;
  correct_answer: string;
  explanation?: string;
  difficulty: "easy" | "medium" | "hard";
}
