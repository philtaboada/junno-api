import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { TeamInvitation } from './entities/team-invitation.entity';
import { TeamNotificationPreference } from './entities/team-notification-preference.entity';
import { TeamMember } from './entities/team-member.entity';
import { Team } from './entities/team.entity';
import { TeamInvitationNotificationService } from './team-invitation-notification.service';
import { TeamInvitationsController } from './team-invitations.controller';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      Team,
      TeamMember,
      TeamInvitation,
      TeamNotificationPreference,
    ]),
    AuthModule,
    WorkspacesModule,
    NotificationsModule,
  ],
  controllers: [TeamsController, TeamInvitationsController],
  providers: [TeamsService, TeamInvitationNotificationService],
  exports: [TeamsService],
})
export class TeamsModule {}
