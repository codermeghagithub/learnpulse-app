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
    expect(prompt).toContain("cognitiveDissonance");
  });

  it("builds a prompt that includes student reasoning when provided", () => {
    const prompt = buildMisconceptionPrompt({
      questionText: "What is the primary output of the Lexical Analysis phase?",
      selectedOptionText: "A Parse Tree",
      correctOptionText: "A stream of Tokens",
      conceptName: "Lexical Analysis",
      studentReasoning: "I thought parse trees come first because they define syntax.",
    });

    expect(prompt).toContain("I thought parse trees come first");
  });

  it("validates valid misconception outputs including cognitiveDissonance", () => {
    const valid = {
      thoughtTrap: "You likely selected Parse Tree because both are early compiler phases.",
      mentalAnchor: "Lexical = Tokens (words), Syntax = Parse Tree (grammar structure).",
      cognitiveDissonance: {
        paradoxScenario:
          "Imagine passing the raw source file straight to a parser that expects tokens. The parser has no alphabet to work with — it would be trying to derive grammar rules from raw characters rather than classified lexemes.",
        counterQuestion:
          "If Lexical Analysis produced a Parse Tree directly, what role would the Syntax Analysis phase have left to perform?",
      },
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

  it("validates full bilingual outputs with en and hi sections", () => {
    const bilingualOutput = {
      thoughtTrap: "You likely selected this because...",
      mentalAnchor: "Rule of thumb: X does A, while Y does B.",
      vernacularAnchor: "याद रखें: X A करता है, जबकि Y B संभालता है।",
      cognitiveDissonance: {
        paradoxScenario: "Imagine you apply your assumption here...",
        counterQuestion: "If your assumption held, what would happen?",
      },
      en: {
        thoughtTrap: "You likely selected this because...",
        mentalAnchor: "Rule of thumb: X does A, while Y does B.",
        cognitiveDissonance: {
          paradoxScenario: "Imagine you apply your assumption here...",
          counterQuestion: "If your assumption held, what would happen?",
        },
      },
      hi: {
        thoughtTrap: "आपने संभवतः यह विकल्प इसलिए चुना क्योंकि...",
        mentalAnchor: "याद रखें: X A करता है, जबकि Y B संभालता है।",
        cognitiveDissonance: {
          paradoxScenario: "कल्पना करें कि यदि आप अपने अनुमान को यहाँ लागू करते हैं...",
          counterQuestion: "यदि आपकी धारणा सही होती, तो क्या होता?",
        },
      },
    };

    const parsed = misconceptionOutputSchema.safeParse(bilingualOutput);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.en?.thoughtTrap).toBe("You likely selected this because...");
      expect(parsed.data.hi?.thoughtTrap).toContain("आपने संभवतः");
      expect(parsed.data.hi?.mentalAnchor).toContain("याद रखें");
    }
  });
});
