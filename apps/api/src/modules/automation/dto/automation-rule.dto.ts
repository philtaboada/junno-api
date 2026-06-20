import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import type {
  AutomationActionType,
  AutomationTriggerType,
} from '@pm/contracts';

export class CreateAutomationRuleDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsEnum(['task_completed', 'task_assigned', 'task_due_changed'])
  triggerType!: AutomationTriggerType;

  @IsEnum([
    'assign_user',
    'move_to_section',
    'add_comment',
    'send_inbox_notification',
  ])
  actionType!: AutomationActionType;

  @IsObject()
  actionConfig!: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpdateAutomationRuleDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsEnum(['task_completed', 'task_assigned', 'task_due_changed'])
  triggerType?: AutomationTriggerType;

  @IsOptional()
  @IsEnum([
    'assign_user',
    'move_to_section',
    'add_comment',
    'send_inbox_notification',
  ])
  actionType?: AutomationActionType;

  @IsOptional()
  @IsObject()
  actionConfig?: Record<string, unknown>;
}
