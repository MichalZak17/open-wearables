import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import {
  ChevronsUpDown,
  ExternalLink,
  FileText,
  Home,
  LayoutGrid,
  Loader2,
  LogOut,
  Moon,
  RefreshCw,
  Search,
  Settings,
  Sun,
  UserRound,
  Users,
  Webhook,
} from 'lucide-react';
import logo from '@/logo.svg';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useUsers } from '@/hooks/api/use-users';
import { useTheme } from '@/components/theme-provider';
import { ROUTES } from '@/lib/constants/routes';
import type { UserRead } from '@/lib/api/types';
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
const SEARCH_DEBOUNCE_MS = 300;
const MINIMUM_SEARCH_LENGTH = 2;
const SEARCH_RESULTS_ID = 'sidebar-user-search-results';

function getUserName(user: UserRead): string {
  return [user.first_name, user.last_name].filter(Boolean).join(' ');
}

function getPrimaryUserLabel(user: UserRead): string {
  return (
    getUserName(user) || user.email || user.external_user_id || 'Unnamed user'
  );
}

function getSecondaryUserLabel(user: UserRead): string | null {
  const name = getUserName(user);

  if (name && user.email) return user.email;
  if (user.external_user_id) return user.external_user_id;
  return null;
}

function SidebarUserSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const normalizedQuery = query.trim();
  const canSearch = debouncedQuery.length >= MINIMUM_SEARCH_LENGTH;
  const { data, isFetching, isError } = useUsers(
    {
      page: 1,
      limit: 6,
      sort_by: 'created_at',
      sort_order: 'desc',
      search: debouncedQuery,
    },
    canSearch
  );
  const isWaitingForDebounce =
    normalizedQuery.length >= MINIMUM_SEARCH_LENGTH &&
    normalizedQuery !== debouncedQuery;
  const showResults = isOpen && normalizedQuery.length >= MINIMUM_SEARCH_LENGTH;
  const isLoading = isWaitingForDebounce || isFetching;
  const results = isLoading ? [] : (data?.items ?? []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(normalizedQuery);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [normalizedQuery]);

  const openUser = (userId: string) => {
    setQuery('');
    setDebouncedQuery('');
    setIsOpen(false);
    navigate({
      to: `${ROUTES.users}/$userId`,
      params: { userId },
    });
  };

  return (
    <div
      className="relative px-3 pb-2 pt-3"
      onFocus={() => setIsOpen(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <div className="relative">
        {isLoading ? (
          <Loader2
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-sidebar-primary"
            aria-hidden="true"
          />
        ) : (
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
        )}
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
            setIsOpen(true);
          }}
          onKeyDown={(event) => {
            if (!showResults || results.length === 0) return;

            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setActiveIndex((index) =>
                Math.min(index + 1, results.length - 1)
              );
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActiveIndex((index) => Math.max(index - 1, 0));
            } else if (event.key === 'Enter') {
              event.preventDefault();
              const selectedUser = results[activeIndex];
              if (selectedUser) openUser(selectedUser.id);
            } else if (event.key === 'Escape') {
              setIsOpen(false);
            }
          }}
          placeholder="Search users…"
          aria-label="Search users"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showResults}
          aria-controls={showResults ? SEARCH_RESULTS_ID : undefined}
          aria-activedescendant={
            showResults && results[activeIndex]
              ? `sidebar-user-result-${results[activeIndex].id}`
              : undefined
          }
          autoComplete="off"
          spellCheck={false}
          className="h-9 w-full rounded-lg border border-sidebar-border bg-sidebar-accent/60 py-1.5 pl-9 pr-3 text-sm text-sidebar-foreground outline-none transition-colors placeholder:text-muted-foreground hover:border-border-hover focus:border-sidebar-primary/50 focus:bg-sidebar-accent focus:ring-2 focus:ring-sidebar-ring/20"
        />
      </div>

      {showResults ? (
        <div
          id={SEARCH_RESULTS_ID}
          role="listbox"
          aria-label="User search results"
          className="absolute left-3 right-3 top-[calc(100%-0.5rem)] z-50 overflow-hidden rounded-xl border border-sidebar-border bg-popover p-1.5 shadow-2xl"
        >
          {isLoading ? (
            <p
              className="px-3 py-5 text-center text-xs text-muted-foreground"
              aria-live="polite"
            >
              Searching users…
            </p>
          ) : isError ? (
            <p
              className="px-3 py-5 text-center text-xs text-destructive-muted"
              role="alert"
            >
              User search is unavailable.
            </p>
          ) : results.length === 0 ? (
            <p
              className="px-3 py-5 text-center text-xs text-muted-foreground"
              aria-live="polite"
            >
              No users found for “{normalizedQuery}”.
            </p>
          ) : (
            results.map((user, index) => (
              <button
                key={user.id}
                id={`sidebar-user-result-${user.id}`}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => openUser(user.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left outline-none transition-colors',
                  index === activeIndex
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'
                )}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                  <UserRound className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-sidebar-foreground">
                    {getPrimaryUserLabel(user)}
                  </span>
                  {getSecondaryUserLabel(user) ? (
                    <span className="block truncate text-xs text-muted-foreground">
                      {getSecondaryUserLabel(user)}
                    </span>
                  ) : null}
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

export function Sidebar() {
  const location = useLocation();
  const { logout, isLoggingOut, me } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
  const fullName = [me?.first_name, me?.last_name].filter(Boolean).join(' ');
  const displayName = fullName || me?.email || 'Your account';
  const isSettingsActive = location.pathname.startsWith(ROUTES.settings);

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

      <SidebarUserSearch />

      <nav
        className="flex-1 overflow-y-auto px-3 py-4"
        aria-label="Main navigation"
      >
        {navigationGroups.map((group, groupIndex) => (
          <div
            key={group.label}
            className={cn(
              groupIndex > 0 && 'mt-5 border-t border-sidebar-border pt-5'
            )}
          >
            <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70">
              {group.label}
            </p>
            <div className="space-y-1">
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
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm ring-1 ring-sidebar-border'
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
        ))}
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
