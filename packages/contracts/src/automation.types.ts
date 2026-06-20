export type AutomationTriggerType =
  | 'task_completed'
  | 'task_assigned'
  | 'task_due_changed';

export type AutomationActionType =
  | 'assign_user'
  | 'move_to_section'
  | 'add_comment'
  | 'send_inbox_notification';

export type AutomationRunStatus = 'success' | 'failed' | 'skipped';

export interface AutomationAssignUserActionConfigDto {
  readonly userId: string;
}

export interface AutomationMoveToSectionActionConfigDto {
  readonly sectionId: string;
}

export interface AutomationAddCommentActionConfigDto {
  readonly body: string;
}

export interface AutomationSendInboxNotificationActionConfigDto {
  readonly recipientUserId: string;
  readonly message: string;
}

export type AutomationActionConfigDto =
  | AutomationAssignUserActionConfigDto
  | AutomationMoveToSectionActionConfigDto
  | AutomationAddCommentActionConfigDto
  | AutomationSendInboxNotificationActionConfigDto;

export interface AutomationRuleDto {
  readonly id: string;
  readonly projectId: string;
  readonly name: string;
  readonly enabled: boolean;
  readonly triggerType: AutomationTriggerType;
  readonly triggerConfig: Record<string, unknown>;
  readonly actionType: AutomationActionType;
  readonly actionConfig: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AutomationRunDto {
  readonly id: string;
  readonly ruleId: string;
  readonly ruleName: string;
  readonly taskId: string | null;
  readonly status: AutomationRunStatus;
  readonly errorMessage: string | null;
  readonly createdAt: string;
  readonly completedAt: string | null;
}

export interface CreateAutomationRuleRequestDto {
  readonly name: string;
  readonly triggerType: AutomationTriggerType;
  readonly actionType: AutomationActionType;
  readonly actionConfig: Record<string, unknown>;
  readonly enabled?: boolean;
}

export interface UpdateAutomationRuleRequestDto {
  readonly name?: string;
  readonly enabled?: boolean;
  readonly triggerType?: AutomationTriggerType;
  readonly actionType?: AutomationActionType;
  readonly actionConfig?: Record<string, unknown>;
}
