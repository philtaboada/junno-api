import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { TeamAccessRole } from '../entities/team-member.entity';

export class AddTeamMembersFromTeamDto {
  @IsUUID()
  sourceTeamId!: string;

  @IsOptional()
  @IsEnum(TeamAccessRole)
  role?: TeamAccessRole;
}
