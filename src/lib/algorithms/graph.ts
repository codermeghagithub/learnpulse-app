/**
 * graph.ts — Prerequisite graph traversal algorithms
 *
 * Uses adjacency list representation from concept_edges table.
 * All operations are O(V+E) with single DB query per call (no N+1).
 */

export interface ConceptEdge {
  prerequisite_id: string;
  concept_id: string;
  weight: number;
}

export interface ConceptNode {
  id: string;
  name: string;
  description?: string | null;
  difficulty: string;
}

export interface AdjacencyList {
  /** concept_id → list of prerequisite concept_ids with weights */
  prerequisites: Map<string, Array<{ id: string; weight: number }>>;
  /** prerequisite_id → list of dependent concept_ids */
  dependents: Map<string, Array<{ id: string; weight: number }>>;
}

export type Graph = AdjacencyList;

/**
 * Build bidirectional adjacency lists from a flat edge list.
 * Call this once per page load using a single DB query.
 */
export function buildAdjacencyList(edges: ConceptEdge[]): AdjacencyList {
  const prerequisites = new Map<string, Array<{ id: string; weight: number }>>();
  const dependents = new Map<string, Array<{ id: string; weight: number }>>();

  for (const edge of edges) {
    // concept_id ← prerequisite_id
    if (!prerequisites.has(edge.concept_id)) {
      prerequisites.set(edge.concept_id, []);
    }
    prerequisites.get(edge.concept_id)!.push({
      id: edge.prerequisite_id,
      weight: edge.weight,
    });

    // prerequisite_id → concept_id
    if (!dependents.has(edge.prerequisite_id)) {
      dependents.set(edge.prerequisite_id, []);
    }
    dependents.get(edge.prerequisite_id)!.push({
      id: edge.concept_id,
      weight: edge.weight,
    });
  }

  return { prerequisites, dependents };
}

export interface PrerequisiteNode {
  id: string;
  weight: number;
  /** Distance from target in hops */
  depth: number;
}

/**
 * BFS backward from a target concept to find all prerequisites transitively.
 * Returns nodes in BFS order (closest prerequisites first).
 */
export function bfsPrerequisites(
  targetConceptId: string,
  adj: AdjacencyList
): PrerequisiteNode[] {
  const visited = new Set<string>();
  const result: PrerequisiteNode[] = [];
  const queue: Array<{ id: string; weight: number; depth: number }> = [];

  // Seed with direct prerequisites of the target
  const directPrereqs = adj.prerequisites.get(targetConceptId) ?? [];
  for (const prereq of directPrereqs) {
    if (!visited.has(prereq.id)) {
      visited.add(prereq.id);
      queue.push({ ...prereq, depth: 1 });
    }
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);

    // BFS further back
    const furtherPrereqs = adj.prerequisites.get(current.id) ?? [];
    for (const prereq of furtherPrereqs) {
      if (!visited.has(prereq.id)) {
        visited.add(prereq.id);
        queue.push({ ...prereq, depth: current.depth + 1 });
      }
    }
  }

  return result;
}

/**
 * Kahn's algorithm topological sort.
 * Returns concept IDs in dependency-first order (prerequisites before dependents).
 * Returns null if a cycle is detected.
 */
export function topologicalSort(
  conceptIds: string[],
  adj: AdjacencyList
): string[] | null {
  const inDegree = new Map<string, number>();
  const conceptSet = new Set(conceptIds);

  // Initialize in-degrees
  for (const id of conceptIds) {
    inDegree.set(id, 0);
  }

  // Count in-degrees (dependents within the set)
  for (const id of conceptIds) {
    const deps = adj.dependents.get(id) ?? [];
    for (const dep of deps) {
      if (conceptSet.has(dep.id)) {
        inDegree.set(dep.id, (inDegree.get(dep.id) ?? 0) + 1);
      }
    }
  }

  // Start with nodes that have no prerequisites (in-degree = 0)
  const queue: string[] = [];
  for (const [id, degree] of inDegree.entries()) {
    if (degree === 0) queue.push(id);
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);

    const deps = adj.dependents.get(current) ?? [];
    for (const dep of deps) {
      if (!conceptSet.has(dep.id)) continue;
      const newDegree = (inDegree.get(dep.id) ?? 0) - 1;
      inDegree.set(dep.id, newDegree);
      if (newDegree === 0) queue.push(dep.id);
    }
  }

  // Cycle detection
  if (sorted.length !== conceptIds.length) return null;
  return sorted;
}

/**
 * Return all direct forward dependents of a concept, sorted by edge weight descending.
 * Reads from the pre-built adj.dependents map — O(1) lookup + O(k log k) sort.
 */
export function getForwardDependents(
  adj: AdjacencyList,
  conceptId: string
): ConceptEdge[] {
  const directDeps = adj.dependents.get(conceptId) ?? [];
  return directDeps
    .map((dep) => ({
      prerequisite_id: conceptId,
      concept_id: dep.id,
      weight: dep.weight,
    }))
    .sort((a, b) => b.weight - a.weight);
}

