import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type {
  AddProjectMembersFromTeamResponseDto,
  ProjectDetailDto,
} from '@pm/contracts';
import { JwtAuthGuard } from '../auth/guards/auth.guards';
import type { WorkspaceContext } from '../auth/interfaces/jwt-payload.interface';
import { CurrentWorkspace } from '../workspaces/decorators/current-workspace.decorator';
import { WorkspaceMemberGuard } from '../workspaces/guards/workspace-member.guard';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { AddProjectMembersFromTeamDto } from './dto/add-project-members-from-team.dto';
import { UpdateProjectMemberRoleDto } from './dto/update-project-member-role.dto';
import { ProjectsService } from './projects.service';

@Controller('projects/:projectId/members')
@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
export class ProjectMembersController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  addMember(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('projectId') projectId: string,
    @Body() addProjectMemberDto: AddProjectMemberDto,
  ): Promise<ProjectDetailDto> {
    return this.projectsService.addMemberByUserId(
      context,
      projectId,
      addProjectMemberDto,
    );
  }

  @Post('from-team')
  addMembersFromTeam(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('projectId') projectId: string,
    @Body() addProjectMembersFromTeamDto: AddProjectMembersFromTeamDto,
  ): Promise<AddProjectMembersFromTeamResponseDto> {
    return this.projectsService.addMembersFromTeam(
      context,
      projectId,
      addProjectMembersFromTeamDto,
    );
  }

  @Patch(':userId')
  updateMemberRole(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
    @Body() updateProjectMemberRoleDto: UpdateProjectMemberRoleDto,
  ): Promise<ProjectDetailDto> {
    return this.projectsService.updateMemberRoleForWorkspace(
      context,
      projectId,
      userId,
      updateProjectMemberRoleDto,
    );
  }

  @Delete(':userId')
  removeMember(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
  ): Promise<ProjectDetailDto> {
    return this.projectsService.removeMemberForWorkspace(
      context,
      projectId,
      userId,
    );
  }
}
