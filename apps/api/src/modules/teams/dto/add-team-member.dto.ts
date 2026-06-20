import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { TeamAccessRole } from '../entities/team-member.entity';

export class AddTeamMemberDto {
  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsEnum(TeamAccessRole)
  role?: TeamAccessRole;
}
