import { ListTree } from 'lucide-react';

type TaskSubtaskCountBadgeProps = {
  count: number;
};

export function TaskSubtaskCountBadge({ count }: TaskSubtaskCountBadgeProps) {
  if (count < 1) {
    return null;
  }
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted/70 px-2 py-0.5 text-xs text-muted-foreground"
      title={`${count} subtarea${count === 1 ? '' : 's'} anidada${count === 1 ? '' : 's'}`}
    >
      <ListTree className="size-3" />
      {count}
    </span>
  );
}
