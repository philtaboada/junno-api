import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import type {
  InboxEventDto,
  InboxUnreadCountDto,
  MarkAllInboxEventsReadResponseDto,
} from '@pm/contracts';
import { JwtAuthGuard } from '../auth/guards/auth.guards';
import type { WorkspaceContext } from '../auth/interfaces/jwt-payload.interface';
import { CurrentWorkspace } from '../workspaces/decorators/current-workspace.decorator';
import { WorkspaceMemberGuard } from '../workspaces/guards/workspace-member.guard';
import { InboxService } from './inbox.service';

@Controller('inbox')
@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
export class InboxController {
  constructor(private readonly inboxService: InboxService) {}

  @Get('unread-count')
  getUnreadCount(
    @CurrentWorkspace() context: WorkspaceContext,
  ): Promise<InboxUnreadCountDto> {
    return this.inboxService
      .countUnreadForUser(context.workspace.id, context.user.id)
      .then((count) => ({ count }));
  }

  @Get('events')
  listEvents(@CurrentWorkspace() context: WorkspaceContext): Promise<InboxEventDto[]> {
    return this.inboxService.listForUser(
      context.workspace.id,
      context.user.id,
    );
  }

  @Patch('events/:eventId/read')
  markEventAsRead(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('eventId') eventId: string,
  ): Promise<InboxEventDto> {
    return this.inboxService.markEventAsRead(
      context.workspace.id,
      context.user.id,
      eventId,
    );
  }

  @Post('events/read-all')
  markAllEventsAsRead(
    @CurrentWorkspace() context: WorkspaceContext,
  ): Promise<MarkAllInboxEventsReadResponseDto> {
    return this.inboxService.markAllEventsAsRead(
      context.workspace.id,
      context.user.id,
    );
  }
}
