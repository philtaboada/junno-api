import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import type { TaskAttachmentDto } from '@pm/contracts';
import { createReadStream } from 'fs';
import { JwtAuthGuard } from '../auth/guards/auth.guards';
import type { WorkspaceContext } from '../auth/interfaces/jwt-payload.interface';
import { CurrentWorkspace } from '../workspaces/decorators/current-workspace.decorator';
import { WorkspaceMemberGuard } from '../workspaces/guards/workspace-member.guard';
import { TaskAttachmentsService } from './task-attachments.service';

@Controller('tasks/:taskId/attachments')
@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
export class TaskAttachmentsController {
  constructor(private readonly taskAttachmentsService: TaskAttachmentsService) {}

  @Get()
  listAttachments(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('taskId') taskId: string,
  ): Promise<TaskAttachmentDto[]> {
    return this.taskAttachmentsService.listForTask(
      context.workspace.id,
      taskId,
      context.user.id,
    );
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  uploadAttachment(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('taskId') taskId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<TaskAttachmentDto[]> {
    return this.taskAttachmentsService.uploadForTask(context, taskId, file);
  }

  @Get(':attachmentId/file')
  async downloadAttachment(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('taskId') taskId: string,
    @Param('attachmentId') attachmentId: string,
    @Res() response: Response,
  ): Promise<void> {
    const { attachment, absolutePath } =
      await this.taskAttachmentsService.getAttachmentFile(
        context.workspace.id,
        taskId,
        attachmentId,
        context.user.id,
      );
    response.setHeader('Content-Type', attachment.mimeType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(attachment.fileName)}"`,
    );
    createReadStream(absolutePath).pipe(response);
  }

  @Delete(':attachmentId')
  deleteAttachment(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('taskId') taskId: string,
    @Param('attachmentId') attachmentId: string,
  ): Promise<TaskAttachmentDto[]> {
    return this.taskAttachmentsService.deleteForTask(
      context,
      taskId,
      attachmentId,
    );
  }
}
