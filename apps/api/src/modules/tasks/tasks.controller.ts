import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { MyTasksDto, TaskDependenciesDto, TaskDetailDto, TaskMembershipDto } from '@pm/contracts';
import { JwtAuthGuard } from '../auth/guards/auth.guards';
import type { WorkspaceContext } from '../auth/interfaces/jwt-payload.interface';
import { CurrentWorkspace } from '../workspaces/decorators/current-workspace.decorator';
import { WorkspaceMemberGuard } from '../workspaces/guards/workspace-member.guard';
import { UpdateListColumnsDto } from '../projects/dto/update-list-columns.dto';
import { AddTaskMembershipDto } from './dto/add-task-membership.dto';
import { CreateTaskDependencyDto } from './dto/create-task-dependency.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskDependenciesService } from './task-dependencies.service';
import { TasksService } from './tasks.service';

@Controller('tasks')
@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly taskDependenciesService: TaskDependenciesService,
  ) {}

  @Get('my')
  listMy(@CurrentWorkspace() context: WorkspaceContext): Promise<MyTasksDto> {
    return this.tasksService.listMyTasks(context);
  }

  @Patch('my/list-columns')
  updateMyListColumns(
    @CurrentWorkspace() context: WorkspaceContext,
    @Body() updateListColumnsDto: UpdateListColumnsDto,
  ): Promise<MyTasksDto> {
    return this.tasksService.updateMyTasksListColumns(context, updateListColumnsDto);
  }

  @Get(':id/memberships')
  listMemberships(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('id') taskId: string,
  ): Promise<TaskMembershipDto[]> {
    return this.tasksService.listMembershipsForWorkspace(
      context,
      taskId,
    );
  }

  @Post(':id/memberships')
  addMembership(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('id') taskId: string,
    @Body() addTaskMembershipDto: AddTaskMembershipDto,
  ): Promise<TaskDetailDto> {
    return this.tasksService.addMembershipForWorkspace(
      context,
      taskId,
      addTaskMembershipDto,
    );
  }

  @Delete(':id/memberships/:projectId')
  removeMembership(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('id') taskId: string,
    @Param('projectId') projectId: string,
  ): Promise<TaskDetailDto> {
    return this.tasksService.removeMembershipForWorkspace(
      context,
      taskId,
      projectId,
    );
  }

  @Get(':id/dependencies')
  listDependencies(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('id') taskId: string,
  ): Promise<TaskDependenciesDto> {
    return this.taskDependenciesService.listForTask(
      context.workspace.id,
      taskId,
      context.user.id,
    );
  }

  @Post(':id/dependencies')
  createDependency(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('id') taskId: string,
    @Body() createTaskDependencyDto: CreateTaskDependencyDto,
  ): Promise<TaskDependenciesDto> {
    return this.taskDependenciesService.createForTask(
      context,
      taskId,
      createTaskDependencyDto,
    );
  }

  @Delete(':id/dependencies/:dependencyId')
  removeDependency(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('id') taskId: string,
    @Param('dependencyId') dependencyId: string,
  ): Promise<TaskDependenciesDto> {
    return this.taskDependenciesService.removeForTask(
      context,
      taskId,
      dependencyId,
    );
  }

  @Get(':id')
  getOne(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('id') taskId: string,
  ): Promise<TaskDetailDto> {
    return this.tasksService.getForWorkspace(
      context.workspace.id,
      taskId,
      context.user.id,
    );
  }

  @Patch(':id')
  update(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('id') taskId: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ): Promise<TaskDetailDto> {
    return this.tasksService.updateForWorkspace(context, taskId, updateTaskDto);
  }

  @Delete(':id')
  remove(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('id') taskId: string,
  ): Promise<{ success: true }> {
    return this.tasksService
      .removeForWorkspace(context, taskId)
      .then(() => ({ success: true as const }));
  }
}
