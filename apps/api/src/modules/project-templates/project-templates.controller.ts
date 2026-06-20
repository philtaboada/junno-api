import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import type {
  ProjectDetailDto,
  ProjectTemplateDetailDto,
  ProjectTemplateSummaryDto,
} from '@pm/contracts';
import { JwtAuthGuard } from '../auth/guards/auth.guards';
import type { WorkspaceContext } from '../auth/interfaces/jwt-payload.interface';
import { CurrentWorkspace } from '../workspaces/decorators/current-workspace.decorator';
import { WorkspaceMemberGuard } from '../workspaces/guards/workspace-member.guard';
import {
  CreateProjectFromTemplateDto,
  CreateProjectTemplateDto,
} from './dto/project-template.dto';
import { ProjectTemplatesService } from './project-templates.service';

@Controller('project-templates')
@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
export class ProjectTemplatesController {
  constructor(private readonly projectTemplatesService: ProjectTemplatesService) {}

  @Get()
  list(
    @CurrentWorkspace() context: WorkspaceContext,
  ): Promise<ProjectTemplateSummaryDto[]> {
    return this.projectTemplatesService.listForWorkspace(context.workspace.id);
  }

  @Get(':templateId')
  getOne(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('templateId') templateId: string,
  ): Promise<ProjectTemplateDetailDto> {
    return this.projectTemplatesService.getForWorkspace(
      context.workspace.id,
      templateId,
    );
  }

  @Post()
  createFromProject(
    @CurrentWorkspace() context: WorkspaceContext,
    @Body() createProjectTemplateDto: CreateProjectTemplateDto,
  ): Promise<ProjectTemplateDetailDto> {
    return this.projectTemplatesService.createFromProject(
      context,
      createProjectTemplateDto,
    );
  }

  @Post(':templateId/projects')
  createProject(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('templateId') templateId: string,
    @Body() createProjectFromTemplateDto: CreateProjectFromTemplateDto,
  ): Promise<ProjectDetailDto> {
    return this.projectTemplatesService.createProjectFromTemplate(
      context,
      templateId,
      createProjectFromTemplateDto,
    );
  }

  @Delete(':templateId')
  remove(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('templateId') templateId: string,
  ): Promise<void> {
    return this.projectTemplatesService.removeForWorkspace(context, templateId);
  }
}
