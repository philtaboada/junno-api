import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { ProjectTasksDto, TaskDetailDto } from '@pm/contracts';
import { JwtAuthGuard } from '../auth/guards/auth.guards';
import type { WorkspaceContext } from '../auth/interfaces/jwt-payload.interface';
import { CurrentWorkspace } from '../workspaces/decorators/current-workspace.decorator';
import { WorkspaceMemberGuard } from '../workspaces/guards/workspace-member.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { ReorderTasksDto } from './dto/reorder-tasks.dto';
import { TasksService } from './tasks.service';

@Controller('projects/:projectId/tasks')
@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
export class ProjectTasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  list(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('projectId') projectId: string,
  ): Promise<ProjectTasksDto> {
    return this.tasksService.listForProject(
      context.workspace.id,
      projectId,
      context.user.id,
    );
  }

  @Post()
  create(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('projectId') projectId: string,
    @Body() createTaskDto: CreateTaskDto,
  ): Promise<TaskDetailDto> {
    return this.tasksService.createForProject(context, projectId, createTaskDto);
  }

  @Patch('reorder')
  reorder(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('projectId') projectId: string,
    @Body() reorderTasksDto: ReorderTasksDto,
  ): Promise<ProjectTasksDto> {
    return this.tasksService.reorderForProject(
      context,
      projectId,
      reorderTasksDto,
    );
  }
}
