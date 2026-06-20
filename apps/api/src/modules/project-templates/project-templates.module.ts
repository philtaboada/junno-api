import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AuthModule } from '../auth/auth.module';
import { CustomFieldDefinition } from '../projects/entities/custom-field-definition.entity';
import { ProjectMember } from '../projects/entities/project-member.entity';
import { ProjectListColumn } from '../projects/entities/project-list-column.entity';
import { Project } from '../projects/entities/project.entity';
import { ProjectsModule } from '../projects/projects.module';
import { Section } from '../projects/entities/section.entity';
import { SearchModule } from '../search/search.module';
import { TaskMembership } from '../tasks/entities/task-membership.entity';
import { Task } from '../tasks/entities/task.entity';
import { TeamMember } from '../teams/entities/team-member.entity';
import { Team } from '../teams/entities/team.entity';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { ProjectTemplateCustomField } from './entities/project-template-custom-field.entity';
import { ProjectTemplateSection } from './entities/project-template-section.entity';
import { ProjectTemplateTask } from './entities/project-template-task.entity';
import { ProjectTemplate } from './entities/project-template.entity';
import { ProjectTemplatesController } from './project-templates.controller';
import { ProjectTemplatesService } from './project-templates.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      ProjectTemplate,
      ProjectTemplateSection,
      ProjectTemplateCustomField,
      ProjectTemplateTask,
      Project,
      Section,
      ProjectMember,
      ProjectListColumn,
      CustomFieldDefinition,
      Task,
      TaskMembership,
      Team,
      TeamMember,
    ]),
    AuthModule,
    WorkspacesModule,
    ProjectsModule,
    SearchModule,
  ],
  controllers: [ProjectTemplatesController],
  providers: [ProjectTemplatesService],
  exports: [ProjectTemplatesService],
})
export class ProjectTemplatesModule {}
