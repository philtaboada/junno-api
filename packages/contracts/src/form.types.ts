import type { CustomFieldType, CustomFieldValueDto } from './custom-field.types';

export type FormFieldType =
  | 'task_name'
  | 'task_description'
  | 'due_at'
  | 'custom_field';

export interface FormFieldDto {
  readonly id: string;
  readonly type: FormFieldType;
  readonly label: string;
  readonly required: boolean;
  readonly position: number;
  readonly customFieldDefinitionId: string | null;
  readonly customFieldType: CustomFieldType | null;
  readonly customFieldSettings: Record<string, unknown> | null;
}

export interface FormSummaryDto {
  readonly id: string;
  readonly projectId: string;
  readonly name: string;
  readonly description: string | null;
  readonly isPublic: boolean;
  readonly isActive: boolean;
  readonly publicSlug: string;
  readonly fieldCount: number;
  readonly createdAt: string;
}

export interface FormDetailDto extends FormSummaryDto {
  readonly sectionId: string | null;
  readonly fields: FormFieldDto[];
  readonly publicUrl: string;
  readonly internalUrl: string;
}

export interface CreateFormRequestDto {
  readonly name: string;
  readonly description?: string;
  readonly isPublic?: boolean;
  readonly sectionId?: string;
}

export interface UpdateFormRequestDto {
  readonly name?: string;
  readonly description?: string | null;
  readonly isPublic?: boolean;
  readonly isActive?: boolean;
  readonly sectionId?: string | null;
}

export interface CreateFormFieldRequestDto {
  readonly type: FormFieldType;
  readonly label: string;
  readonly required?: boolean;
  readonly position?: number;
  readonly customFieldDefinitionId?: string;
}

export interface UpdateFormFieldRequestDto {
  readonly label?: string;
  readonly required?: boolean;
  readonly position?: number;
}

export interface SubmitFormRequestDto {
  readonly values: Record<string, unknown>;
}

export interface SubmitFormResponseDto {
  readonly taskId: string;
  readonly taskName: string;
  readonly projectId: string;
}

export interface PublicFormDto {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly projectName: string;
  readonly workspaceName: string;
  readonly fields: FormFieldDto[];
}
