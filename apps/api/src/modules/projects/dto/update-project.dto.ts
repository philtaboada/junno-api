import { IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import type { ProjectColor, ProjectStatus } from '@pm/contracts';
import { PROJECT_COLORS } from '../constants/projects.constants';

const PROJECT_STATUSES: ProjectStatus[] = ['active', 'archived'];

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsIn(PROJECT_COLORS)
  color?: ProjectColor | null;

  @IsOptional()
  @IsUUID()
  teamId?: string;

  @IsOptional()
  @IsIn(PROJECT_STATUSES)
  status?: ProjectStatus;
}
