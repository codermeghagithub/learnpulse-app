import { describe, it, expect } from "vitest";
import {
  buildAdjacencyList,
  bfsPrerequisites,
  topologicalSort,
  getForwardDependents,
  type ConceptEdge,
} from "../graph";

// Test graph: Arrays → LinkedLists → Stacks → Recursion
//             Arrays → Sorting
const edges: ConceptEdge[] = [
  { prerequisite_id: "arrays", concept_id: "linked-lists", weight: 1 },
  { prerequisite_id: "linked-lists", concept_id: "stacks", weight: 1 },
  { prerequisite_id: "stacks", concept_id: "recursion", weight: 2 },
  { prerequisite_id: "arrays", concept_id: "sorting", weight: 1 },
];

describe("buildAdjacencyList", () => {
  it("builds prerequisites map correctly", () => {
    const adj = buildAdjacencyList(edges);
    const prereqsOfStacks = adj.prerequisites.get("stacks");
    expect(prereqsOfStacks).toBeDefined();
    expect(prereqsOfStacks!.map((p) => p.id)).toContain("linked-lists");
  });

  it("builds dependents map correctly", () => {
    const adj = buildAdjacencyList(edges);
    const depsOfArrays = adj.dependents.get("arrays");
    expect(depsOfArrays).toBeDefined();
    expect(depsOfArrays!.map((d) => d.id)).toContain("linked-lists");
    expect(depsOfArrays!.map((d) => d.id)).toContain("sorting");
  });

  it("handles empty edge list", () => {
    const adj = buildAdjacencyList([]);
    expect(adj.prerequisites.size).toBe(0);
    expect(adj.dependents.size).toBe(0);
  });
});

describe("bfsPrerequisites", () => {
  it("finds direct prerequisites", () => {
    const adj = buildAdjacencyList(edges);
    const prereqs = bfsPrerequisites("stacks", adj);
    expect(prereqs.map((p) => p.id)).toContain("linked-lists");
  });

  it("finds transitive prerequisites", () => {
    const adj = buildAdjacencyList(edges);
    const prereqs = bfsPrerequisites("recursion", adj);
    const ids = prereqs.map((p) => p.id);
    expect(ids).toContain("stacks");
    expect(ids).toContain("linked-lists");
    expect(ids).toContain("arrays");
  });

  it("returns depth correctly", () => {
    const adj = buildAdjacencyList(edges);
    const prereqs = bfsPrerequisites("recursion", adj);
    const stacks = prereqs.find((p) => p.id === "stacks");
    const arrays = prereqs.find((p) => p.id === "arrays");
    expect(stacks?.depth).toBe(1);
    expect(arrays?.depth).toBeGreaterThan(1);
  });

  it("returns empty for concept with no prerequisites", () => {
    const adj = buildAdjacencyList(edges);
    const prereqs = bfsPrerequisites("arrays", adj);
    expect(prereqs).toHaveLength(0);
  });

  it("does not revisit nodes (no duplicates)", () => {
    const adj = buildAdjacencyList(edges);
    const prereqs = bfsPrerequisites("recursion", adj);
    const ids = prereqs.map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });
});

describe("topologicalSort", () => {
  it("orders prerequisites before dependents", () => {
    const adj = buildAdjacencyList(edges);
    const sorted = topologicalSort(
      ["recursion", "stacks", "linked-lists", "arrays", "sorting"],
      adj
    );
    expect(sorted).not.toBeNull();
    const arraysIdx = sorted!.indexOf("arrays");
    const linkedListsIdx = sorted!.indexOf("linked-lists");
    const stacksIdx = sorted!.indexOf("stacks");
    const recursionIdx = sorted!.indexOf("recursion");
    expect(arraysIdx).toBeLessThan(linkedListsIdx);
    expect(linkedListsIdx).toBeLessThan(stacksIdx);
    expect(stacksIdx).toBeLessThan(recursionIdx);
  });

  it("detects cycles", () => {
    const cyclicEdges: ConceptEdge[] = [
      { prerequisite_id: "a", concept_id: "b", weight: 1 },
      { prerequisite_id: "b", concept_id: "a", weight: 1 },
    ];
    const adj = buildAdjacencyList(cyclicEdges);
    const sorted = topologicalSort(["a", "b"], adj);
    expect(sorted).toBeNull();
  });

  it("detects 3-node circular dependency (A -> B -> C -> A)", () => {
    const cyclicEdges: ConceptEdge[] = [
      { prerequisite_id: "a", concept_id: "b", weight: 1 },
      { prerequisite_id: "b", concept_id: "c", weight: 1 },
      { prerequisite_id: "c", concept_id: "a", weight: 1 },
    ];
    const adj = buildAdjacencyList(cyclicEdges);
    const sorted = topologicalSort(["a", "b", "c"], adj);
    expect(sorted).toBeNull();
  });

  it("detects self-loop cycle (A -> A)", () => {
    const selfLoop: ConceptEdge[] = [
      { prerequisite_id: "a", concept_id: "a", weight: 1 },
    ];
    const adj = buildAdjacencyList(selfLoop);
    const sorted = topologicalSort(["a"], adj);
    expect(sorted).toBeNull();
  });
});

describe("getForwardDependents", () => {
  it("returns direct dependents sorted by weight descending", () => {
    const testEdges: ConceptEdge[] = [
      { prerequisite_id: "c1", concept_id: "c2", weight: 1 },
      { prerequisite_id: "c1", concept_id: "c3", weight: 5 },
      { prerequisite_id: "c1", concept_id: "c4", weight: 3 },
    ];
    const adj = buildAdjacencyList(testEdges);
    const deps = getForwardDependents(adj, "c1");

    expect(deps).toHaveLength(3);
    expect(deps[0]).toEqual({ prerequisite_id: "c1", concept_id: "c3", weight: 5 });
    expect(deps[1]).toEqual({ prerequisite_id: "c1", concept_id: "c4", weight: 3 });
    expect(deps[2]).toEqual({ prerequisite_id: "c1", concept_id: "c2", weight: 1 });
  });

  it("returns empty array for a leaf concept with no dependents", () => {
    const adj = buildAdjacencyList(edges);
    const deps = getForwardDependents(adj, "recursion");
    expect(deps).toEqual([]);
  });

  it("returns empty array for an unknown concept not in the graph", () => {
    const adj = buildAdjacencyList(edges);
    const deps = getForwardDependents(adj, "non-existent-concept");
    expect(deps).toEqual([]);
  });
});

