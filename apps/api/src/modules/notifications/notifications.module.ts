import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AuthModule } from '../auth/auth.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { ActivityEventsService } from './activity-events.service';
import { ActivityEvent } from './entities/activity-event.entity';
import { InboxController } from './inbox.controller';
import { InboxService } from './inbox.service';
import { TaskInboxEventsService } from './task-inbox-events.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([ActivityEvent]),
    AuthModule,
    WorkspacesModule,
  ],
  controllers: [InboxController],
  providers: [ActivityEventsService, InboxService, TaskInboxEventsService],
  exports: [ActivityEventsService, InboxService, TaskInboxEventsService],
})
export class NotificationsModule {}
