import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AuthModule } from '../auth/auth.module';
import { CustomFieldDefinition } from '../projects/entities/custom-field-definition.entity';
import { CustomFieldValue } from '../projects/entities/custom-field-value.entity';
import { Project } from '../projects/entities/project.entity';
import { TaskMembership } from '../tasks/entities/task-membership.entity';
import { Task } from '../tasks/entities/task.entity';
import { Team } from '../teams/entities/team.entity';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { DashboardsController } from './dashboards.controller';
import { DashboardsService } from './dashboards.service';
import { DashboardWidget } from './entities/dashboard-widget.entity';
import { Dashboard } from './entities/dashboard.entity';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      Dashboard,
      DashboardWidget,
      Task,
      TaskMembership,
      Project,
      Team,
      CustomFieldDefinition,
      CustomFieldValue,
    ]),
    AuthModule,
    WorkspacesModule,
  ],
  controllers: [DashboardsController],
  providers: [DashboardsService],
  exports: [DashboardsService],
})
export class DashboardsModule {}
