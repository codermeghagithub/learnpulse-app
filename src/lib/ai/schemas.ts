/**
 * schemas.ts — Zod schemas for Gemini API response validation
 *
 * ALL Gemini responses MUST be validated against these schemas before
 * touching the UI. If validation fails, the fallback path is triggered.
 */

import { z } from "zod";

// ─── Diagnosis Schemas ────────────────────────────────────────────────────────

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

// ─── Misconception + Cognitive Dissonance Schemas ─────────────────────────────

/**
 * The "Cognitive Dissonance" section delivers a concrete counter-example
 * scenario that forces the student's false mental model to collapse in
 * under 30 seconds — far more effective than a generic explanation.
 */
export const cognitiveDissonanceSchema = z.object({
  /** A short, punchy paradox or scenario where the student's wrong rule breaks. */
  paradoxScenario: z.string().min(1),
  /** A targeted follow-up question to prompt genuine reflection. */
  counterQuestion: z.string().min(1),
});

export const misconceptionOutputSchema = z.object({
  /** Diagnoses the cognitive mix-up that caused the wrong selection. */
  thoughtTrap: z.string().min(1),
  /** A 10-second memorable rule-of-thumb contrast to prevent future errors. */
  mentalAnchor: z.string().min(1),
  /** Vernacular (Hindi/Hinglish) rule of thumb for NEP 2020 mother-tongue conceptual reinforcement. */
  vernacularAnchor: z.string().optional(),
  /** Counter-example that forces the student's false model to break down. */
  cognitiveDissonance: cognitiveDissonanceSchema,
});

// ─── Concept Bite Remediation Schemas ─────────────────────────────────────────

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
});

export type QuickCheckOption = z.infer<typeof quickCheckOptionSchema>;
export type QuickCheck = z.infer<typeof quickCheckSchema>;
export type ConceptBiteSection = z.infer<typeof conceptBiteSectionSchema>;
export type BilingualChallenge = z.infer<typeof bilingualChallengeSchema>;
export type ConceptBiteOutput = z.infer<typeof conceptBiteSchema>;

// ─── DAG Synthesis Schemas ────────────────────────────────────────────────────


/**
 * A single atomic concept extracted from free-form topic text.
 */
export const synthesizedConceptSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]),
});

/**
 * A prerequisite edge: the concept named `prerequisiteName` must be
 * understood before `conceptName`. Weight signals how tightly coupled
 * the dependency is (1 = direct, strong; 0.5 = partial).
 */
export const synthesizedEdgeSchema = z.object({
  prerequisiteName: z.string().min(1),
  conceptName: z.string().min(1),
  weight: z.number().min(0.1).max(1),
});

/**
 * A practice MCQ question synthesized for a concept.
 */
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

/**
 * Full result of a DAG synthesis call — course title, atomic concepts,
 * prerequisite edges, and practice diagnostic questions.
 */
export const dagSynthesisOutputSchema = z.object({
  courseTitle: z.string().min(1),
  courseSubject: z.string().min(1),
  concepts: z.array(synthesizedConceptSchema).min(2).max(20),
  edges: z.array(synthesizedEdgeSchema),
  questions: z.array(synthesizedQuestionSchema).optional().default([]),
});

// ─── Type Exports ─────────────────────────────────────────────────────────────

export type ActionPlanItem = z.infer<typeof actionPlanItemSchema>;
export type DiagnosisOutput = z.infer<typeof diagnosisOutputSchema>;
export type MisconceptionOutput = z.infer<typeof misconceptionOutputSchema>;
export type CognitiveDissonance = z.infer<typeof cognitiveDissonanceSchema>;
export type SynthesizedConcept = z.infer<typeof synthesizedConceptSchema>;
export type SynthesizedEdge = z.infer<typeof synthesizedEdgeSchema>;
export type SynthesizedQuestion = z.infer<typeof synthesizedQuestionSchema>;
export type DagSynthesisOutput = z.infer<typeof dagSynthesisOutputSchema>;

/**
 * Input shape for Gemini diagnosis calls.
 * Constructed server-side from DB data + algorithm output.
 */
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
