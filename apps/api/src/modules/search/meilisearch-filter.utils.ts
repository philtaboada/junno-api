export function buildWorkspaceFilter(workspaceId: string): string {
  return `workspaceId = "${workspaceId}"`;
}

export function buildProjectIdsInFilter(
  attribute: string,
  projectIds: readonly string[],
): string {
  if (projectIds.length === 0) {
    return `${attribute} IN [""]`;
  }
  const quotedIds = projectIds.map((projectId) => `"${projectId}"`).join(', ');
  return `${attribute} IN [${quotedIds}]`;
}

export function buildWorkspaceSearchFilter(
  workspaceId: string,
  projectIds: readonly string[],
  projectIdsAttribute: string,
): string {
  return `${buildWorkspaceFilter(workspaceId)} AND ${buildProjectIdsInFilter(projectIdsAttribute, projectIds)}`;
}
