import type { CustomFieldSettingsDto, CustomFieldType } from './custom-field.types';
import type { ProjectColor } from './project.types';

export interface ProjectTemplateSectionDto {
  readonly id: string;
  readonly name: string;
  readonly position: number;
}

export interface ProjectTemplateCustomFieldDto {
  readonly id: string;
  readonly name: string;
  readonly type: CustomFieldType;
  readonly settings: CustomFieldSettingsDto;
  readonly position: number;
}

export interface ProjectTemplateTaskDto {
  readonly id: string;
  readonly sectionId: string;
  readonly name: string;
  readonly description: string | null;
  readonly position: number;
}

export interface ProjectTemplateSummaryDto {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly sourceProjectId: string | null;
  readonly sourceProjectName: string | null;
  readonly hasTasks: boolean;
  readonly sectionCount: number;
  readonly customFieldCount: number;
  readonly taskCount: number;
  readonly createdAt: string;
}

export interface ProjectTemplateDetailDto extends ProjectTemplateSummaryDto {
  readonly sections: ProjectTemplateSectionDto[];
  readonly customFields: ProjectTemplateCustomFieldDto[];
  readonly tasks: ProjectTemplateTaskDto[];
}

export interface CreateProjectTemplateRequestDto {
  readonly sourceProjectId: string;
  readonly name: string;
  readonly includeTasks?: boolean;
}

export interface CreateProjectFromTemplateRequestDto {
  readonly teamId: string;
  readonly name: string;
  readonly description?: string;
  readonly color?: ProjectColor;
  readonly includeTasks?: boolean;
}
