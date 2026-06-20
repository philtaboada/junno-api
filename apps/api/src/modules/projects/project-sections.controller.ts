import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { ProjectDetailDto } from '@pm/contracts';
import { JwtAuthGuard } from '../auth/guards/auth.guards';
import type { WorkspaceContext } from '../auth/interfaces/jwt-payload.interface';
import { CurrentWorkspace } from '../workspaces/decorators/current-workspace.decorator';
import { WorkspaceMemberGuard } from '../workspaces/guards/workspace-member.guard';
import { CreateSectionDto } from './dto/create-section.dto';
import { ReorderSectionsDto } from './dto/reorder-sections.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { ProjectsService } from './projects.service';

@Controller('projects/:projectId/sections')
@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
export class ProjectSectionsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('projectId') projectId: string,
    @Body() createSectionDto: CreateSectionDto,
  ): Promise<ProjectDetailDto> {
    return this.projectsService.createSectionForWorkspace(
      context,
      projectId,
      createSectionDto,
    );
  }

  @Patch('reorder')
  reorder(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('projectId') projectId: string,
    @Body() reorderSectionsDto: ReorderSectionsDto,
  ): Promise<ProjectDetailDto> {
    return this.projectsService.reorderSectionsForWorkspace(
      context,
      projectId,
      reorderSectionsDto,
    );
  }

  @Patch(':sectionId')
  update(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('projectId') projectId: string,
    @Param('sectionId') sectionId: string,
    @Body() updateSectionDto: UpdateSectionDto,
  ): Promise<ProjectDetailDto> {
    return this.projectsService.updateSectionForWorkspace(
      context,
      projectId,
      sectionId,
      updateSectionDto,
    );
  }

  @Delete(':sectionId')
  remove(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('projectId') projectId: string,
    @Param('sectionId') sectionId: string,
  ): Promise<ProjectDetailDto> {
    return this.projectsService.removeSectionForWorkspace(
      context,
      projectId,
      sectionId,
    );
  }
}
