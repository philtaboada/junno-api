import {
  IsEnum,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { GoalCustomFieldAggregation } from '@pm/contracts';
import { GoalMetricType } from '../entities/goal.entity';

class GoalCustomFieldRollupMetricConfigDto {
  @IsUUID()
  customFieldDefinitionId!: string;

  @IsEnum(['sum', 'avg'] as const)
  aggregation!: GoalCustomFieldAggregation;
}

export class CreateGoalDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsEnum(GoalMetricType)
  metricType!: GoalMetricType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  targetValue?: number;

  @IsOptional()
  @IsISO8601()
  dueAt?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => GoalCustomFieldRollupMetricConfigDto)
  metricConfig?: GoalCustomFieldRollupMetricConfigDto;
}

export class UpdateGoalDto {
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
  @IsNumber()
  @Min(0)
  targetValue?: number | null;

  @IsOptional()
  @IsISO8601()
  dueAt?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => GoalCustomFieldRollupMetricConfigDto)
  metricConfig?: GoalCustomFieldRollupMetricConfigDto | null;
}
