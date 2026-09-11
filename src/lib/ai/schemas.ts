import { z } from "zod";

// Diagnosis schemas
export const actionPlanItemSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  estimatedMinutes: z.number().int().positive(),
});

export const diagnosisOutputSchema = z.object({
  rootCause: z.string().min(1),
  blockingConcept: z.string().min(1),
  confidence: z.number().min(0).max(1),
  explanation: z.string().min(1),
  actionPlan: z.array(actionPlanItemSchema).min(1).max(5),
});

// Misconception and cognitive dissonance schemas
export const cognitiveDissonanceSchema = z.object({
  paradoxScenario: z.string().min(1),
  counterQuestion: z.string().min(1),
});

export const misconceptionSectionSchema = z.object({
  thoughtTrap: z.string().min(1),
  mentalAnchor: z.string().min(1),
  cognitiveDissonance: cognitiveDissonanceSchema,
});

export const misconceptionOutputSchema = z.object({
  thoughtTrap: z.string().min(1),
  mentalAnchor: z.string().min(1),
  vernacularAnchor: z.string().optional(),
  cognitiveDissonance: cognitiveDissonanceSchema,
  en: misconceptionSectionSchema.optional(),
  hi: misconceptionSectionSchema.optional(),
});

// Concept bite remediation schemas
export const quickCheckOptionSchema = z.object({
  key: z.enum(["A", "B", "C", "D"]),
  text: z.string().min(1),
});

export const quickCheckSchema = z.object({
  question: z.string().min(1),
  options: z.array(quickCheckOptionSchema).min(2).max(4),
  correctAnswer: z.enum(["A", "B", "C", "D"]),
  explanation: z.string().min(1),
});

export const conceptBiteSectionSchema = z.object({
  intuition: z.string().min(1),
  analogy: z.string().min(1),
  anchor: z.string().min(1),
  quickCheck: quickCheckSchema,
});

export const bilingualChallengeSchema = z.object({
  en: quickCheckSchema,
  hi: quickCheckSchema,
});

export const conceptBiteSchema = z.object({
  conceptName: z.string().min(1),
  intuition: z.string().min(1),
  analogy: z.string().min(1),
  quickCheck: quickCheckSchema,
  vernacularAnchor: z.string().optional(),
  anchorEn: z.string().optional(),
  anchorHi: z.string().optional(),
  en: conceptBiteSectionSchema.optional(),
  hi: conceptBiteSectionSchema.optional(),
  challengePool: z.array(bilingualChallengeSchema).optional(),
  isAiGenerated: z.boolean().optional(),
});

// DAG course synthesis schemas
export const synthesizedConceptSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]),
});

export const synthesizedEdgeSchema = z.object({
  prerequisiteName: z.string().min(1),
  conceptName: z.string().min(1),
  weight: z.number().min(0.1).max(1),
});

export const synthesizedQuestionSchema = z.object({
  conceptName: z.string().min(1),
  questionText: z.string().min(5),
  options: z.array(
    z.object({
      key: z.enum(["A", "B", "C", "D"]),
      text: z.string().min(1),
    })
  ).length(4),
  correctAnswer: z.enum(["A", "B", "C", "D"]),
  explanation: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
});

export const dagSynthesisOutputSchema = z.object({
  courseTitle: z.string().min(1),
  courseSubject: z.string().min(1),
  concepts: z.array(synthesizedConceptSchema).min(2).max(20),
  edges: z.array(synthesizedEdgeSchema),
  questions: z.array(synthesizedQuestionSchema).optional().default([]),
});

// Type exports
export type ActionPlanItem = z.infer<typeof actionPlanItemSchema>;
export type DiagnosisOutput = z.infer<typeof diagnosisOutputSchema>;
export type MisconceptionSection = z.infer<typeof misconceptionSectionSchema>;
export type MisconceptionOutput = z.infer<typeof misconceptionOutputSchema>;
export type CognitiveDissonance = z.infer<typeof cognitiveDissonanceSchema>;
export type QuickCheckOption = z.infer<typeof quickCheckOptionSchema>;
export type QuickCheck = z.infer<typeof quickCheckSchema>;
export type ConceptBiteSection = z.infer<typeof conceptBiteSectionSchema>;
export type BilingualChallenge = z.infer<typeof bilingualChallengeSchema>;
export type ConceptBiteOutput = z.infer<typeof conceptBiteSchema>;
export type SynthesizedConcept = z.infer<typeof synthesizedConceptSchema>;
export type SynthesizedEdge = z.infer<typeof synthesizedEdgeSchema>;
export type SynthesizedQuestion = z.infer<typeof synthesizedQuestionSchema>;
export type DagSynthesisOutput = z.infer<typeof dagSynthesisOutputSchema>;

export interface DiagnosisInput {
  targetConcept: string;
  targetMastery: number;
  prerequisites: Array<{
    concept: string;
    mastery: number;
    rootCauseScore: number;
  }>;
  recentMistakes: string[];
}
