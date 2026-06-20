import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { CustomFieldDefinitionDto, ProjectDetailDto } from '@pm/contracts';
import { JwtAuthGuard } from '../auth/guards/auth.guards';
import type { WorkspaceContext } from '../auth/interfaces/jwt-payload.interface';
import { CurrentWorkspace } from '../workspaces/decorators/current-workspace.decorator';
import { WorkspaceMemberGuard } from '../workspaces/guards/workspace-member.guard';
import { CreateCustomFieldDto, UpdateCustomFieldDto } from './dto/custom-field.dto';
import { ProjectsService } from './projects.service';

@Controller('projects/:projectId/custom-fields')
@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
export class CustomFieldsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('projectId') projectId: string,
    @Body() createCustomFieldDto: CreateCustomFieldDto,
  ): Promise<ProjectDetailDto> {
    return this.projectsService.createCustomFieldForWorkspace(
      context,
      projectId,
      createCustomFieldDto,
    );
  }

  @Patch(':fieldId')
  update(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('projectId') projectId: string,
    @Param('fieldId') fieldId: string,
    @Body() updateCustomFieldDto: UpdateCustomFieldDto,
  ): Promise<ProjectDetailDto> {
    return this.projectsService.updateCustomFieldForWorkspace(
      context,
      projectId,
      fieldId,
      updateCustomFieldDto,
    );
  }

  @Delete(':fieldId')
  remove(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('projectId') projectId: string,
    @Param('fieldId') fieldId: string,
  ): Promise<ProjectDetailDto> {
    return this.projectsService.removeCustomFieldForWorkspace(
      context,
      projectId,
      fieldId,
    );
  }
}
