// Runnable LeetCode-style algorithm examples (Run with: npx tsx src/lib/algorithms/examples.ts)

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

console.log("=== LearnPulse Algorithm Benchmarks ===\n");

// 1. Graph Prerequisite Traversal (BFS & Topological Sort)
console.log("1. Prerequisite Graph (BFS & Topological Sort)");
const edges: ConceptEdge[] = [
  { prerequisite_id: "arrays", concept_id: "linked-lists", weight: 1 },
  { prerequisite_id: "linked-lists", concept_id: "stacks", weight: 1 },
  { prerequisite_id: "stacks", concept_id: "recursion", weight: 2 },
  { prerequisite_id: "arrays", concept_id: "sorting", weight: 1 },
];

const graph = buildAdjacencyList(edges);

const prereqs = bfsPrerequisites("recursion", graph);
console.log("Prerequisites for 'recursion':");
prereqs.forEach((p) => console.log(`  -> [depth ${p.depth}] ${p.id}`));

const allConceptIds = ["arrays", "linked-lists", "stacks", "recursion", "sorting"];
const topoOrder = topologicalSort(allConceptIds, graph);
console.log("Topological Order:", topoOrder?.join(" -> "));

// 2. Forgetting Curve Decay (Ebbinghaus)
console.log("\n2. Forgetting Curve Decay");
const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
const decayResult = calculateRetention(
  {
    masteryScore: 90,
    lastAttemptAt: twoWeeksAgo,
    timesCorrect: 2,
    totalAttempts: 3,
  },
  new Date()
);

console.log(`Original: 90% | Days Inactive: 14 | Retained: ${decayResult.retentionScore.toFixed(1)}% | Due: ${decayResult.isDue}`);

// 3. EWMA Adaptive Mastery
console.log("\n3. EWMA Adaptive Mastery");
let studentScore = 0;
const attempts = [
  { isCorrect: false, difficulty: "medium" as const },
  { isCorrect: true, difficulty: "medium" as const },
  { isCorrect: true, difficulty: "hard" as const },
];

attempts.forEach((att, idx) => {
  studentScore = updateMastery(studentScore, att.isCorrect, att.difficulty);
  console.log(`  Attempt ${idx + 1} (${att.difficulty}, ${att.isCorrect ? "Correct" : "Wrong"}): ${studentScore.toFixed(1)}%`);
});

const batchScore = computeMasteryFromAttempts(attempts);
console.log(`Batch calculated score: ${batchScore.toFixed(1)}%`);

// 4. Learning Risk Assessment
console.log("\n4. Student Risk Indicator");
const atRiskStudent = {
  masteryScore: 35,
  decline: 0.6,
  repeatedErrors: 0.75,
  inactivity: 0.4,
};

const riskResult = computeRisk(atRiskStudent);
console.log(`Risk Score: ${riskResult.score.toFixed(2)} | Status: ${riskResult.bucket}`);

// 5. Root Cause Gap Analysis
console.log("\n5. Root Cause Knowledge Gaps");
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
    masteryScore: 25,
    edgeWeight: 3,
    failedAttempts: 8,
    recency: 0.9,
  },
];

const ranked = rankRootCauses(candidates);
ranked.forEach((r, i) => {
  console.log(`  #${i + 1}: ${r.conceptName} (Score: ${r.rootCauseScore.toFixed(2)}, Mastery: ${r.masteryScore}%)`);
});

console.log("\nAll algorithm examples completed successfully.");
