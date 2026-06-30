'use client';

import { InboxView } from '@/features/inbox/components/inbox-view';

export default function InboxPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <p className="text-sm text-muted-foreground">Bandeja</p>
        <h1 className="text-3xl font-semibold tracking-tight">Bandeja</h1>
        <p className="mt-2 text-muted-foreground">
          Notificaciones y actividad que requieren tu atención.
        </p>
      </div>
      <InboxView />
    </div>
  );
}
