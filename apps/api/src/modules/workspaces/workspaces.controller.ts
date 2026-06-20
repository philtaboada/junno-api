import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import type {
  WorkspaceMembersSearchResponseDto,
  WorkspaceSearchResponseDto,
  WorkspaceRole,
  WorkspaceSummaryDto,
  WorkspaceType,
} from '@pm/contracts';
import { JwtAuthGuard } from '../auth/guards/auth.guards';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { SearchWorkspaceMembersDto } from './dto/search-workspace-members.dto';
import { SearchWorkspaceDto } from './dto/search-workspace.dto';
import { CurrentWorkspace } from './decorators/current-workspace.decorator';
import { WorkspaceMemberGuard } from './guards/workspace-member.guard';
import { WorkspacesService } from './workspaces.service';
import type { WorkspaceContext } from '../auth/interfaces/jwt-payload.interface';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser): Promise<WorkspaceSummaryDto[]> {
    return this.workspacesService.listForUser(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createWorkspaceDto: CreateWorkspaceDto,
  ): Promise<WorkspaceSummaryDto> {
    return this.workspacesService.createForUser(user.id, createWorkspaceDto);
  }

  @Get('search')
  @UseGuards(WorkspaceMemberGuard)
  searchWorkspace(
    @CurrentWorkspace() context: WorkspaceContext,
    @Query() searchWorkspaceDto: SearchWorkspaceDto,
  ): Promise<WorkspaceSearchResponseDto> {
    return this.workspacesService.searchWorkspace(
      context.workspace.id,
      context.user.id,
      searchWorkspaceDto,
    );
  }

  @Get('members')
  @UseGuards(WorkspaceMemberGuard)
  searchMembers(
    @CurrentWorkspace() context: WorkspaceContext,
    @Query() searchWorkspaceMembersDto: SearchWorkspaceMembersDto,
  ): Promise<WorkspaceMembersSearchResponseDto> {
    return this.workspacesService.searchMembers(
      context.workspace.id,
      searchWorkspaceMembersDto,
    );
  }

  @Get(':id')
  @UseGuards(WorkspaceMemberGuard)
  getOne(
    @Param('id') workspaceId: string,
    @CurrentWorkspace() context: WorkspaceContext,
  ): WorkspaceSummaryDto {
    return {
      id: context.workspace.id,
      name: context.workspace.name,
      type: context.workspace.type as WorkspaceType,
      role: context.membership.role as WorkspaceRole,
    };
  }
}
