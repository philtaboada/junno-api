import type {
  CustomFieldBreakdownWidgetDataDto,
  DashboardWidgetDto,
  OverdueCountWidgetDataDto,
  TasksByAssigneeWidgetDataDto,
} from '@pm/contracts';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type DashboardWidgetCardProps = {
  widget: DashboardWidgetDto;
  onDelete: (widgetId: string) => void;
  isDeleting: boolean;
};

export function DashboardWidgetCard({
  widget,
  onDelete,
  isDeleting,
}: DashboardWidgetCardProps) {
  return (
    <Card className="border-border/80 shadow-none">
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
        <CardTitle className="text-base">{widget.title}</CardTitle>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={isDeleting}
          onClick={() => onDelete(widget.id)}
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </CardHeader>
      <CardContent>{renderWidgetBody(widget)}</CardContent>
    </Card>
  );
}

function renderWidgetBody(widget: DashboardWidgetDto) {
  switch (widget.data.type) {
    case 'overdue_count':
      return <OverdueCountBody data={widget.data} />;
    case 'tasks_by_assignee':
      return <TasksByAssigneeBody data={widget.data} />;
    case 'custom_field_breakdown':
      return <CustomFieldBreakdownBody data={widget.data} />;
    default:
      return null;
  }
}

function OverdueCountBody({ data }: { data: OverdueCountWidgetDataDto }) {
  return (
    <div className="space-y-3">
      <p className="text-4xl font-semibold tracking-tight text-brand-coral">
        {data.overdueCount}
      </p>
      <p className="text-sm text-muted-foreground">
        de {data.openTasksCount} tareas abiertas están vencidas
      </p>
    </div>
  );
}

function TasksByAssigneeBody({ data }: { data: TasksByAssigneeWidgetDataDto }) {
  if (data.items.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay tareas abiertas.</p>;
  }
  const maxCount = Math.max(...data.items.map((item) => item.count), 1);
  return (
    <div className="space-y-3">
      {data.items.map((item) => (
        <div key={item.assigneeId ?? 'unassigned'} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="truncate">{item.assigneeName}</span>
            <span className="font-medium">{item.count}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-brand-indigo"
              style={{ width: `${(item.count / maxCount) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function CustomFieldBreakdownBody({ data }: { data: CustomFieldBreakdownWidgetDataDto }) {
  if (data.items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Sin valores para «{data.fieldName}» en tareas abiertas.
      </p>
    );
  }
  const maxCount = Math.max(...data.items.map((item) => item.count), 1);
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Campo: {data.fieldName}</p>
      {data.items.map((item) => (
        <div key={item.key} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="truncate">{item.label}</span>
            <span className="font-medium">{item.count}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-brand-indigo"
              style={{ width: `${(item.count / maxCount) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
