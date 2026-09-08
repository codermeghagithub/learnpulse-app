/**
 * schemas.ts — Zod schemas for Gemini API response validation
 *
 * ALL Gemini responses MUST be validated against these schemas before
 * touching the UI. If validation fails, the fallback path is triggered.
 */

import { z } from "zod";

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

export const misconceptionOutputSchema = z.object({
  thoughtTrap: z.string().min(1),
  mentalAnchor: z.string().min(1),
});

export type ActionPlanItem = z.infer<typeof actionPlanItemSchema>;
export type DiagnosisOutput = z.infer<typeof diagnosisOutputSchema>;
export type MisconceptionOutput = z.infer<typeof misconceptionOutputSchema>;

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
