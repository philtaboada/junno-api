import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { DashboardWidgetType } from '../entities/dashboard-widget.entity';

export class GetDashboardQueryDto {
  @IsOptional()
  @IsUUID()
  teamId?: string;
}

export class UpdateDashboardDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;
}

export class CreateDashboardWidgetDto {
  @IsEnum(DashboardWidgetType)
  type!: DashboardWidgetType;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title!: string;

  @IsOptional()
  config?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}

export class UpdateDashboardWidgetDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title?: string;

  @IsOptional()
  config?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
