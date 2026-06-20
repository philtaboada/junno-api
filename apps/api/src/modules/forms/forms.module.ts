import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AuthModule } from '../auth/auth.module';
import { CustomFieldDefinition } from '../projects/entities/custom-field-definition.entity';
import { ProjectMember } from '../projects/entities/project-member.entity';
import { Project } from '../projects/entities/project.entity';
import { Section } from '../projects/entities/section.entity';
import { TasksModule } from '../tasks/tasks.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { FormField } from './entities/form-field.entity';
import { ProjectForm } from './entities/project-form.entity';
import { FormsController, ProjectFormsController } from './forms.controller';
import { FormsService } from './forms.service';
import { PublicFormsController } from './public-forms.controller';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      ProjectForm,
      FormField,
      Project,
      Section,
      ProjectMember,
      CustomFieldDefinition,
    ]),
    AuthModule,
    WorkspacesModule,
    TasksModule,
  ],
  controllers: [ProjectFormsController, FormsController, PublicFormsController],
  providers: [FormsService],
  exports: [FormsService],
})
export class FormsModule {}
