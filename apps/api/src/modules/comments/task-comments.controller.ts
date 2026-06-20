import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import type { CommentDto } from '@pm/contracts';
import { JwtAuthGuard } from '../auth/guards/auth.guards';
import type { WorkspaceContext } from '../auth/interfaces/jwt-payload.interface';
import { CurrentWorkspace } from '../workspaces/decorators/current-workspace.decorator';
import { WorkspaceMemberGuard } from '../workspaces/guards/workspace-member.guard';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('tasks/:taskId/comments')
@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
export class TaskCommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  list(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('taskId') taskId: string,
  ): Promise<CommentDto[]> {
    return this.commentsService.listForTask(
      context.workspace.id,
      taskId,
      context.user.id,
    );
  }

  @Post()
  create(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('taskId') taskId: string,
    @Body() createCommentDto: CreateCommentDto,
  ): Promise<CommentDto> {
    return this.commentsService.createForTask(context, taskId, createCommentDto);
  }
}
