import { IsOptional, IsUUID } from 'class-validator';

export class AddTaskMembershipDto {
  @IsUUID()
  projectId!: string;

  @IsOptional()
  @IsUUID()
  sectionId?: string;
}
