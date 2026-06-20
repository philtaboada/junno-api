import type { ProjectListColumnDto } from './project.types';
import type {
  CustomFieldDefinitionDto,
  CustomFieldValueDto,
} from './custom-field.types';
import type { TaskAttachmentDto } from './attachment.types';
import type { TaskDependenciesDto } from './dependency.types';
import type { WorkspaceMemberDto } from './workspace.types';

export type TaskPriority = 'low' | 'medium' | 'high';

export interface TaskAssigneeDto {
  readonly userId: string;
  readonly name: string;
  readonly email: string;
}

export interface TaskSummaryDto {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly assignee: TaskAssigneeDto | null;
  readonly startAt: string | null;
  readonly startHasTime: boolean;
  readonly dueAt: string | null;
  readonly dueHasTime: boolean;
  readonly completedAt: string | null;
  readonly parentTaskId: string | null;
  readonly projectId: string;
  readonly projectName: string;
  readonly sectionId: string | null;
  readonly position: number;
  readonly createdAt: string;
  readonly customFieldValues: Record<string, CustomFieldValueDto>;
  readonly subtaskCount: number;
  readonly subtasks: TaskSummaryDto[];
  readonly isBlocked: boolean;
}

export interface TaskMembershipDto {
  readonly id: string;
  readonly projectId: string;
  readonly projectName: string;
  readonly sectionId: string | null;
  readonly sectionName: string | null;
  readonly position: number;
}

export interface TaskDetailDto extends TaskSummaryDto {
  readonly commentCount: number;
  readonly customFields: CustomFieldDefinitionDto[];
  readonly memberships: TaskMembershipDto[];
  readonly attachments: TaskAttachmentDto[];
  readonly dependencies: TaskDependenciesDto;
}

export interface AddTaskMembershipRequestDto {
  readonly projectId: string;
  readonly sectionId?: string;
}

export interface ProjectTaskDependencyEdgeDto {
  readonly id: string;
  readonly predecessorTaskId: string;
  readonly successorTaskId: string;
}

export interface ProjectTasksDto {
  readonly projectId: string;
  readonly tasks: TaskSummaryDto[];
  readonly dependencies: ProjectTaskDependencyEdgeDto[];
}

export interface CreateTaskRequestDto {
  readonly name: string;
  readonly sectionId?: string;
  readonly assigneeId?: string;
  readonly startAt?: string;
  readonly startHasTime?: boolean;
  readonly dueAt?: string;
  readonly dueHasTime?: boolean;
  readonly parentTaskId?: string;
}

export interface UpdateTaskRequestDto {
  readonly name?: string;
  readonly description?: string | null;
  readonly assigneeId?: string | null;
  readonly startAt?: string | null;
  readonly startHasTime?: boolean;
  readonly dueAt?: string | null;
  readonly dueHasTime?: boolean;
  readonly completed?: boolean;
  readonly sectionId?: string;
  readonly position?: number;
  readonly customFieldValues?: Record<string, CustomFieldValueDto | null>;
}

export interface TaskPositionUpdateDto {
  readonly taskId: string;
  readonly sectionId: string;
  readonly position: number;
}

export interface ReorderTasksRequestDto {
  readonly tasks: TaskPositionUpdateDto[];
}

export type MyTasksSectionId = 'today' | 'upcoming' | 'later';

export interface MyTasksSectionDto {
  readonly id: MyTasksSectionId;
  readonly label: string;
  readonly tasks: TaskSummaryDto[];
}

export interface MyTasksDto {
  readonly sections: MyTasksSectionDto[];
  readonly listColumns: ProjectListColumnDto[];
  readonly customFields: CustomFieldDefinitionDto[];
  readonly workspaceMembers: WorkspaceMemberDto[];
}
