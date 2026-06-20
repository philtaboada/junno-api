import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ProjectAccessRole } from '../entities/project-member.entity';

export class AddProjectMemberDto {
  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsEnum(ProjectAccessRole)
  role?: ProjectAccessRole;
}
