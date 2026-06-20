import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { ProjectDetailDto, ProjectSummaryDto } from '@pm/contracts';
import { JwtAuthGuard } from '../auth/guards/auth.guards';
import type { WorkspaceContext } from '../auth/interfaces/jwt-payload.interface';
import { CurrentWorkspace } from '../workspaces/decorators/current-workspace.decorator';
import { WorkspaceMemberGuard } from '../workspaces/guards/workspace-member.guard';
import { CreateProjectDto } from './dto/create-project.dto';
import { ListProjectsQueryDto } from './dto/list-projects-query.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UpdateListColumnsDto } from './dto/update-list-columns.dto';
import { ProjectsService } from './projects.service';

@Controller('projects')
@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  list(
    @CurrentWorkspace() context: WorkspaceContext,
    @Query() query: ListProjectsQueryDto,
  ): Promise<ProjectSummaryDto[]> {
    return this.projectsService.listForWorkspace(context.workspace.id, query);
  }

  @Post()
  create(
    @CurrentWorkspace() context: WorkspaceContext,
    @Body() createProjectDto: CreateProjectDto,
  ): Promise<ProjectDetailDto> {
    return this.projectsService.createForWorkspace(context, createProjectDto);
  }

  @Get(':id')
  getOne(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('id') projectId: string,
  ): Promise<ProjectDetailDto> {
    return this.projectsService.getForWorkspace(context.workspace.id, projectId);
  }

  @Patch(':id/list-columns')
  updateListColumns(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('id') projectId: string,
    @Body() updateListColumnsDto: UpdateListColumnsDto,
  ): Promise<ProjectDetailDto> {
    return this.projectsService.updateListColumnsForWorkspace(
      context,
      projectId,
      updateListColumnsDto,
    );
  }

  @Patch(':id')
  update(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('id') projectId: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ): Promise<ProjectDetailDto> {
    return this.projectsService.updateForWorkspace(
      context,
      projectId,
      updateProjectDto,
    );
  }

  @Delete(':id')
  remove(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('id') projectId: string,
  ): Promise<{ success: true }> {
    return this.projectsService
      .removeForWorkspace(context, projectId)
      .then(() => ({ success: true as const }));
  }
}
