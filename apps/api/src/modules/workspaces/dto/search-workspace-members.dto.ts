import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SearchWorkspaceMembersDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @IsString()
  teamId?: string;

  @IsOptional()
  @IsString()
  excludeTeamId?: string;

  @IsOptional()
  @IsString()
  excludeProjectId?: string;
}
