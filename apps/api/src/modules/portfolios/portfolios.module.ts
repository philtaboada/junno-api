import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AuthModule } from '../auth/auth.module';
import { CustomFieldDefinition } from '../projects/entities/custom-field-definition.entity';
import { CustomFieldValue } from '../projects/entities/custom-field-value.entity';
import { Project } from '../projects/entities/project.entity';
import { TaskMembership } from '../tasks/entities/task-membership.entity';
import { Task } from '../tasks/entities/task.entity';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { GoalMetricSnapshot } from './entities/goal-metric-snapshot.entity';
import { Goal } from './entities/goal.entity';
import { PortfolioProject } from './entities/portfolio-project.entity';
import { Portfolio } from './entities/portfolio.entity';
import { GoalsController, PortfoliosController } from './portfolios.controller';
import { PortfoliosService } from './portfolios.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      Portfolio,
      PortfolioProject,
      Goal,
      GoalMetricSnapshot,
      Project,
      CustomFieldDefinition,
      CustomFieldValue,
      Task,
      TaskMembership,
    ]),
    AuthModule,
    WorkspacesModule,
  ],
  controllers: [PortfoliosController, GoalsController],
  providers: [PortfoliosService],
  exports: [PortfoliosService],
})
export class PortfoliosModule {}
