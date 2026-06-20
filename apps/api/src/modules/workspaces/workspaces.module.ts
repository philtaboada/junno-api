import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AuthModule } from '../auth/auth.module';
import { SearchModule } from '../search/search.module';
import { Comment } from '../comments/entities/comment.entity';
import { ProjectMember } from '../projects/entities/project-member.entity';
import { Project } from '../projects/entities/project.entity';
import { TaskMembership } from '../tasks/entities/task-membership.entity';
import { Task } from '../tasks/entities/task.entity';
import { TeamMember } from '../teams/entities/team-member.entity';
import { Team } from '../teams/entities/team.entity';
import { WorkspaceMember } from './entities/workspace-member.entity';
import { Workspace } from './entities/workspace.entity';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';
import { WorkspaceMemberGuard } from './guards/workspace-member.guard';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      Workspace,
      WorkspaceMember,
      Team,
      TeamMember,
      Project,
      ProjectMember,
      Task,
      TaskMembership,
      Comment,
    ]),
    AuthModule,
    SearchModule,
  ],
  controllers: [WorkspacesController],
  providers: [WorkspacesService, WorkspaceMemberGuard],
  exports: [WorkspacesService, WorkspaceMemberGuard],
})
export class WorkspacesModule {}
