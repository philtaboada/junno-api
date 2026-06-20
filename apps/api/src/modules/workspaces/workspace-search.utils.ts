export function normalizeWorkspaceSearchQuery(query?: string): string {
  return query?.trim() ?? '';
}

export function isWorkspaceSearchQueryEmpty(query?: string): boolean {
  return normalizeWorkspaceSearchQuery(query).length < 1;
}
