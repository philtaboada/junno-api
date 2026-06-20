import type { WorkspaceRole } from './auth.types';

export interface WorkspaceMemberDto {
  readonly userId: string;
  readonly name: string;
  readonly email: string;
  readonly role: WorkspaceRole;
}

export interface WorkspaceTeamGroupDto {
  readonly id: string;
  readonly name: string;
  readonly memberCount: number;
}

export interface WorkspaceMembersSearchResponseDto {
  readonly members: WorkspaceMemberDto[];
  readonly teams: WorkspaceTeamGroupDto[];
}
