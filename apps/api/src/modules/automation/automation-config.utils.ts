import { BadRequestException } from '@nestjs/common';
import type {
  AutomationActionType,
  AutomationTriggerType,
} from '@pm/contracts';
import {
  AutomationActionType as EntityAutomationActionType,
  AutomationTriggerType as EntityAutomationTriggerType,
} from './entities/automation-rule.entity';

const TRIGGER_TYPES: readonly AutomationTriggerType[] = [
  'task_completed',
  'task_assigned',
  'task_due_changed',
];

const ACTION_TYPES: readonly AutomationActionType[] = [
  'assign_user',
  'move_to_section',
  'add_comment',
  'send_inbox_notification',
];

export function assertAutomationTriggerType(
  value: string,
): AutomationTriggerType {
  if (!TRIGGER_TYPES.includes(value as AutomationTriggerType)) {
    throw new BadRequestException('Tipo de trigger no válido');
  }
  return value as AutomationTriggerType;
}

export function assertAutomationActionType(value: string): AutomationActionType {
  if (!ACTION_TYPES.includes(value as AutomationActionType)) {
    throw new BadRequestException('Tipo de acción no válido');
  }
  return value as AutomationActionType;
}

export function toEntityTriggerType(
  value: AutomationTriggerType,
): EntityAutomationTriggerType {
  return value as EntityAutomationTriggerType;
}

export function toEntityActionType(
  value: AutomationActionType,
): EntityAutomationActionType {
  return value as EntityAutomationActionType;
}

export function validateAutomationActionConfig(
  actionType: AutomationActionType,
  actionConfig: Record<string, unknown>,
): Record<string, unknown> {
  switch (actionType) {
    case 'assign_user': {
      const userId = readRequiredString(actionConfig, 'userId');
      return { userId };
    }
    case 'move_to_section': {
      const sectionId = readRequiredString(actionConfig, 'sectionId');
      return { sectionId };
    }
    case 'add_comment': {
      const body = readRequiredString(actionConfig, 'body').trim();
      if (body.length < 1) {
        throw new BadRequestException('El comentario no puede estar vacío');
      }
      return { body };
    }
    case 'send_inbox_notification': {
      const recipientUserId = readRequiredString(actionConfig, 'recipientUserId');
      const message = readRequiredString(actionConfig, 'message').trim();
      if (message.length < 1) {
        throw new BadRequestException('El mensaje no puede estar vacío');
      }
      return { recipientUserId, message };
    }
    default:
      throw new BadRequestException('Tipo de acción no válido');
  }
}

function readRequiredString(
  config: Record<string, unknown>,
  key: string,
): string {
  const value = config[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new BadRequestException(`actionConfig.${key} es obligatorio`);
  }
  return value.trim();
}
