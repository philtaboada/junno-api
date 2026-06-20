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
import type { DashboardDetailDto } from '@pm/contracts';
import { JwtAuthGuard } from '../auth/guards/auth.guards';
import type { WorkspaceContext } from '../auth/interfaces/jwt-payload.interface';
import { CurrentWorkspace } from '../workspaces/decorators/current-workspace.decorator';
import { WorkspaceMemberGuard } from '../workspaces/guards/workspace-member.guard';
import { DashboardsService } from './dashboards.service';
import {
  CreateDashboardWidgetDto,
  GetDashboardQueryDto,
  UpdateDashboardDto,
  UpdateDashboardWidgetDto,
} from './dto/dashboard.dto';

@Controller('dashboards')
@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
export class DashboardsController {
  constructor(private readonly dashboardsService: DashboardsService) {}

  @Get()
  getDashboard(
    @CurrentWorkspace() context: WorkspaceContext,
    @Query() query: GetDashboardQueryDto,
  ): Promise<DashboardDetailDto> {
    return this.dashboardsService.getOrCreateForScope(context, query.teamId);
  }

  @Patch(':dashboardId')
  updateDashboard(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('dashboardId') dashboardId: string,
    @Body() updateDashboardDto: UpdateDashboardDto,
  ): Promise<DashboardDetailDto> {
    return this.dashboardsService.updateDashboard(context, dashboardId, updateDashboardDto);
  }

  @Post(':dashboardId/widgets')
  addWidget(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('dashboardId') dashboardId: string,
    @Body() createDashboardWidgetDto: CreateDashboardWidgetDto,
  ): Promise<DashboardDetailDto> {
    return this.dashboardsService.addWidget(context, dashboardId, createDashboardWidgetDto);
  }

  @Patch(':dashboardId/widgets/:widgetId')
  updateWidget(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('dashboardId') dashboardId: string,
    @Param('widgetId') widgetId: string,
    @Body() updateDashboardWidgetDto: UpdateDashboardWidgetDto,
  ): Promise<DashboardDetailDto> {
    return this.dashboardsService.updateWidget(
      context,
      dashboardId,
      widgetId,
      updateDashboardWidgetDto,
    );
  }

  @Delete(':dashboardId/widgets/:widgetId')
  removeWidget(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('dashboardId') dashboardId: string,
    @Param('widgetId') widgetId: string,
  ): Promise<DashboardDetailDto> {
    return this.dashboardsService.removeWidget(context, dashboardId, widgetId);
  }
}
