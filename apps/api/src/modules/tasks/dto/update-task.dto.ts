import {
  IsBoolean,
  IsISO8601,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsUUID()
  assigneeId?: string | null;

  @IsOptional()
  @IsISO8601()
  startAt?: string | null;

  @IsOptional()
  @IsBoolean()
  startHasTime?: boolean;

  @IsOptional()
  @IsISO8601()
  dueAt?: string | null;

  @IsOptional()
  @IsBoolean()
  dueHasTime?: boolean;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @IsOptional()
  @IsNumber()
  position?: number;

  @IsOptional()
  @IsObject()
  customFieldValues?: Record<string, Record<string, unknown> | null>;
}
