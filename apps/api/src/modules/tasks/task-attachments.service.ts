import { mkdir, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import type { TaskAttachmentDto } from '@pm/contracts';
import { randomUUID } from 'crypto';
import type { WorkspaceContext } from '../auth/interfaces/jwt-payload.interface';
import { User } from '../auth/entities/user.entity';
import { Workspace } from '../workspaces/entities/workspace.entity';
import {
  ProjectAccessRole,
  ProjectMember,
} from '../projects/entities/project-member.entity';
import { TaskAttachment } from './entities/task-attachment.entity';
import { TaskMembership } from './entities/task-membership.entity';
import { Task } from './entities/task.entity';
import { isMissingUploadFile } from './task-attachment.utils';

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

@Injectable()
export class TaskAttachmentsService {
  private readonly uploadRoot: string;

  constructor(private readonly entityManager: EntityManager) {
    this.uploadRoot = process.env.UPLOAD_DIR ?? join(process.cwd(), 'uploads');
  }

  async listForTask(
    workspaceId: string,
    taskId: string,
    userId: string,
  ): Promise<TaskAttachmentDto[]> {
    await this.assertTaskViewerAccess(workspaceId, taskId, userId);
    const attachments = await this.entityManager.find(
      TaskAttachment,
      { task: taskId, workspace: workspaceId },
      { populate: ['uploadedBy'], orderBy: { createdAt: 'DESC' } },
    );
    return attachments.map((attachment) => this.toDto(attachment));
  }

  async uploadForTask(
    context: WorkspaceContext,
    taskId: string,
    file: Express.Multer.File,
  ): Promise<TaskAttachmentDto[]> {
    if (isMissingUploadFile(file)) {
      throw new BadRequestException('Archivo requerido');
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      throw new BadRequestException('El archivo supera el límite de 10 MB');
    }
    await this.assertTaskEditorAccess(
      context.workspace.id,
      taskId,
      context.user.id,
    );
    const task = await this.entityManager.findOneOrFail(Task, {
      id: taskId,
      workspace: context.workspace.id,
    });
    const uploader = await this.entityManager.findOneOrFail(User, {
      id: context.user.id,
    });
    const workspace = this.entityManager.getReference(Workspace, context.workspace.id);
    const sanitizedName = file.originalname.replace(/[^\w.\-() ]+/g, '_').trim();
    const storageKey = join(
      context.workspace.id,
      taskId,
      `${randomUUID()}-${sanitizedName || 'file'}`,
    );
    const absolutePath = join(this.uploadRoot, storageKey);
    await mkdir(join(this.uploadRoot, context.workspace.id, taskId), {
      recursive: true,
    });
    await writeFile(absolutePath, file.buffer);
    this.entityManager.create(TaskAttachment, {
      workspace,
      task,
      uploadedBy: uploader,
      fileName: sanitizedName || file.originalname,
      mimeType: file.size === 0 ? 'application/octet-stream' : file.mimetype,
      sizeBytes: BigInt(file.size),
      storageKey,
    });
    await this.entityManager.flush();
    return this.listForTask(context.workspace.id, taskId, context.user.id);
  }

  async deleteForTask(
    context: WorkspaceContext,
    taskId: string,
    attachmentId: string,
  ): Promise<TaskAttachmentDto[]> {
    await this.assertTaskEditorAccess(
      context.workspace.id,
      taskId,
      context.user.id,
    );
    const attachment = await this.entityManager.findOne(
      TaskAttachment,
      {
        id: attachmentId,
        task: taskId,
        workspace: context.workspace.id,
      },
      { populate: ['uploadedBy'] },
    );
    if (!attachment) {
      throw new NotFoundException('Adjunto no encontrado');
    }
    if (attachment.uploadedBy.id !== context.user.id) {
      throw new ForbiddenException('No puedes eliminar este adjunto');
    }
    const absolutePath = join(this.uploadRoot, attachment.storageKey);
    this.entityManager.remove(attachment);
    await this.entityManager.flush();
    await unlink(absolutePath).catch(() => undefined);
    return this.listForTask(context.workspace.id, taskId, context.user.id);
  }

  async getAttachmentFile(
    workspaceId: string,
    taskId: string,
    attachmentId: string,
    userId: string,
  ): Promise<{ attachment: TaskAttachment; absolutePath: string }> {
    await this.assertTaskViewerAccess(workspaceId, taskId, userId);
    const attachment = await this.entityManager.findOne(TaskAttachment, {
      id: attachmentId,
      task: taskId,
      workspace: workspaceId,
    });
    if (!attachment) {
      throw new NotFoundException('Adjunto no encontrado');
    }
    return {
      attachment,
      absolutePath: join(this.uploadRoot, attachment.storageKey),
    };
  }

  async listDtosForTaskDetail(
    workspaceId: string,
    taskId: string,
  ): Promise<TaskAttachmentDto[]> {
    const attachments = await this.entityManager.find(
      TaskAttachment,
      { task: taskId, workspace: workspaceId },
      { populate: ['uploadedBy'], orderBy: { createdAt: 'DESC' } },
    );
    return attachments.map((attachment) => this.toDto(attachment));
  }

  private toDto(attachment: TaskAttachment): TaskAttachmentDto {
    return {
      id: attachment.id,
      taskId: attachment.task.id,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      sizeBytes: Number(attachment.sizeBytes),
      uploadedByName: attachment.uploadedBy.name,
      createdAt: attachment.createdAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  private async assertTaskViewerAccess(
    workspaceId: string,
    taskId: string,
    userId: string,
  ): Promise<void> {
    await this.assertTaskAccess(workspaceId, taskId, userId, 'viewer');
  }

  private async assertTaskEditorAccess(
    workspaceId: string,
    taskId: string,
    userId: string,
  ): Promise<void> {
    await this.assertTaskAccess(workspaceId, taskId, userId, 'editor');
  }

  private async assertTaskAccess(
    workspaceId: string,
    taskId: string,
    userId: string,
    minimumRole: 'viewer' | 'editor',
  ): Promise<void> {
    const task = await this.entityManager.findOne(Task, {
      id: taskId,
      workspace: workspaceId,
    });
    if (!task) {
      throw new NotFoundException('Tarea no encontrada');
    }
    const memberships = await this.entityManager.find(
      TaskMembership,
      { task: taskId, workspace: workspaceId },
      { populate: ['project'] },
    );
    if (memberships.length === 0) {
      throw new NotFoundException('Tarea no encontrada');
    }
    const projectIds = memberships.map((membership) => membership.project.id);
    const projectMembers = await this.entityManager.find(ProjectMember, {
      project: { $in: projectIds },
      user: userId,
    });
    const hasAccess = projectMembers.some((member) =>
      minimumRole === 'editor'
        ? member.role === ProjectAccessRole.ADMIN ||
          member.role === ProjectAccessRole.EDITOR
        : true,
    );
    if (!hasAccess) {
      throw new ForbiddenException('No tienes permiso para acceder a esta tarea');
    }
  }
}
