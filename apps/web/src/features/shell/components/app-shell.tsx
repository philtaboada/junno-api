'use client';

import { AppHeader } from './app-header';
import { AppSidebar } from './app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-h-svh">
        <AppHeader />
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
