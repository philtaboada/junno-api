import { IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import type { ProjectColor } from '@pm/contracts';
import { PROJECT_COLORS } from '../constants/projects.constants';

export class CreateProjectDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsUUID()
  teamId!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(PROJECT_COLORS)
  color?: ProjectColor;
}
