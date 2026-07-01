import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import type {
  IntegrationDeliveryLogDto,
  IntegrationDetailDto,
  IntegrationSummaryDto,
  IntegrationOAuthSetupDto,
  ListGitHubReposResponseDto,
  SlackOAuthStartResponseDto,
} from '@pm/contracts';
import { JwtAuthGuard } from '../auth/guards/auth.guards';
import type { WorkspaceContext } from '../auth/interfaces/jwt-payload.interface';
import { CurrentWorkspace } from '../workspaces/decorators/current-workspace.decorator';
import { WorkspaceMemberGuard } from '../workspaces/guards/workspace-member.guard';
import {
  CompleteSlackOAuthDto,
  CreateIntegrationDto,
  ListGitHubReposDto,
  UpdateIntegrationDto,
} from './dto/integration.dto';
import { IntegrationsService } from './integrations.service';

@Controller('projects/:projectId/integrations')
@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
export class ProjectIntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  list(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('projectId') projectId: string,
  ): Promise<IntegrationSummaryDto[]> {
    return this.integrationsService.listForProject(context.workspace.id, projectId);
  }

  @Post()
  create(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('projectId') projectId: string,
    @Body() createIntegrationDto: CreateIntegrationDto,
  ): Promise<IntegrationDetailDto> {
    return this.integrationsService.createForProject(
      context,
      projectId,
      createIntegrationDto,
    );
  }
}

@Controller('integrations')
@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get('oauth-setup')
  getOAuthSetup(): IntegrationOAuthSetupDto {
    return this.integrationsService.getOAuthSetup();
  }

  @Post('github/list-repos')
  listGitHubRepos(
    @Body() listGitHubReposDto: ListGitHubReposDto,
  ): Promise<ListGitHubReposResponseDto> {
    return this.integrationsService.listGitHubRepos(listGitHubReposDto.accessToken);
  }

  @Get(':integrationId')
  getOne(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('integrationId') integrationId: string,
  ): Promise<IntegrationDetailDto> {
    return this.integrationsService.getForWorkspace(context.workspace.id, integrationId);
  }

  @Patch(':integrationId')
  update(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('integrationId') integrationId: string,
    @Body() updateIntegrationDto: UpdateIntegrationDto,
  ): Promise<IntegrationDetailDto> {
    return this.integrationsService.updateIntegration(
      context,
      integrationId,
      updateIntegrationDto,
    );
  }

  @Delete(':integrationId')
  remove(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('integrationId') integrationId: string,
  ): Promise<void> {
    return this.integrationsService.removeIntegration(context, integrationId);
  }

  @Get(':integrationId/delivery-logs')
  listLogs(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('integrationId') integrationId: string,
    @Query('limit') limit?: string,
  ): Promise<IntegrationDeliveryLogDto[]> {
    const parsedLimit = limit ? Number.parseInt(limit, 10) : 20;
    return this.integrationsService.listDeliveryLogs(
      context.workspace.id,
      integrationId,
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
    );
  }

  @Post(':integrationId/slack/oauth/start')
  startSlackOAuth(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('integrationId') integrationId: string,
  ): Promise<SlackOAuthStartResponseDto> {
    return this.integrationsService.startSlackOAuth(context, integrationId);
  }

  @Post(':integrationId/slack/complete')
  completeSlackChannel(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('integrationId') integrationId: string,
    @Body() completeSlackOAuthDto: CompleteSlackOAuthDto,
  ): Promise<IntegrationDetailDto> {
    return this.integrationsService.completeSlackChannel(
      context,
      integrationId,
      completeSlackOAuthDto.channelId,
      completeSlackOAuthDto.channelName,
    );
  }
}

@Controller('public/integrations/slack/oauth')
export class PublicSlackOAuthController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string | undefined,
    @Res() response: Response,
  ): Promise<void> {
    const webAppUrl = process.env.WEB_APP_URL ?? 'http://localhost:3001';
    if (error || !code || !state) {
      response.redirect(`${webAppUrl}/integrations/slack/error?reason=${encodeURIComponent(error ?? 'cancelled')}`);
      return;
    }
    try {
      const result = await this.integrationsService.completeSlackOAuthCallback(code, state);
      response.redirect(
        `${webAppUrl}/integrations/slack/success?integrationId=${encodeURIComponent(result.integrationId)}&team=${encodeURIComponent(result.teamName)}`,
      );
    } catch {
      response.redirect(`${webAppUrl}/integrations/slack/error?reason=oauth_failed`);
    }
  }
}
