export type DependencyEdge = {
  readonly predecessorTaskId: string;
  readonly successorTaskId: string;
  readonly predecessorCompleted: boolean;
};

export function resolveBlockedTaskIdsFromEdges(
  taskIds: readonly string[],
  edges: readonly DependencyEdge[],
): Set<string> {
  const taskIdSet = new Set(taskIds);
  const blockedTaskIds = new Set<string>();
  for (const edge of edges) {
    if (!taskIdSet.has(edge.successorTaskId)) {
      continue;
    }
    if (!edge.predecessorCompleted) {
      blockedTaskIds.add(edge.successorTaskId);
    }
  }
  return blockedTaskIds;
}

export function wouldCreateDependencyCycle(
  edges: readonly DependencyEdge[],
  predecessorTaskId: string,
  successorTaskId: string,
): boolean {
  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    const next = adjacency.get(edge.predecessorTaskId) ?? [];
    next.push(edge.successorTaskId);
    adjacency.set(edge.predecessorTaskId, next);
  }
  const visited = new Set<string>();
  const stack = [successorTaskId];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }
    if (current === predecessorTaskId) {
      return true;
    }
    if (visited.has(current)) {
      continue;
    }
    visited.add(current);
    for (const next of adjacency.get(current) ?? []) {
      stack.push(next);
    }
  }
  return false;
}
