import { useState } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import {
  ChevronsUpDown,
  ExternalLink,
  FileText,
  Home,
  LayoutGrid,
  LogOut,
  Menu,
  Moon,
  RefreshCw,
  Settings,
  Sun,
  Users,
  Webhook,
  X,
} from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { LogoMark } from '@/components/common/logo-mark';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useAuth } from '@/hooks/use-auth';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils';

const navigationGroups = [
  {
    label: 'Overview',
    items: [
      { title: 'Dashboard', url: ROUTES.dashboard, icon: Home },
      { title: 'Users', url: ROUTES.users, icon: Users },
    ],
  },
  {
    label: 'Manage',
    items: [
      { title: 'Webhooks', url: ROUTES.webhooks, icon: Webhook, badge: 'Beta' },
      { title: 'Syncs', url: ROUTES.syncs, icon: RefreshCw },
      { title: 'Data Coverage', url: ROUTES.coverage, icon: LayoutGrid },
    ],
  },
] as const;

const DOCUMENTATION_URL = 'https://openwearables.io/docs';

interface SidebarContentProps {
  email?: string;
  initial: string;
  isLoggingOut: boolean;
  onLogout: () => void;
  onNavigate?: () => void;
}

function isActiveRoute(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function SidebarContent({
  email,
  initial,
  isLoggingOut,
  onLogout,
  onNavigate,
}: SidebarContentProps) {
  const location = useLocation();
  const { resolvedTheme, setTheme } = useTheme();
  const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
  const isSettingsActive = isActiveRoute(location.pathname, ROUTES.settings);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-20 shrink-0 items-center gap-2 px-4">
        <Link
          to={ROUTES.dashboard}
          onClick={onNavigate}
          aria-label="Open Wearables dashboard"
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <LogoMark className="size-9 text-sidebar-foreground" />
          <span className="truncate text-lg font-bold tracking-tight text-sidebar-foreground">
            Open Wearables
          </span>
        </Link>

        {onNavigate ? (
          <SheetClose
            aria-label="Close navigation"
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            <X className="size-4" aria-hidden="true" />
          </SheetClose>
        ) : null}
      </div>

      <div className="mx-auto h-px w-3/5 shrink-0 bg-sidebar-border" />

      <nav
        className="min-h-0 flex-1 overflow-y-auto px-3 py-5"
        aria-label="Main navigation"
      >
        {navigationGroups.map((group, groupIndex) => (
          <div key={group.label} className={cn(groupIndex > 0 && 'mt-7')}>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
              {group.label}
            </p>

            <div className="space-y-1">
              {group.items.map((item) => {
                const active = isActiveRoute(location.pathname, item.url);
                const hasBadge = 'badge' in item;

                return (
                  <Link
                    key={item.title}
                    to={item.url}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'group relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                      active
                        ? 'bg-sidebar-accent font-semibold text-sidebar-foreground'
                        : 'font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'size-4 shrink-0',
                        active
                          ? 'text-sidebar-foreground'
                          : 'text-muted-foreground group-hover:text-sidebar-foreground'
                      )}
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    <span className="truncate">{item.title}</span>
                    {hasBadge ? (
                      <span className="ml-auto rounded-full border border-sidebar-border bg-sidebar-accent px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 px-3 py-3">
        <a
          href={DOCUMENTATION_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <FileText className="size-4" strokeWidth={1.75} aria-hidden="true" />
          <span>Documentation</span>
          <ExternalLink className="ml-auto size-3.5" aria-hidden="true" />
        </a>

        <div className="flex items-center">
          <Link
            to={ROUTES.settings}
            onClick={onNavigate}
            aria-current={isSettingsActive ? 'page' : undefined}
            className={cn(
              'flex h-10 flex-1 items-center gap-3 rounded-lg px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring',
              isSettingsActive
                ? 'bg-sidebar-accent font-semibold text-sidebar-foreground'
                : 'font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'
            )}
          >
            <Settings
              className="size-4"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <span>Settings</span>
          </Link>
          <button
            type="button"
            aria-label={`Switch to ${nextTheme} theme`}
            title={`Switch to ${nextTheme} theme`}
            onClick={() => setTheme(nextTheme)}
            className="flex size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            {resolvedTheme === 'dark' ? (
              <Moon className="size-4" aria-hidden="true" />
            ) : (
              <Sun className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Open account menu"
              className="group mt-1 flex h-12 w-full items-center gap-2.5 rounded-lg px-2 text-left outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring data-[state=open]:bg-sidebar-accent"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-sidebar-border bg-sidebar-accent text-[11px] font-semibold text-sidebar-foreground">
                {initial}
              </span>
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-sidebar-foreground">
                {email ?? 'Your account'}
              </span>
              <ChevronsUpDown
                className="size-3.5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="start"
            sideOffset={8}
            className="w-60 rounded-xl p-1.5"
          >
            <DropdownMenuItem
              disabled={isLoggingOut}
              onSelect={onLogout}
              className="rounded-lg py-2 text-destructive-muted focus:bg-destructive/10 focus:text-destructive"
            >
              {isLoggingOut ? (
                <RefreshCw className="animate-spin" aria-hidden="true" />
              ) : (
                <LogOut aria-hidden="true" />
              )}
              {isLoggingOut ? 'Logging out…' : 'Log out'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <p className="px-2 py-1.5 text-[10px] text-muted-foreground/60">
              Open Wearables v{__APP_VERSION__}
            </p>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function Sidebar() {
  const { logout, isLoggingOut, me } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const initial = (me?.email ?? '?').trim().charAt(0).toUpperCase() || '?';
  const sharedProps = {
    email: me?.email,
    initial,
    isLoggingOut,
    onLogout: logout,
  };

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border bg-sidebar px-4 text-sidebar-foreground md:hidden">
        <Link
          to={ROUTES.dashboard}
          aria-label="Open Wearables dashboard"
          className="flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <LogoMark className="size-8 text-sidebar-foreground" />
          <span className="text-base font-bold tracking-tight">
            Open Wearables
          </span>
        </Link>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Open navigation"
              className="flex size-9 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[17rem] gap-0 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
          >
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SidebarContent
              {...sharedProps}
              onNavigate={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </header>

      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:block">
        <SidebarContent {...sharedProps} />
      </aside>
    </>
  );
}
