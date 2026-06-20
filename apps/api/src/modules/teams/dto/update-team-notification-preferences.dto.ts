import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateTeamNotificationPreferencesDto {
  @IsOptional()
  @IsBoolean()
  notifyOnInvite?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyOnJoin?: boolean;
}
