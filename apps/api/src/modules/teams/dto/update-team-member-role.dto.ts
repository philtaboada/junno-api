import { IsEnum } from 'class-validator';
import { TeamAccessRole } from '../entities/team-member.entity';

export class UpdateTeamMemberRoleDto {
  @IsEnum(TeamAccessRole)
  role!: TeamAccessRole;
}
