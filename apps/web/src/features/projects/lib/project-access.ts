import type { ProjectAccessRole, ProjectDetailDto } from '@pm/contracts';

export function getProjectMemberRole(
  project: ProjectDetailDto,
  userId: string | undefined,
): ProjectAccessRole | null {
  if (!userId) {
    return null;
  }
  const member = project.members.find((item) => item.userId === userId);
  return member?.role ?? null;
}

export function canEditProject(
  project: ProjectDetailDto,
  userId: string | undefined,
): boolean {
  return getProjectMemberRole(project, userId) === 'admin';
}

export function canEditSections(
  project: ProjectDetailDto,
  userId: string | undefined,
): boolean {
  const role = getProjectMemberRole(project, userId);
  return role === 'admin' || role === 'editor';
}

export function canCommentOnProject(
  project: ProjectDetailDto,
  userId: string | undefined,
): boolean {
  const role = getProjectMemberRole(project, userId);
  return role === 'admin' || role === 'editor' || role === 'commenter';
}

export function isProjectViewer(
  project: ProjectDetailDto,
  userId: string | undefined,
): boolean {
  return getProjectMemberRole(project, userId) === 'viewer';
}
