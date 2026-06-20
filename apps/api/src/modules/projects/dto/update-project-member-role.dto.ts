import { IsEnum } from 'class-validator';
import { ProjectAccessRole } from '../entities/project-member.entity';

export class UpdateProjectMemberRoleDto {
  @IsEnum(ProjectAccessRole)
  role!: ProjectAccessRole;
}
