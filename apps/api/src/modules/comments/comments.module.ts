import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AuthModule } from '../auth/auth.module';
import { Comment } from './entities/comment.entity';
import { ProjectMember } from '../projects/entities/project-member.entity';
import { TaskMembership } from '../tasks/entities/task-membership.entity';
import { Task } from '../tasks/entities/task.entity';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { SearchModule } from '../search/search.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CommentsService } from './comments.service';
import { TaskCommentsController } from './task-comments.controller';

@Module({
  imports: [
    MikroOrmModule.forFeature([Comment, Task, TaskMembership, ProjectMember]),
    AuthModule,
    WorkspacesModule,
    NotificationsModule,
    SearchModule,
  ],
  controllers: [TaskCommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
