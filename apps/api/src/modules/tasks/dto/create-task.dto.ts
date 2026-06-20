import {
  IsBoolean,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsISO8601()
  startAt?: string;

  @IsOptional()
  @IsBoolean()
  startHasTime?: boolean;

  @IsOptional()
  @IsISO8601()
  dueAt?: string;

  @IsOptional()
  @IsBoolean()
  dueHasTime?: boolean;

  @IsOptional()
  @IsUUID()
  parentTaskId?: string;
}
