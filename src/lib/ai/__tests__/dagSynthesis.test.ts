import { describe, it, expect } from "vitest";
import { buildDagSynthesisPrompt } from "../prompts";
import { dagSynthesisOutputSchema } from "../schemas";
import { buildDeterministicDagFallback } from "../gemini";
import { buildAdjacencyList, topologicalSort } from "@/lib/algorithms/graph";

describe("DAG Course Synthesizer Engine", () => {
  it("builds a prompt requiring formal academic course names", () => {
    const prompt = buildDagSynthesisPrompt("Informed Search, Minimax, Logic", "Artificial Intelligence");
    expect(prompt).toContain("Artificial Intelligence");
    expect(prompt).toContain("ACADEMIC COURSE / SUBJECT NAME");
    expect(prompt).toContain("NEVER use a narrow concept");
  });

  it("builds prompt without explicit title with strong course-level guidance", () => {
    const prompt = buildDagSynthesisPrompt("Apriori algorithm, OLAP cubes, data cleaning");
    expect(prompt).toContain("Data Mining and Warehousing");
    expect(prompt).toContain("overarching academic course/subject name");
  });

  it("validates realistic DAG synthesis output via schema", () => {
    const validOutput = {
      courseTitle: "Artificial Intelligence",
      courseSubject: "Computer Science",
      concepts: [
        { name: "State Space Search", description: "Search spaces and uninformed/informed search algorithms.", difficulty: "easy" },
        { name: "Adversarial Search & Games", description: "Minimax evaluation and alpha-beta pruning techniques.", difficulty: "medium" },
        { name: "Logic & Automated Reasoning", description: "Propositional and first-order predicate logic representation.", difficulty: "hard" },
      ],
      edges: [
        { prerequisiteName: "State Space Search", conceptName: "Adversarial Search & Games", weight: 1.0 },
      ],
    };

    const parsed = dagSynthesisOutputSchema.safeParse(validOutput);
    expect(parsed.success).toBe(true);
  });

  it("fallback generates formal course title 'Artificial Intelligence' for AI topic text", () => {
    const fallback = buildDeterministicDagFallback("State Space Search, Heuristics, Minimax");
    expect(fallback.courseTitle).toBe("Artificial Intelligence");
    expect(fallback.concepts.length).toBeGreaterThanOrEqual(4);

    // Verify it is a valid DAG (no cycles)
    const nameToId = new Map<string, string>();
    fallback.concepts.forEach((c, i) => nameToId.set(c.name, `c_${i}`));
    const edges = fallback.edges.map((e) => ({
      prerequisite_id: nameToId.get(e.prerequisiteName)!,
      concept_id: nameToId.get(e.conceptName)!,
      weight: e.weight,
    }));
    const adj = buildAdjacencyList(edges);
    const order = topologicalSort(Array.from(nameToId.values()), adj);
    expect(order).not.toBeNull();
  });

  it("fallback generates formal course title 'Data Mining and Warehousing' for DM topic text", () => {
    const fallback = buildDeterministicDagFallback("Data warehousing, OLAP, Apriori");
    expect(fallback.courseTitle).toBe("Data Mining and Warehousing");
    expect(fallback.concepts.some((c) => c.name.includes("OLAP") || c.name.includes("Mining"))).toBe(true);
  });

  it("fallback honors explicit course title when provided", () => {
    const fallback = buildDeterministicDagFallback("some content", "Cloud Computing Architecture");
    expect(fallback.courseTitle).toBe("Cloud Computing Architecture");
  });

  it("generates 4 to 5 practice MCQs per concept ranked easy to hard in DAG synthesis", () => {
    const fallback = buildDeterministicDagFallback("State Space Search, Heuristics", "Artificial Intelligence");
    expect(fallback.questions).toBeDefined();
    // 4 concepts * 4 questions each = 16 questions
    expect(fallback.questions!.length).toBe(fallback.concepts.length * 4);

    for (const concept of fallback.concepts) {
      const conceptQuestions = fallback.questions!.filter((q) => q.conceptName === concept.name);
      expect(conceptQuestions.length).toBeGreaterThanOrEqual(4);
      expect(conceptQuestions.length).toBeLessThanOrEqual(5);

      // Verify difficulties are ranked from easy to hard
      const difficulties = conceptQuestions.map((q) => q.difficulty);
      expect(difficulties[0]).toBe("easy");
      expect(difficulties[difficulties.length - 1]).toBe("hard");

      for (const q of conceptQuestions) {
        expect(q.options).toHaveLength(4);
        expect(["A", "B", "C", "D"]).toContain(q.correctAnswer);
        expect(q.explanation.length).toBeGreaterThan(10);
      }
    }
  });
});
