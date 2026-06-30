'use client';

import { Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type TaskBlockedBadgeProps = {
  isBlocked: boolean;
  className?: string;
};

export function TaskBlockedBadge({ isBlocked, className }: TaskBlockedBadgeProps) {
  if (!isBlocked) {
    return null;
  }
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center text-amber-600 dark:text-amber-400',
        className,
      )}
      title="Bloqueada por otra tarea"
      aria-label="Bloqueada por otra tarea"
    >
      <Link2 className="size-3.5" />
    </span>
  );
}
