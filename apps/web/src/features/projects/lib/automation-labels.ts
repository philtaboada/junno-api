import type { AutomationActionType, AutomationTriggerType } from '@pm/contracts';

export const AUTOMATION_TRIGGER_LABELS: Record<AutomationTriggerType, string> = {
  task_completed: 'Tarea completada',
  task_assigned: 'Tarea asignada',
  task_due_changed: 'Fecha de vencimiento cambiada',
};

export const AUTOMATION_ACTION_LABELS: Record<AutomationActionType, string> = {
  assign_user: 'Asignar usuario',
  move_to_section: 'Mover a sección',
  add_comment: 'Añadir comentario',
  send_inbox_notification: 'Enviar notificación a bandeja',
};

export function describeAutomationRule(
  triggerType: AutomationTriggerType,
  actionType: AutomationActionType,
): string {
  return `${AUTOMATION_TRIGGER_LABELS[triggerType]} → ${AUTOMATION_ACTION_LABELS[actionType]}`;
}
