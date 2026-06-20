import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { User } from '../auth/entities/user.entity';
import { Comment } from '../comments/entities/comment.entity';
import { ActivityEventsService } from '../notifications/activity-events.service';
import { ActivityEventType } from '../notifications/entities/activity-event.entity';
import { ProjectMember } from '../projects/entities/project-member.entity';
import { Section } from '../projects/entities/section.entity';
import { TaskMembership } from '../tasks/entities/task-membership.entity';
import { Task } from '../tasks/entities/task.entity';
import { WorkspaceMember } from '../workspaces/entities/workspace-member.entity';
import type { AutomationJobPayload } from './automation-job.types';
import {
  AutomationActionType,
  AutomationRule,
} from './entities/automation-rule.entity';

@Injectable()
export class AutomationExecutorService {
  constructor(private readonly activityEventsService: ActivityEventsService) {}

  async executeRule(
    entityManager: EntityManager,
    rule: AutomationRule,
    payload: AutomationJobPayload,
  ): Promise<void> {
    switch (rule.actionType) {
      case AutomationActionType.ASSIGN_USER:
        await this.executeAssignUser(entityManager, rule, payload);
        return;
      case AutomationActionType.MOVE_TO_SECTION:
        await this.executeMoveToSection(entityManager, rule, payload);
        return;
      case AutomationActionType.ADD_COMMENT:
        await this.executeAddComment(entityManager, rule, payload);
        return;
      case AutomationActionType.SEND_INBOX_NOTIFICATION:
        await this.executeSendInboxNotification(entityManager, rule, payload);
        return;
      default:
        throw new BadRequestException('Acción de automatización no soportada');
    }
  }

  private async executeAssignUser(
    entityManager: EntityManager,
    rule: AutomationRule,
    payload: AutomationJobPayload,
  ): Promise<void> {
    const userId = this.readString(rule.actionConfig, 'userId');
    await this.assertProjectMember(entityManager, payload.projectId, userId);
    const task = await this.findTask(entityManager, payload);
    const assignee = await entityManager.findOneOrFail(User, { id: userId });
    task.assignee = assignee;
    await entityManager.flush();
  }

  private async executeMoveToSection(
    entityManager: EntityManager,
    rule: AutomationRule,
    payload: AutomationJobPayload,
  ): Promise<void> {
    const sectionId = this.readString(rule.actionConfig, 'sectionId');
    const section = await entityManager.findOne(Section, {
      id: sectionId,
      project: payload.projectId,
    });
    if (!section) {
      throw new NotFoundException('Sección no encontrada');
    }
    const membership = await entityManager.findOne(TaskMembership, {
      task: payload.taskId,
      project: payload.projectId,
      workspace: payload.workspaceId,
    });
    if (!membership) {
      throw new NotFoundException('La tarea no pertenece a este proyecto');
    }
    membership.section = section;
    await entityManager.flush();
  }

  private async executeAddComment(
    entityManager: EntityManager,
    rule: AutomationRule,
    payload: AutomationJobPayload,
  ): Promise<void> {
    const body = this.readString(rule.actionConfig, 'body');
    const task = await this.findTask(entityManager, payload);
    const author = await entityManager.findOneOrFail(User, {
      id: rule.createdBy.id,
    });
    const comment = entityManager.create(Comment, {
      workspace: task.workspace,
      task,
      author,
      body,
    });
    await entityManager.flush();
    void comment;
  }

  private async executeSendInboxNotification(
    entityManager: EntityManager,
    rule: AutomationRule,
    payload: AutomationJobPayload,
  ): Promise<void> {
    const recipientUserId = this.readString(rule.actionConfig, 'recipientUserId');
    const message = this.readString(rule.actionConfig, 'message');
    await this.assertWorkspaceMember(
      entityManager,
      payload.workspaceId,
      recipientUserId,
    );
    await this.activityEventsService.createEvent({
      workspaceId: payload.workspaceId,
      recipientUserId,
      actorUserId: rule.createdBy.id,
      type: ActivityEventType.AUTOMATION_NOTIFICATION,
      payload: {
        taskId: payload.taskId,
        taskName: payload.taskName,
        projectId: payload.projectId,
        projectName: payload.projectName,
        message,
        ruleId: rule.id,
        ruleName: rule.name,
      },
    });
    void entityManager;
  }

  private async findTask(
    entityManager: EntityManager,
    payload: AutomationJobPayload,
  ): Promise<Task> {
    const task = await entityManager.findOne(Task, {
      id: payload.taskId,
      workspace: payload.workspaceId,
    }, { populate: ['workspace'] });
    if (!task) {
      throw new NotFoundException('Tarea no encontrada');
    }
    return task;
  }

  private async assertProjectMember(
    entityManager: EntityManager,
    projectId: string,
    userId: string,
  ): Promise<void> {
    const member = await entityManager.findOne(ProjectMember, {
      project: projectId,
      user: userId,
    });
    if (!member) {
      throw new BadRequestException('El usuario no pertenece al proyecto');
    }
  }

  private async assertWorkspaceMember(
    entityManager: EntityManager,
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    const member = await entityManager.findOne(WorkspaceMember, {
      workspace: workspaceId,
      user: userId,
    });
    if (!member) {
      throw new BadRequestException('El destinatario no pertenece al workspace');
    }
  }

  private readString(config: Record<string, unknown>, key: string): string {
    const value = config[key];
    if (typeof value !== 'string' || value.length === 0) {
      throw new BadRequestException(`actionConfig.${key} inválido`);
    }
    return value;
  }
}
