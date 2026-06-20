import { IsIn, IsOptional, IsUUID } from 'class-validator';
import type { ProjectStatus } from '@pm/contracts';

const LIST_STATUSES = ['active', 'archived', 'all'] as const;

export class ListProjectsQueryDto {
  @IsOptional()
  @IsUUID()
  teamId?: string;

  @IsOptional()
  @IsIn(LIST_STATUSES)
  status?: (typeof LIST_STATUSES)[number];
}
