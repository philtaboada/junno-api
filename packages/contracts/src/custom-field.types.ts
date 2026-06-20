export type CustomFieldType =
  | 'select'
  | 'multiselect'
  | 'date'
  | 'people'
  | 'text'
  | 'number'
  | 'timer';

export interface CustomFieldOptionDto {
  readonly id: string;
  readonly label: string;
  readonly color: string | null;
}

export interface CustomFieldSettingsDto {
  readonly options?: CustomFieldOptionDto[];
  readonly includeTime?: boolean;
  readonly isRange?: boolean;
  readonly allowMultiple?: boolean;
  readonly precision?: number;
  readonly maxLength?: number;
}

export interface CustomFieldDefinitionDto {
  readonly id: string;
  readonly projectId: string;
  readonly name: string;
  readonly type: CustomFieldType;
  readonly settings: CustomFieldSettingsDto;
  readonly position: number;
  readonly createdAt: string;
}

export type CustomFieldValueDto =
  | { readonly type: 'select'; readonly optionId: string | null }
  | { readonly type: 'multiselect'; readonly optionIds: string[] }
  | {
      readonly type: 'date';
      readonly date?: string | null;
      readonly startDate?: string | null;
      readonly endDate?: string | null;
    }
  | { readonly type: 'people'; readonly userIds: string[] }
  | { readonly type: 'text'; readonly text: string | null }
  | { readonly type: 'number'; readonly number: number | null }
  | { readonly type: 'timer'; readonly seconds: number; readonly runningSince: string | null };

export interface CreateCustomFieldRequestDto {
  readonly name: string;
  readonly type: CustomFieldType;
  readonly settings?: CustomFieldSettingsDto;
  readonly visible?: boolean;
}

export interface UpdateCustomFieldRequestDto {
  readonly name?: string;
  readonly settings?: CustomFieldSettingsDto;
}

export type CustomFieldValueInputDto = CustomFieldValueDto;

export interface UpdateTaskCustomFieldValuesRequestDto {
  readonly values: Record<string, CustomFieldValueInputDto | null>;
}
