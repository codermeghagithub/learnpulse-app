import { describe, it, expect } from "vitest";
import { conceptBiteSchema } from "../schemas";
import { buildDeterministicConceptBiteFallback } from "../gemini";
import { buildConceptBitePrompt } from "../prompts";

describe("Concept Bite Remediation", () => {
  it("validates concept bite schema correctly", () => {
    const valid = {
      conceptName: "B-Tree Indexing",
      intuition: "B-Trees reduce disk lookups from O(N) to O(log N).",
      analogy: "Like a thumb-tabbed dictionary.",
      vernacularAnchor: "याद रखें: Index किताब की सूची जैसा है।",
      quickCheck: {
        question: "Why use B-Trees for database indexing?",
        options: [
          { key: "A" as const, text: "Reduces disk I/O" },
          { key: "B" as const, text: "Uses less CPU" },
        ],
        correctAnswer: "A" as const,
        explanation: "Node size matches disk block size.",
      },
    };

    const parsed = conceptBiteSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it("builds deterministic fallbacks adhering strictly to conceptBiteSchema", () => {
    const topics = [
      "B-Tree Indexing",
      "Deadlock Prevention",
      "CPU Scheduling",
      "Database Normalization",
      "Graph Depth-First Search",
    ];

    for (const topic of topics) {
      const fallback = buildDeterministicConceptBiteFallback(topic);
      const parsed = conceptBiteSchema.safeParse(fallback);
      expect(parsed.success, `Fallback for "${topic}" failed schema validation`).toBe(true);
      expect(fallback.quickCheck.options.length).toBeGreaterThanOrEqual(2);
      expect(["A", "B", "C", "D"]).toContain(fallback.quickCheck.correctAnswer);
      expect(fallback.vernacularAnchor).toBeDefined();
    }
  });

  it("generates structured prompt with concept name and description", () => {
    const prompt = buildConceptBitePrompt("TCP Congestion Control", "Sliding window rate limit");
    expect(prompt).toContain("TCP Congestion Control");
    expect(prompt).toContain("Sliding window rate limit");
    expect(prompt).toContain("60-Second Concept Bite");
    expect(prompt).toContain("vernacularAnchor");
    expect(prompt).toContain("challengePool");
  });

  it("provides clean English anchor under EN and Hindi anchor under HI", () => {
    const fallback = buildDeterministicConceptBiteFallback("Routing Algorithms");
    expect(fallback.anchorEn).toBeDefined();
    expect(fallback.anchorEn).toMatch(/^Remember:/i);
    expect(fallback.anchorHi).toBeDefined();
    expect(fallback.anchorHi).toMatch(/^याद रखें:/);
    expect(fallback.en).toBeDefined();
    expect(fallback.en?.anchor).toMatch(/^Remember:/i);
    expect(fallback.hi).toBeDefined();
    expect(fallback.hi?.anchor).toMatch(/^याद रखें:/);
  });

  it("supports challenge pools with multiple tricky real-world scenarios", () => {
    const routingBite = buildDeterministicConceptBiteFallback("Routing Algorithms");
    expect(routingBite.challengePool).toBeDefined();
    expect(routingBite.challengePool!.length).toBeGreaterThanOrEqual(3);

    // Verify questions change when different indices are requested
    const q0 = buildDeterministicConceptBiteFallback("Routing Algorithms", undefined, 0);
    const q1 = buildDeterministicConceptBiteFallback("Routing Algorithms", undefined, 1);
    expect(q0.quickCheck.question).not.toEqual(q1.quickCheck.question);

    // Verify both EN and HI versions are present in the challenge pool
    routingBite.challengePool!.forEach((challenge) => {
      expect(challenge.en.question).toBeTruthy();
      expect(challenge.hi.question).toBeTruthy();
      expect(challenge.en.options.length).toBeGreaterThanOrEqual(3);
      expect(challenge.hi.options.length).toBeGreaterThanOrEqual(3);
      expect(challenge.en.correctAnswer).toEqual(challenge.hi.correctAnswer);
    });
  });
});
