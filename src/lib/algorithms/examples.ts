/**
 * examples.ts — LeetCode-Style Runnable Examples for LearnPulse Algorithms
 *
 * This file demonstrates each core algorithm with concrete sample inputs
 * and expected outputs, just like LeetCode problem test benches.
 *
 * Zero external test framework required.
 * Run directly with: npx tsx src/lib/algorithms/examples.ts
 */

import {
  buildAdjacencyList,
  bfsPrerequisites,
  topologicalSort,
  type ConceptEdge,
} from "./graph";
import { calculateRetention } from "./decay";
import { updateMastery, computeMasteryFromAttempts } from "./mastery";
import { computeRisk } from "./risk";
import { rankRootCauses, type RootCauseCandidate } from "./rootCause";

console.log("=================================================");
console.log("   LearnPulse DSA & Adaptive Learning Algorithms  ");
console.log("=================================================\n");

// ─────────────────────────────────────────────────────────
// 1. Graph Prerequisite Traversal (BFS & Topological Sort)
// LeetCode Equivalent: Course Schedule I & II (Problems 207 & 210)
// ─────────────────────────────────────────────────────────
console.log("--- 1. Prerequisite Graph Algorithms (BFS & Topological Sort) ---");

// Example DAG:
// Arrays (root) ──> LinkedLists ──> Stacks ──> Recursion
// Arrays (root) ──> Sorting
const edges: ConceptEdge[] = [
  { prerequisite_id: "arrays", concept_id: "linked-lists", weight: 1 },
  { prerequisite_id: "linked-lists", concept_id: "stacks", weight: 1 },
  { prerequisite_id: "stacks", concept_id: "recursion", weight: 2 },
  { prerequisite_id: "arrays", concept_id: "sorting", weight: 1 },
];

const graph = buildAdjacencyList(edges);

// Example 1: Find all prerequisites of "recursion"
const prereqs = bfsPrerequisites("recursion", graph);
console.log("Prerequisites for 'recursion':");
prereqs.forEach((p) => console.log(`  -> [depth ${p.depth}] ${p.id}`));
// Expected: stacks (depth 1), linked-lists (depth 2), arrays (depth 3)

// Example 2: Topological Course Order
const allConceptIds = ["arrays", "linked-lists", "stacks", "recursion", "sorting"];
const topoOrder = topologicalSort(allConceptIds, graph);
console.log("\nTopological Learning Order:");
console.log(" ", topoOrder?.join(" -> "));
// Expected: Valid topological ordering starting with "arrays"


// ─────────────────────────────────────────────────────────
// 2. Forgetting Curve (Ebbinghaus Exponential Decay)
// ─────────────────────────────────────────────────────────
console.log("\n--- 2. Ebbinghaus Forgetting Curve Decay ---");

// Example: Student mastered a concept (score: 90) but hasn't practiced in 14 days
const lastWeek = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
const decayResult = calculateRetention(
  {
    masteryScore: 90,
    lastAttemptAt: lastWeek,
    timesCorrect: 2,
    totalAttempts: 3,
  },
  new Date()
);

console.log(`Original Mastery: 90% | Days Inactive: 14`);
console.log(`Retained Mastery: ${decayResult.retentionScore}%`);
console.log(`Review Due:       ${decayResult.isDue ? "YES ⏳" : "NO ✅"}`);


// ─────────────────────────────────────────────────────────
// 3. EWMA Adaptive Mastery Score (Exponential Moving Average)
// ─────────────────────────────────────────────────────────
console.log("\n--- 3. EWMA Adaptive Mastery Calculation ---");

// Example: Student answers 3 questions sequentially: 1 wrong, 2 correct
let studentScore = 0;
const attempts = [
  { isCorrect: false, difficulty: "medium" as const },
  { isCorrect: true, difficulty: "medium" as const },
  { isCorrect: true, difficulty: "hard" as const },
];

attempts.forEach((att, idx) => {
  studentScore = updateMastery(studentScore, att.isCorrect, att.difficulty);
  console.log(
    `Attempt ${idx + 1} (${att.difficulty}, ${att.isCorrect ? "Correct" : "Wrong"}): Score = ${studentScore.toFixed(1)}%`
  );
});

const batchScore = computeMasteryFromAttempts(attempts);
console.log(`Final Calculated Score: ${batchScore.toFixed(1)}%`);


// ─────────────────────────────────────────────────────────
// 4. Learning Risk Assessment
// ─────────────────────────────────────────────────────────
console.log("\n--- 4. Student Academic Risk Indicator ---");

// Example: Student struggling with low mastery, score decline, and repeated errors
const atRiskStudent = {
  masteryScore: 35,
  decline: 0.6,
  repeatedErrors: 0.75,
  inactivity: 0.4,
};

const riskResult = computeRisk(atRiskStudent);
console.log(`Risk Score:  ${riskResult.score.toFixed(2)} (0.00 to 1.00)`);
console.log(`Risk Status: ${riskResult.bucket}`);


// ─────────────────────────────────────────────────────────
// 5. Root Cause Gap Analysis
// ─────────────────────────────────────────────────────────
console.log("\n--- 5. Root-Cause Knowledge Gap Analysis ---");

// Example: Finding why student struggled on Trees
const candidates: RootCauseCandidate[] = [
  {
    conceptId: "c-arrays",
    conceptName: "Array Indexing",
    masteryScore: 85,
    edgeWeight: 1,
    failedAttempts: 1,
    recency: 0.1,
  },
  {
    conceptId: "c-recursion",
    conceptName: "Recursion & Call Stack",
    masteryScore: 25, // Weak mastery
    edgeWeight: 3,    // High dependency weight
    failedAttempts: 8, // Multiple failures
    recency: 0.9,    // Recent failures
  },
];

const ranked = rankRootCauses(candidates);
console.log("Ranked Root Cause Bottlenecks:");
ranked.forEach((r, i) => {
  console.log(
    `  #${i + 1}: ${r.conceptName} (Score: ${r.rootCauseScore.toFixed(2)}, Mastery: ${r.masteryScore}%)`
  );
});

console.log("\n=================================================");
console.log("   All LeetCode Example Test Cases Completed!    ");
console.log("=================================================");
