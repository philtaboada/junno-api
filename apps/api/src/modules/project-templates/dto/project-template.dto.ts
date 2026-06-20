import { IsBoolean, IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import type { ProjectColor } from '@pm/contracts';
import { PROJECT_COLORS } from '../../projects/constants/projects.constants';

export class CreateProjectTemplateDto {
  @IsUUID()
  sourceProjectId!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsBoolean()
  includeTasks?: boolean;
}

export class CreateProjectFromTemplateDto {
  @IsUUID()
  teamId!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(PROJECT_COLORS)
  color?: ProjectColor;

  @IsOptional()
  @IsBoolean()
  includeTasks?: boolean;
}
