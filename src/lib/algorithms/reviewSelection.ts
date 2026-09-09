/**
 * reviewSelection.ts — Decay-Aware Review Question Selector
 *
 * When a concept's mastery has decayed (isDue=true), selects a review question
 * that tests retention through forward DAG application:
 * 1. Finds direct forward dependents via getForwardDependents, sorted by weight.
 * 2. Selects an unseen question from the highest-weight dependent's bank.
 * 3. Falls back to an unseen question from the decayed concept's own bank.
 * 4. Last resort: selects the least-recently-attempted question.
 *
 * Review questions are never the exact same question the student already answered
 * for the decayed concept when an alternative exists.
 */

import { createClient } from "@/utils/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getForwardDependents, type Graph } from "./graph";

export interface ReviewQuestion {
  id: string;
  concept_id: string;
  question_text: string;
  options: Array<{ key: string; text: string }>;
  correct_answer?: string;
  explanation?: string;
  difficulty: "easy" | "medium" | "hard";
  isReviewQuestion?: boolean;
  originConceptId?: string;
}

export interface SelectReviewQuestionParams {
  studentId: string;
  decayedConceptId: string;
  graph: Graph;
  supabase?: SupabaseClient;
}

/**
 * Filter questions to those with no successful attempts (is_correct=true).
 * Reusable across practice page and review selection.
 */
export function filterUnmasteredQuestions<T extends { id: string }>(
  questions: T[],
  masteredIds: Set<string>
): T[] {
  return questions.filter((q) => !masteredIds.has(q.id));
}

/**
 * Select the optimal review question for a student whose concept has decayed.
 *
 * @param params Configuration and DAG graph
 * @param explicitClient Optional Supabase client for dependency injection / testing
 * @returns ReviewQuestion with originConceptId set, or null if no questions available
 */
export async function selectReviewQuestion(
  params: SelectReviewQuestionParams,
  explicitClient?: SupabaseClient
): Promise<ReviewQuestion | null> {
  const { studentId, decayedConceptId, graph } = params;
  const client = (explicitClient ?? params.supabase ?? (await createClient())) as SupabaseClient;

  // 1. Get forward dependents sorted by weight descending
  const dependents = getForwardDependents(graph, decayedConceptId);

  // Helper to fetch questions and student attempts for a concept
  async function getConceptQuestionsWithAttempts(conceptId: string) {
    const { data: questions } = await client
      .from("questions")
      .select("id, concept_id, question_text, options, correct_answer, explanation, difficulty")
      .eq("concept_id", conceptId);

    const qList: ReviewQuestion[] = questions ?? [];
    if (qList.length === 0) {
      return { questions: [], attempts: [] };
    }

    const qIds = qList.map((q) => q.id);
    const { data: attempts } = await client
      .from("attempts")
      .select("question_id, is_correct, created_at")
      .eq("user_id", studentId)
      .in("question_id", qIds);

    return {
      questions: qList,
      attempts: (attempts ?? []) as Array<{
        question_id: string;
        is_correct: boolean;
        created_at: string;
      }>,
    };
  }

  // 2. Try forward dependents in order of edge weight
  for (const dep of dependents) {
    const { questions, attempts } = await getConceptQuestionsWithAttempts(dep.concept_id);
    if (questions.length === 0) continue;

    const attemptedIds = new Set(attempts.map((a) => a.question_id));
    const unseen = questions.filter((q) => !attemptedIds.has(q.id));

    if (unseen.length > 0) {
      return {
        ...unseen[0],
        isReviewQuestion: true,
        originConceptId: decayedConceptId,
      };
    }

    // If all attempted, check for unmastered (no correct attempt yet)
    const masteredIds = new Set(
      attempts.filter((a) => a.is_correct).map((a) => a.question_id)
    );
    const unmastered = filterUnmasteredQuestions(questions, masteredIds);
    if (unmastered.length > 0) {
      return {
        ...unmastered[0],
        isReviewQuestion: true,
        originConceptId: decayedConceptId,
      };
    }
  }

  // 3. Fall back to decayed concept's own bank
  const own = await getConceptQuestionsWithAttempts(decayedConceptId);
  if (own.questions.length > 0) {
    const ownAttemptedIds = new Set(own.attempts.map((a) => a.question_id));
    const ownUnseen = own.questions.filter((q) => !ownAttemptedIds.has(q.id));

    if (ownUnseen.length > 0) {
      return {
        ...ownUnseen[0],
        isReviewQuestion: true,
        originConceptId: decayedConceptId,
      };
    }

    // Check unmastered
    const ownMasteredIds = new Set(
      own.attempts.filter((a) => a.is_correct).map((a) => a.question_id)
    );
    const ownUnmastered = filterUnmasteredQuestions(own.questions, ownMasteredIds);
    if (ownUnmastered.length > 0) {
      return {
        ...ownUnmastered[0],
        isReviewQuestion: true,
        originConceptId: decayedConceptId,
      };
    }
  }

  // 4. Last resort: select the least-recently-seen question across own bank (or dependents)
  const allCandidates = own.questions;
  if (allCandidates.length === 0) {
    return null;
  }

  // Find latest attempt timestamp for each question
  const lastAttemptMap = new Map<string, number>();
  for (const a of own.attempts) {
    const time = new Date(a.created_at).getTime();
    const existing = lastAttemptMap.get(a.question_id) ?? 0;
    if (time > existing) {
      lastAttemptMap.set(a.question_id, time);
    }
  }

  // Sort ascending by last attempt timestamp (oldest first)
  const sortedByLeastRecent = [...allCandidates].sort((a, b) => {
    const timeA = lastAttemptMap.get(a.id) ?? 0;
    const timeB = lastAttemptMap.get(b.id) ?? 0;
    return timeA - timeB;
  });

  return {
    ...sortedByLeastRecent[0],
    isReviewQuestion: true,
    originConceptId: decayedConceptId,
  };
}
