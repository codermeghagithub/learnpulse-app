import { describe, it, expect } from "vitest";
import { selectReviewQuestion } from "../reviewSelection";
import { buildAdjacencyList, type ConceptEdge } from "../graph";

describe("selectReviewQuestion", () => {
  const STUDENT_ID = "student-1";
  const DECAYED_ID = "arrays";

  function createMockSupabase(db: {
    questionsByConcept: Record<string, any[]>;
    attemptsByUser: Record<string, any[]>;
  }) {
    return {
      from: (table: string) => {
        if (table === "questions") {
          return {
            select: () => ({
              eq: async (_col: string, val: string) => ({
                data: db.questionsByConcept[val] ?? [],
                error: null,
              }),
            }),
          };
        }

        if (table === "attempts") {
          return {
            select: () => ({
              eq: (_col: string, userId: string) => ({
                in: async (_col2: string, qIds: string[]) => {
                  const userAttempts = db.attemptsByUser[userId] ?? [];
                  const filtered = userAttempts.filter((a) => qIds.includes(a.question_id));
                  return { data: filtered, error: null };
                },
              }),
            }),
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      },
    };
  }

  it("selects unseen question from highest-weight forward dependent first", async () => {
    // Arrays -> LinkedLists (weight 3), Arrays -> Sorting (weight 1)
    const edges: ConceptEdge[] = [
      { prerequisite_id: "arrays", concept_id: "linked-lists", weight: 3 },
      { prerequisite_id: "arrays", concept_id: "sorting", weight: 1 },
    ];
    const graph = buildAdjacencyList(edges);

    const questionsByConcept = {
      arrays: [
        { id: "q-arr-1", concept_id: "arrays", question_text: "Array Q1", options: [], difficulty: "easy" },
      ],
      "linked-lists": [
        { id: "q-ll-1", concept_id: "linked-lists", question_text: "LL Q1", options: [], difficulty: "medium" },
      ],
      sorting: [
        { id: "q-sort-1", concept_id: "sorting", question_text: "Sort Q1", options: [], difficulty: "medium" },
      ],
    };

    const mockClient = createMockSupabase({
      questionsByConcept,
      attemptsByUser: { [STUDENT_ID]: [] }, // no attempts yet
    });

    const result = await selectReviewQuestion(
      { studentId: STUDENT_ID, decayedConceptId: DECAYED_ID, graph },
      mockClient
    );

    expect(result).not.toBeNull();
    // Highest-weight dependent is linked-lists
    expect(result?.id).toBe("q-ll-1");
    expect(result?.isReviewQuestion).toBe(true);
    expect(result?.originConceptId).toBe("arrays");
  });

  it("falls back to decayed concept's own bank when forward dependent has no unseen questions", async () => {
    const edges: ConceptEdge[] = [
      { prerequisite_id: "arrays", concept_id: "linked-lists", weight: 3 },
    ];
    const graph = buildAdjacencyList(edges);

    const questionsByConcept = {
      arrays: [
        { id: "q-arr-1", concept_id: "arrays", question_text: "Array Q1", options: [], difficulty: "easy" },
        { id: "q-arr-2", concept_id: "arrays", question_text: "Array Q2", options: [], difficulty: "medium" },
      ],
      "linked-lists": [
        { id: "q-ll-1", concept_id: "linked-lists", question_text: "LL Q1", options: [], difficulty: "medium" },
      ],
    };

    // Student already mastered q-ll-1 and q-arr-1
    const attemptsByUser = {
      [STUDENT_ID]: [
        { question_id: "q-ll-1", is_correct: true, created_at: "2026-09-01T10:00:00Z" },
        { question_id: "q-arr-1", is_correct: true, created_at: "2026-09-02T10:00:00Z" },
      ],
    };

    const mockClient = createMockSupabase({
      questionsByConcept,
      attemptsByUser,
    });

    const result = await selectReviewQuestion(
      { studentId: STUDENT_ID, decayedConceptId: DECAYED_ID, graph },
      mockClient
    );

    expect(result).not.toBeNull();
    // q-ll-1 is mastered, q-arr-1 is mastered -> picks q-arr-2 (unseen in own bank)
    expect(result?.id).toBe("q-arr-2");
    expect(result?.isReviewQuestion).toBe(true);
    expect(result?.originConceptId).toBe("arrays");
  });

  it("falls back to decayed concept's own bank for a leaf node (no dependents)", async () => {
    // arrays is a leaf node in an empty graph
    const graph = buildAdjacencyList([]);

    const questionsByConcept = {
      arrays: [
        { id: "q-arr-1", concept_id: "arrays", question_text: "Array Q1", options: [], difficulty: "easy" },
      ],
    };

    const mockClient = createMockSupabase({
      questionsByConcept,
      attemptsByUser: { [STUDENT_ID]: [] },
    });

    const result = await selectReviewQuestion(
      { studentId: STUDENT_ID, decayedConceptId: DECAYED_ID, graph },
      mockClient
    );

    expect(result).not.toBeNull();
    expect(result?.id).toBe("q-arr-1");
    expect(result?.isReviewQuestion).toBe(true);
    expect(result?.originConceptId).toBe("arrays");
  });

  it("selects the least recently attempted question when all questions have been attempted", async () => {
    const graph = buildAdjacencyList([]);

    const questionsByConcept = {
      arrays: [
        { id: "q-arr-recent", concept_id: "arrays", question_text: "Recent", options: [], difficulty: "easy" },
        { id: "q-arr-oldest", concept_id: "arrays", question_text: "Oldest", options: [], difficulty: "easy" },
      ],
    };

    const attemptsByUser = {
      [STUDENT_ID]: [
        { question_id: "q-arr-recent", is_correct: true, created_at: "2026-09-08T10:00:00Z" },
        { question_id: "q-arr-oldest", is_correct: true, created_at: "2026-08-01T10:00:00Z" },
      ],
    };

    const mockClient = createMockSupabase({
      questionsByConcept,
      attemptsByUser,
    });

    const result = await selectReviewQuestion(
      { studentId: STUDENT_ID, decayedConceptId: DECAYED_ID, graph },
      mockClient
    );

    expect(result).not.toBeNull();
    // q-arr-oldest was attempted on 2026-08-01, far earlier than 2026-09-08
    expect(result?.id).toBe("q-arr-oldest");
    expect(result?.isReviewQuestion).toBe(true);
  });

  it("returns null if no questions exist in dependent or own bank", async () => {
    const graph = buildAdjacencyList([]);
    const mockClient = createMockSupabase({
      questionsByConcept: {},
      attemptsByUser: {},
    });

    const result = await selectReviewQuestion(
      { studentId: STUDENT_ID, decayedConceptId: DECAYED_ID, graph },
      mockClient
    );

    expect(result).toBeNull();
  });
});
