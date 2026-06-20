import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import type {
  AcceptTeamInvitationResponseDto,
  TeamInvitationPreviewDto,
} from '@pm/contracts';
import { JwtAuthGuard } from '../auth/guards/auth.guards';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { AcceptTeamInvitationDto } from './dto/accept-team-invitation.dto';
import { TeamsService } from './teams.service';

@Controller('team-invitations')
export class TeamInvitationsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get('preview')
  preview(@Query('token') token: string): Promise<TeamInvitationPreviewDto> {
    return this.teamsService.previewInvitation(token);
  }

  @Post('accept')
  @UseGuards(JwtAuthGuard)
  accept(
    @CurrentUser() user: AuthenticatedUser,
    @Body() acceptTeamInvitationDto: AcceptTeamInvitationDto,
  ): Promise<AcceptTeamInvitationResponseDto> {
    return this.teamsService.acceptInvitation(user, acceptTeamInvitationDto);
  }
}
