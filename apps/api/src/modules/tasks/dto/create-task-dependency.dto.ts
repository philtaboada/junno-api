import { IsIn, IsUUID } from 'class-validator';
import type { TaskDependencyRelation } from '@pm/contracts';

export class CreateTaskDependencyDto {
  @IsUUID()
  relatedTaskId!: string;

  @IsIn(['blocked_by', 'blocking'])
  relation!: TaskDependencyRelation;
}
