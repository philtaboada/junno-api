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
import type {
  GoalMetricSnapshotDto,
  GoalSummaryDto,
  PortfolioDetailDto,
  PortfolioSummaryDto,
} from '@pm/contracts';
import { JwtAuthGuard } from '../auth/guards/auth.guards';
import type { WorkspaceContext } from '../auth/interfaces/jwt-payload.interface';
import { CurrentWorkspace } from '../workspaces/decorators/current-workspace.decorator';
import { WorkspaceMemberGuard } from '../workspaces/guards/workspace-member.guard';
import {
  AddPortfolioProjectDto,
  CreatePortfolioDto,
  UpdatePortfolioDto,
} from './dto/portfolio.dto';
import { CreateGoalDto, UpdateGoalDto } from './dto/goal.dto';
import { PortfoliosService } from './portfolios.service';

@Controller('portfolios')
@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
export class PortfoliosController {
  constructor(private readonly portfoliosService: PortfoliosService) {}

  @Get()
  list(@CurrentWorkspace() context: WorkspaceContext): Promise<PortfolioSummaryDto[]> {
    return this.portfoliosService.listForWorkspace(context.workspace.id);
  }

  @Post()
  create(
    @CurrentWorkspace() context: WorkspaceContext,
    @Body() createPortfolioDto: CreatePortfolioDto,
  ): Promise<PortfolioDetailDto> {
    return this.portfoliosService.create(context, createPortfolioDto);
  }

  @Get(':portfolioId')
  getOne(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('portfolioId') portfolioId: string,
  ): Promise<PortfolioDetailDto> {
    return this.portfoliosService.getForWorkspace(context.workspace.id, portfolioId);
  }

  @Patch(':portfolioId')
  update(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('portfolioId') portfolioId: string,
    @Body() updatePortfolioDto: UpdatePortfolioDto,
  ): Promise<PortfolioDetailDto> {
    return this.portfoliosService.update(context, portfolioId, updatePortfolioDto);
  }

  @Delete(':portfolioId')
  remove(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('portfolioId') portfolioId: string,
  ): Promise<void> {
    return this.portfoliosService.remove(context, portfolioId);
  }

  @Post(':portfolioId/projects')
  addProject(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('portfolioId') portfolioId: string,
    @Body() addPortfolioProjectDto: AddPortfolioProjectDto,
  ): Promise<PortfolioDetailDto> {
    return this.portfoliosService.addProject(
      context,
      portfolioId,
      addPortfolioProjectDto,
    );
  }

  @Delete(':portfolioId/projects/:projectId')
  removeProject(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('portfolioId') portfolioId: string,
    @Param('projectId') projectId: string,
  ): Promise<PortfolioDetailDto> {
    return this.portfoliosService.removeProject(context, portfolioId, projectId);
  }

  @Get(':portfolioId/goals')
  listGoals(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('portfolioId') portfolioId: string,
  ): Promise<GoalSummaryDto[]> {
    return this.portfoliosService.listGoals(context.workspace.id, portfolioId);
  }

  @Post(':portfolioId/goals')
  createGoal(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('portfolioId') portfolioId: string,
    @Body() createGoalDto: CreateGoalDto,
  ): Promise<GoalSummaryDto> {
    return this.portfoliosService.createGoal(context, portfolioId, createGoalDto);
  }
}

@Controller('goals')
@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
export class GoalsController {
  constructor(private readonly portfoliosService: PortfoliosService) {}

  @Get(':goalId')
  getOne(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('goalId') goalId: string,
  ) {
    return this.portfoliosService.getGoal(context.workspace.id, goalId);
  }

  @Patch(':goalId')
  update(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('goalId') goalId: string,
    @Body() updateGoalDto: UpdateGoalDto,
  ): Promise<GoalSummaryDto> {
    return this.portfoliosService.updateGoal(context, goalId, updateGoalDto);
  }

  @Delete(':goalId')
  remove(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('goalId') goalId: string,
  ): Promise<void> {
    return this.portfoliosService.removeGoal(context, goalId);
  }

  @Get(':goalId/snapshots')
  listSnapshots(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('goalId') goalId: string,
  ): Promise<GoalMetricSnapshotDto[]> {
    return this.portfoliosService.listGoalSnapshots(context.workspace.id, goalId);
  }

  @Post(':goalId/snapshots')
  recordSnapshot(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('goalId') goalId: string,
  ): Promise<GoalMetricSnapshotDto> {
    return this.portfoliosService.recordGoalSnapshot(context, goalId);
  }
}
