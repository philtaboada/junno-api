import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AuthModule } from '../auth/auth.module';
import { Comment } from '../comments/entities/comment.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProjectMember } from '../projects/entities/project-member.entity';
import { Project } from '../projects/entities/project.entity';
import { Section } from '../projects/entities/section.entity';
import { TaskMembership } from '../tasks/entities/task-membership.entity';
import { Task } from '../tasks/entities/task.entity';
import { WorkspaceMember } from '../workspaces/entities/workspace-member.entity';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { AutomationExecutorService } from './automation-executor.service';
import { AutomationProcessorService } from './automation-processor.service';
import { AutomationQueueService } from './automation-queue.service';
import { AutomationRulesController } from './automation-rules.controller';
import { AutomationRulesService } from './automation-rules.service';
import { AutomationTriggerService } from './automation-trigger.service';
import { AutomationRule } from './entities/automation-rule.entity';
import { AutomationRun } from './entities/automation-run.entity';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      AutomationRule,
      AutomationRun,
      Project,
      ProjectMember,
      Task,
      TaskMembership,
      Section,
      Comment,
      WorkspaceMember,
    ]),
    AuthModule,
    WorkspacesModule,
    NotificationsModule,
  ],
  controllers: [AutomationRulesController],
  providers: [
    AutomationRulesService,
    AutomationQueueService,
    AutomationProcessorService,
    AutomationExecutorService,
    AutomationTriggerService,
  ],
  exports: [AutomationTriggerService],
})
export class AutomationModule {}
