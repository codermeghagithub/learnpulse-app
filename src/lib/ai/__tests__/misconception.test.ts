import { describe, it, expect } from "vitest";
import { buildMisconceptionPrompt } from "../prompts";
import { misconceptionOutputSchema } from "../schemas";

describe("Mental Mirror AI Misconception Engine", () => {
  it("builds a precise diagnostic prompt", () => {
    const prompt = buildMisconceptionPrompt({
      questionText: "What is the primary output of the Lexical Analysis phase?",
      selectedOptionText: "A Parse Tree",
      correctOptionText: "A stream of Tokens",
      conceptName: "Lexical Analysis",
    });

    expect(prompt).toContain("Lexical Analysis");
    expect(prompt).toContain("A Parse Tree");
    expect(prompt).toContain("A stream of Tokens");
    expect(prompt).toContain("thoughtTrap");
    expect(prompt).toContain("mentalAnchor");
  });

  it("validates valid misconception outputs", () => {
    const valid = {
      thoughtTrap: "You likely selected Parse Tree because both are early compiler phases.",
      mentalAnchor: "Lexical = Tokens (words), Syntax = Parse Tree (grammar structure).",
    };

    const parsed = misconceptionOutputSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid misconception outputs", () => {
    const invalid = {
      thoughtTrap: "",
    };

    const parsed = misconceptionOutputSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });
});
