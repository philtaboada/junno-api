import { IsEnum } from 'class-validator';
import { TeamAccessRole } from '../entities/team-member.entity';

export class UpdateTeamInvitationRoleDto {
  @IsEnum(TeamAccessRole)
  role!: TeamAccessRole;
}
