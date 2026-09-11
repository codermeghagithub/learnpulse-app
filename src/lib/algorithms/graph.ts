// Prerequisite graph traversal algorithms (BFS, Topological Sort, and adjacency builders)

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
  prerequisites: Map<string, Array<{ id: string; weight: number }>>;
  dependents: Map<string, Array<{ id: string; weight: number }>>;
}

export type Graph = AdjacencyList;

// Builds bidirectional adjacency maps from flat concept edges
export function buildAdjacencyList(edges: ConceptEdge[]): AdjacencyList {
  const prerequisites = new Map<string, Array<{ id: string; weight: number }>>();
  const dependents = new Map<string, Array<{ id: string; weight: number }>>();

  for (const edge of edges) {
    if (!prerequisites.has(edge.concept_id)) {
      prerequisites.set(edge.concept_id, []);
    }
    prerequisites.get(edge.concept_id)!.push({
      id: edge.prerequisite_id,
      weight: edge.weight,
    });

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
  depth: number;
}

// BFS traversal to retrieve all transitive prerequisites in hop order
export function bfsPrerequisites(
  targetConceptId: string,
  adj: AdjacencyList
): PrerequisiteNode[] {
  const visited = new Set<string>();
  const result: PrerequisiteNode[] = [];
  const queue: Array<{ id: string; weight: number; depth: number }> = [];

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

// Kahn's algorithm for topological ordering and cycle detection
export function topologicalSort(
  conceptIds: string[],
  adj: AdjacencyList
): string[] | null {
  const inDegree = new Map<string, number>();
  const conceptSet = new Set(conceptIds);

  for (const id of conceptIds) {
    inDegree.set(id, 0);
  }

  for (const id of conceptIds) {
    const deps = adj.dependents.get(id) ?? [];
    for (const dep of deps) {
      if (conceptSet.has(dep.id)) {
        inDegree.set(dep.id, (inDegree.get(dep.id) ?? 0) + 1);
      }
    }
  }

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

  if (sorted.length !== conceptIds.length) return null;
  return sorted;
}

// Returns direct dependent concepts sorted by edge weight
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
