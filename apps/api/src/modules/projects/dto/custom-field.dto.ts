import {
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

const CUSTOM_FIELD_TYPES = [
  'select',
  'multiselect',
  'date',
  'people',
  'text',
  'number',
  'timer',
] as const;

export class CreateCustomFieldDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsIn(CUSTOM_FIELD_TYPES)
  type!: (typeof CUSTOM_FIELD_TYPES)[number];

  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  visible?: boolean;
}

export class UpdateCustomFieldDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;
}

export class CustomFieldValueInputDto {
  @IsIn(CUSTOM_FIELD_TYPES)
  type!: (typeof CUSTOM_FIELD_TYPES)[number];

  @IsOptional()
  @IsString()
  optionId?: string | null;

  @IsOptional()
  @IsString({ each: true })
  optionIds?: string[];

  @IsOptional()
  @IsString()
  date?: string | null;

  @IsOptional()
  @IsUUID(undefined, { each: true })
  userIds?: string[];

  @IsOptional()
  @IsString()
  text?: string | null;

  @IsOptional()
  number?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  seconds?: number;

  @IsOptional()
  @IsString()
  runningSince?: string | null;
}

export class UpdateTaskCustomFieldValuesDto {
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => CustomFieldValueInputDto)
  values!: Record<string, CustomFieldValueInputDto | null>;
}
