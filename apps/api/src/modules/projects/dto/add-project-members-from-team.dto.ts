import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ProjectAccessRole } from '../entities/project-member.entity';

export class AddProjectMembersFromTeamDto {
  @IsUUID()
  sourceTeamId!: string;

  @IsOptional()
  @IsEnum(ProjectAccessRole)
  role?: ProjectAccessRole;
}
