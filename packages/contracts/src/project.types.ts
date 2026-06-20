export type ProjectAccessRole = 'admin' | 'editor' | 'commenter' | 'viewer';

export type ProjectStatus = 'active' | 'archived';

export type ProjectColor =
  | 'coral'
  | 'indigo'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'sky'
  | 'slate'
  | 'violet';

export type ProjectListFieldKey = 'name' | 'due_at' | 'assignee';

export interface ProjectListColumnDto {
  readonly id: string;
  readonly fieldKey: ProjectListFieldKey | null;
  readonly customFieldId: string | null;
  readonly position: number;
  readonly visible: boolean;
  readonly width: number | null;
}

export interface ProjectSectionDto {
  readonly id: string;
  readonly name: string;
  readonly position: number;
  readonly createdAt: string;
}

export interface ProjectMemberDto {
  readonly userId: string;
  readonly name: string;
  readonly email: string;
  readonly role: ProjectAccessRole;
  readonly isOwner: boolean;
  readonly joinedAt: string;
}

export interface ProjectSummaryDto {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly color: ProjectColor | null;
  readonly status: ProjectStatus;
  readonly teamId: string;
  readonly teamName: string;
  readonly memberCount: number;
  readonly sectionCount: number;
  readonly createdAt: string;
}

import type { CustomFieldDefinitionDto } from './custom-field.types';

export interface ProjectDetailDto extends ProjectSummaryDto {
  readonly sections: ProjectSectionDto[];
  readonly members: ProjectMemberDto[];
  readonly listColumns: ProjectListColumnDto[];
  readonly customFields: CustomFieldDefinitionDto[];
}

export interface CreateProjectRequestDto {
  readonly name: string;
  readonly teamId: string;
  readonly description?: string;
  readonly color?: ProjectColor;
}

export interface UpdateProjectRequestDto {
  readonly name?: string;
  readonly description?: string | null;
  readonly color?: ProjectColor | null;
  readonly teamId?: string;
  readonly status?: ProjectStatus;
}

export interface CreateSectionRequestDto {
  readonly name: string;
  readonly position?: number;
}

export interface UpdateSectionRequestDto {
  readonly name?: string;
}

export interface SectionPositionUpdateDto {
  readonly sectionId: string;
  readonly position: number;
}

export interface ReorderSectionsRequestDto {
  readonly sections: SectionPositionUpdateDto[];
}

export interface ListColumnUpdateRequestDto {
  readonly fieldKey?: ProjectListFieldKey | null;
  readonly customFieldId?: string | null;
  readonly position: number;
  readonly visible: boolean;
  readonly width?: number | null;
}

export interface UpdateListColumnsRequestDto {
  readonly columns: ListColumnUpdateRequestDto[];
}

export interface AddProjectMemberRequestDto {
  readonly userId: string;
  readonly role?: ProjectAccessRole;
}

export interface UpdateProjectMemberRoleRequestDto {
  readonly role: ProjectAccessRole;
}

export interface AddProjectMembersFromTeamRequestDto {
  readonly sourceTeamId: string;
  readonly role?: ProjectAccessRole;
}

export interface AddProjectMembersFromTeamResponseDto {
  readonly addedCount: number;
  readonly message: string;
}
