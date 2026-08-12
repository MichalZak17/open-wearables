import { useState } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import {
  ChevronDown,
  ChevronsUpDown,
  ExternalLink,
  FileText,
  Home,
  LayoutGrid,
  LogOut,
  Moon,
  RefreshCw,
  Settings,
  Sun,
  Users,
  Webhook,
} from 'lucide-react';
import logo from '@/logo.svg';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/components/theme-provider';
import { ROUTES } from '@/lib/constants/routes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navigationGroups = [
  {
    label: 'Overview',
    items: [
      {
        title: 'Dashboard',
        url: ROUTES.dashboard,
        icon: Home,
      },
      {
        title: 'Users',
        url: ROUTES.users,
        icon: Users,
      },
    ],
  },
  {
    label: 'Manage',
    items: [
      {
        title: 'Webhooks',
        url: ROUTES.webhooks,
        icon: Webhook,
        badge: 'Beta',
      },
      {
        title: 'Syncs',
        url: ROUTES.syncs,
        icon: RefreshCw,
      },
      {
        title: 'Data Coverage',
        url: ROUTES.coverage,
        icon: LayoutGrid,
      },
    ],
  },
] as const;

const DOCUMENTATION_URL = 'https://openwearables.io/docs';

export function Sidebar() {
  const location = useLocation();
  const { logout, isLoggingOut, me } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
  const fullName = [me?.first_name, me?.last_name].filter(Boolean).join(' ');
  const displayName = fullName || me?.email || 'Your account';
  const isSettingsActive = location.pathname.startsWith(ROUTES.settings);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    () => new Set()
  );

  const toggleGroup = (label: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  return (
    <aside className="relative flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-20 items-center border-b border-sidebar-border px-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="group flex w-full items-center gap-3 rounded-xl p-2 text-left outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring data-[state=open]:bg-sidebar-accent"
              aria-label="Open account menu"
            >
              <span className="relative shrink-0">
                <span className="flex size-10 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black shadow-sm">
                  <img src={logo} alt="" className="size-full" />
                </span>
                <span
                  className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-sidebar bg-success"
                  aria-hidden="true"
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold tracking-tight text-sidebar-foreground">
                  Open Wearables
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {me?.email || 'Developer portal'}
                </span>
              </span>
              <ChevronsUpDown
                className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-sidebar-foreground"
                aria-hidden="true"
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="bottom"
            align="start"
            sideOffset={8}
            className="w-58 rounded-xl border-sidebar-border bg-popover p-1.5 shadow-xl"
          >
            <DropdownMenuLabel className="px-2 py-2 font-normal">
              <p className="truncate text-sm font-medium">{displayName}</p>
              {me?.email ? (
                <p className="truncate text-xs text-muted-foreground">
                  {me.email}
                </p>
              ) : null}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/70" />
            <DropdownMenuItem
              disabled={isLoggingOut}
              onSelect={() => logout()}
              className="rounded-lg py-2 text-destructive-muted focus:bg-destructive/10 focus:text-destructive"
            >
              {isLoggingOut ? (
                <RefreshCw className="animate-spin" aria-hidden="true" />
              ) : (
                <LogOut aria-hidden="true" />
              )}
              {isLoggingOut ? 'Logging out…' : 'Log out'}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/70" />
            <p className="px-2 py-1.5 text-[10px] text-muted-foreground/50">
              Open Wearables v{__APP_VERSION__}
            </p>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <nav
        className="flex-1 overflow-y-auto px-3 py-4"
        aria-label="Main navigation"
      >
        {navigationGroups.map((group, groupIndex) => {
          const isCollapsed = collapsedGroups.has(group.label);

          return (
            <div
              key={group.label}
              className={cn(
                groupIndex > 0 && 'mt-5 border-t border-sidebar-border pt-5'
              )}
            >
              <button
                type="button"
                onClick={() => toggleGroup(group.label)}
                aria-expanded={!isCollapsed}
                className="group/header mb-2 flex w-full items-center justify-between rounded-md px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70 outline-none transition-colors hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
              >
                <span>{group.label}</span>
                <ChevronDown
                  className={cn(
                    'size-3.5 text-muted-foreground/50 transition-transform duration-200 group-hover/header:text-sidebar-foreground',
                    isCollapsed && '-rotate-90'
                  )}
                  aria-hidden="true"
                />
              </button>
              <div className={cn('space-y-1', isCollapsed && 'hidden')}>
                {group.items.map((item) => {
                  const isActive = location.pathname.startsWith(item.url);

                  return (
                    <Link
                      key={item.title}
                      to={item.url}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
                      )}
                    >
                      <item.icon
                        className={cn(
                          'size-4 shrink-0 transition-colors',
                          isActive
                            ? 'text-sidebar-foreground'
                            : 'text-muted-foreground group-hover:text-sidebar-foreground'
                        )}
                        aria-hidden="true"
                      />
                      <span>{item.title}</span>
                      {'badge' in item ? (
                        <span className="ml-auto rounded-md bg-success/10 px-1.5 py-0.5 text-[10px] font-semibold text-success ring-1 ring-inset ring-success/20">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="space-y-1 p-3">
        <div className="flex items-center gap-1">
          <Link
            to={ROUTES.settings}
            aria-current={isSettingsActive ? 'page' : undefined}
            className={cn(
              'flex flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isSettingsActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
            )}
          >
            <Settings className="size-4" aria-hidden="true" />
            Settings
          </Link>
          <button
            type="button"
            aria-label={`Switch to ${nextTheme} theme`}
            title={`Switch to ${nextTheme} theme`}
            onClick={() => setTheme(nextTheme)}
            className="flex size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            {resolvedTheme === 'dark' ? (
              <Moon className="size-4" aria-hidden="true" />
            ) : (
              <Sun className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
        <a
          href={DOCUMENTATION_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
        >
          <FileText className="size-4" aria-hidden="true" />
          Documentation
          <ExternalLink
            className="ml-auto size-3.5 text-muted-foreground/70"
            aria-hidden="true"
          />
        </a>
      </div>
    </aside>
  );
}
