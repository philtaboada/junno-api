import { IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import type { ProjectColor } from '@pm/contracts';
import { ProjectColor as ProjectColorEnum } from '../../projects/entities/project.entity';

export class CreatePortfolioDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsEnum(ProjectColorEnum)
  color?: ProjectColor;
}

export class UpdatePortfolioDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsOptional()
  @IsEnum(ProjectColorEnum)
  color?: ProjectColor | null;
}

export class AddPortfolioProjectDto {
  @IsUUID()
  projectId!: string;
}
