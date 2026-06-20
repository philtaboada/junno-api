import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { TeamAccessRole } from '../entities/team-member.entity';

export class InviteTeamMemberDto {
  @IsEmail({}, { message: 'Introduce un email válido' })
  email!: string;

  @IsOptional()
  @IsEnum(TeamAccessRole)
  role?: TeamAccessRole;
}
