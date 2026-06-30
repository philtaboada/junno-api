'use client';

import { MyTasksView } from '@/features/tasks/components/my-tasks-view';

export default function MyTasksPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <p className="text-sm text-muted-foreground">Mis tareas</p>
        <h1 className="text-3xl font-semibold tracking-tight">Mis tareas</h1>
        <p className="mt-2 text-muted-foreground">
          Organiza tu trabajo por hoy, próximas fechas y más tarde.
        </p>
      </div>
      <MyTasksView />
    </div>
  );
}
