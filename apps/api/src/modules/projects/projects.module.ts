import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AuthModule } from '../auth/auth.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { SearchModule } from '../search/search.module';
import { CustomFieldsController } from './custom-fields.controller';
import { CustomFieldsService } from './custom-fields.service';
import { CustomFieldDefinition } from './entities/custom-field-definition.entity';
import { CustomFieldValue } from './entities/custom-field-value.entity';
import { ProjectListColumn } from './entities/project-list-column.entity';
import { ProjectMember } from './entities/project-member.entity';
import { Project } from './entities/project.entity';
import { Section } from './entities/section.entity';
import { ProjectsController } from './projects.controller';
import { ProjectMembersController } from './project-members.controller';
import { ProjectSectionsController } from './project-sections.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      Project,
      Section,
      ProjectMember,
      ProjectListColumn,
      CustomFieldDefinition,
      CustomFieldValue,
    ]),
    AuthModule,
    WorkspacesModule,
    SearchModule,
  ],
  controllers: [
    ProjectsController,
    ProjectSectionsController,
    ProjectMembersController,
    CustomFieldsController,
  ],
  providers: [ProjectsService, CustomFieldsService],
  exports: [ProjectsService, CustomFieldsService],
})
export class ProjectsModule {}
