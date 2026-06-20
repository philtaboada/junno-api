import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

const LIST_FIELD_KEYS = ['name', 'due_at', 'assignee'] as const;

export class ListColumnUpdateDto {
  @IsOptional()
  @IsIn(LIST_FIELD_KEYS)
  fieldKey?: (typeof LIST_FIELD_KEYS)[number] | null;

  @IsOptional()
  @IsUUID()
  customFieldId?: string | null;

  @IsInt()
  @Min(0)
  position!: number;

  @IsBoolean()
  visible!: boolean;

  @IsOptional()
  @IsInt()
  @Min(48)
  width?: number | null;
}

export class UpdateListColumnsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ListColumnUpdateDto)
  columns!: ListColumnUpdateDto[];
}
