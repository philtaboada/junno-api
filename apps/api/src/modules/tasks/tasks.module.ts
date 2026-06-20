import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AuthModule } from '../auth/auth.module';
import { Comment } from '../comments/entities/comment.entity';
import { ProjectMember } from '../projects/entities/project-member.entity';
import { Project } from '../projects/entities/project.entity';
import { Section } from '../projects/entities/section.entity';
import { ProjectsModule } from '../projects/projects.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { SearchModule } from '../search/search.module';
import { AutomationModule } from '../automation/automation.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { MyTasksListColumn } from './entities/my-tasks-list-column.entity';
import { TaskAttachment } from './entities/task-attachment.entity';
import { TaskDependency } from './entities/task-dependency.entity';
import { TaskMembership } from './entities/task-membership.entity';
import { Task } from './entities/task.entity';
import { ProjectTasksController } from './project-tasks.controller';
import { TaskAttachmentsController } from './task-attachments.controller';
import { TaskAttachmentsService } from './task-attachments.service';
import { TaskDependenciesService } from './task-dependencies.service';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      Task,
      TaskMembership,
      TaskAttachment,
      TaskDependency,
      MyTasksListColumn,
      Project,
      Section,
      ProjectMember,
      Comment,
    ]),
    AuthModule,
    WorkspacesModule,
    RealtimeModule,
    ProjectsModule,
    NotificationsModule,
    SearchModule,
    AutomationModule,
    IntegrationsModule,
  ],
  controllers: [
    ProjectTasksController,
    TasksController,
    TaskAttachmentsController,
  ],
  providers: [TasksService, TaskAttachmentsService, TaskDependenciesService],
  exports: [TasksService],
})
export class TasksModule {}
