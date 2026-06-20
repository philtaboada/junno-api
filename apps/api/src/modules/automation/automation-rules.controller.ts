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
import type { AutomationRuleDto, AutomationRunDto } from '@pm/contracts';
import { JwtAuthGuard } from '../auth/guards/auth.guards';
import type { WorkspaceContext } from '../auth/interfaces/jwt-payload.interface';
import { CurrentWorkspace } from '../workspaces/decorators/current-workspace.decorator';
import { WorkspaceMemberGuard } from '../workspaces/guards/workspace-member.guard';
import { AutomationRulesService } from './automation-rules.service';
import {
  CreateAutomationRuleDto,
  UpdateAutomationRuleDto,
} from './dto/automation-rule.dto';

@Controller('projects/:projectId/automation-rules')
@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
export class AutomationRulesController {
  constructor(private readonly automationRulesService: AutomationRulesService) {}

  @Get()
  list(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('projectId') projectId: string,
  ): Promise<AutomationRuleDto[]> {
    return this.automationRulesService.listForProject(context, projectId);
  }

  @Get('runs')
  listRuns(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('projectId') projectId: string,
  ): Promise<AutomationRunDto[]> {
    return this.automationRulesService.listRecentRunsForProject(context, projectId);
  }

  @Post()
  create(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('projectId') projectId: string,
    @Body() createAutomationRuleDto: CreateAutomationRuleDto,
  ): Promise<AutomationRuleDto> {
    return this.automationRulesService.createForProject(
      context,
      projectId,
      createAutomationRuleDto,
    );
  }

  @Patch(':ruleId')
  update(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('projectId') projectId: string,
    @Param('ruleId') ruleId: string,
    @Body() updateAutomationRuleDto: UpdateAutomationRuleDto,
  ): Promise<AutomationRuleDto> {
    return this.automationRulesService.updateForProject(
      context,
      projectId,
      ruleId,
      updateAutomationRuleDto,
    );
  }

  @Delete(':ruleId')
  remove(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('projectId') projectId: string,
    @Param('ruleId') ruleId: string,
  ): Promise<void> {
    return this.automationRulesService.removeForProject(context, projectId, ruleId);
  }
}
