'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Settings } from 'lucide-react';
import { AppMark } from '@/components/brand/app-mark';
import { useAuthStore } from '@/features/auth/hooks/use-auth';
import { mainNavItems } from '@/features/shell/config/nav-items';
import { useInboxUnreadCount } from '@/features/inbox/hooks/use-inbox-unread-count';
import { getUserInitials } from '@/features/shell/lib/user-initials';
import { logoutUser } from '@/lib/api/client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { WorkspaceSwitcher } from './workspace-switcher';

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const inboxUnreadCount = useInboxUnreadCount();

  async function handleLogout(): Promise<void> {
    await logoutUser();
    router.replace('/login');
  }

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="gap-3 overflow-hidden border-b border-sidebar-border p-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-2">
        <AppMark compact />
        <div className="group-data-[collapsible=icon]:hidden">
          <WorkspaceSwitcher />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={item.disabled ? undefined : <Link href={item.href} />}
                    isActive={pathname === item.href}
                    disabled={item.disabled}
                    tooltip={item.title}
                  >
                    <item.icon className="text-brand-indigo" />
                    <span className="flex min-w-0 flex-1 items-center gap-2">
                      <span className="truncate">{item.title}</span>
                      {item.href === '/inbox' && inboxUnreadCount > 0 ? (
                        <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-brand-coral px-1.5 py-0.5 text-[10px] font-semibold text-white group-data-[collapsible=icon]:hidden">
                          {inboxUnreadCount > 99 ? '99+' : inboxUnreadCount}
                        </span>
                      ) : null}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                className="h-auto w-full justify-start gap-2 px-2 py-2"
              />
            }
          >
            <Avatar size="sm">
              <AvatarFallback className="bg-brand-indigo-muted text-brand-indigo">
                {getUserInitials(user?.name ?? '?')}
              </AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1 text-left group-data-[collapsible=icon]:hidden">
              <span className="block truncate text-sm font-medium">{user?.name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {user?.email}
              </span>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Cuenta</DropdownMenuLabel>
              <DropdownMenuItem disabled>
                <Settings className="size-4" />
                Ajustes
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem variant="destructive" onClick={() => void handleLogout()}>
                <LogOut className="size-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
