import { useState, useEffect, useMemo, memo } from 'react';
import {
  Link as LinkIcon,
  Check,
  Pencil,
  Database,
  Dumbbell,
  Moon,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useUserConnections, useUserDataSummary } from '@/hooks/api/use-health';
import { useUser, useUpdateUser } from '@/hooks/api/use-users';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  formatDate,
  truncateId,
  formatCompactNumber,
} from '@/lib/utils/format';
import { copyToClipboard } from '@/lib/utils/clipboard';
import { cn } from '@/lib/utils';
import { DateFilter } from '@/components/ui/date-filter';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { ConnectionCard } from '@/components/user/connection-card';
import type { SyncStatusEvent, SyncRunSummary } from '@/lib/api';
import type { DataSummaryParams, ProviderDataCount } from '@/lib/api/types';
import { useSyncStatusStream, useSyncRuns } from '@/hooks/api/use-sync-status';

interface ProfileSectionProps {
  userId: string;
}

// Stable empty reference so cards for providers with no recent runs don't get a fresh [] each render.
const EMPTY_RUNS: SyncRunSummary[] = [];

export function ProfileSection({ userId }: ProfileSectionProps) {
  const { data: user, isLoading: userLoading } = useUser(userId);
  const { data: connections, isLoading: connectionsLoading } =
    useUserConnections(userId);
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();

  // Live sync stream – one SSE connection shared across all provider cards
  const { activeRuns } = useSyncStatusStream(userId);
  const { data: syncRuns } = useSyncRuns(userId, 30);

  // Group sync state by provider once per change instead of re-scanning for every card on every
  // render. The stable references let the memoized ConnectionCard skip re-renders for providers
  // whose data did not change (important during the SSE event stream).
  const activeSyncByProvider = useMemo(() => {
    const map = new Map<string, SyncStatusEvent>();
    for (const evt of activeRuns.values()) {
      if (!map.has(evt.provider)) map.set(evt.provider, evt);
    }
    return map;
  }, [activeRuns]);

  const recentRunsByProvider = useMemo(() => {
    const map = new Map<string, SyncRunSummary[]>();
    for (const run of syncRuns ?? []) {
      const existing = map.get(run.provider);
      if (existing) {
        if (existing.length < 10) existing.push(run);
      } else {
        map.set(run.provider, [run]);
      }
    }
    return map;
  }, [syncRuns]);

  const [copied, setCopied] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    external_user_id: '',
  });

  useEffect(() => {
    if (user) {
      setEditForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        external_user_id: user.external_user_id || '',
      });
    }
  }, [user]);

  const handleCopyUserId = () => {
    void copyToClipboard(userId, 'User ID copied to clipboard');
  };

  const handleCopyExternalUserId = () => {
    if (!user?.external_user_id) return;
    void copyToClipboard(
      user.external_user_id,
      'External User ID copied to clipboard'
    );
  };

  const handleCopyPairLink = async () => {
    const pairLink = `${window.location.origin}/users/${userId}/pair`;
    const success = await copyToClipboard(
      pairLink,
      'Pairing link copied to clipboard'
    );
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEditSubmit = () => {
    updateUser(
      {
        id: userId,
        data: {
          first_name: editForm.first_name || null,
          last_name: editForm.last_name || null,
          email: editForm.email || null,
          external_user_id: editForm.external_user_id || null,
        },
      },
      {
        onSuccess: () => {
          setIsEditDialogOpen(false);
        },
      }
    );
  };

  return (
    <>
      <div className="space-y-6">
        {/* User Information */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between">
            <h2 className="text-sm font-medium text-foreground">
              User Information
            </h2>
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          </div>
          <div className="p-6">
            {userLoading ? (
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="h-4 w-16 bg-muted/50 rounded animate-pulse" />
                  <div className="h-5 w-48 bg-muted rounded animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-16 bg-muted/50 rounded animate-pulse" />
                  <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">User ID</p>
                  <button
                    type="button"
                    onClick={handleCopyUserId}
                    title="Click to copy User ID"
                    className="cursor-pointer rounded bg-muted px-2 py-1 font-mono text-sm text-foreground/90 transition-colors hover:bg-muted-foreground/20"
                  >
                    {truncateId(user?.id ?? '')}
                  </button>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    External User ID
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyExternalUserId}
                    disabled={!user?.external_user_id}
                    title={
                      user?.external_user_id
                        ? 'Click to copy External User ID'
                        : undefined
                    }
                    className="cursor-pointer rounded bg-muted px-2 py-1 font-mono text-sm text-foreground/90 transition-colors hover:bg-muted-foreground/20 disabled:cursor-default disabled:hover:bg-muted"
                  >
                    {truncateId(user?.external_user_id ?? '')}
                  </button>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <p className="text-sm text-foreground/90">
                    {user?.email || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Created</p>
                  <p className="text-sm text-foreground/90">
                    {formatDate(user?.created_at)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Connected Providers */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-border/60">
            <h2 className="text-sm font-medium text-foreground">
              Connected Providers
            </h2>
            <p className="text-xs text-foreground/70 mt-1">
              Wearable devices and health platforms connected to this user
            </p>
          </div>
          <div className="p-6">
            {connectionsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="p-4 border border-border/60 rounded-lg space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-24 bg-muted rounded animate-pulse" />
                      <div className="h-5 w-16 bg-muted/50 rounded animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-40 bg-muted/50 rounded animate-pulse" />
                      <div className="h-4 w-36 bg-muted/50 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : connections && connections.length > 0 ? (
              <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(400px,1fr))]">
                {connections.map((connection) => (
                  <ConnectionCard
                    key={connection.id}
                    connection={connection}
                    activeSync={
                      activeSyncByProvider.get(connection.provider) ?? null
                    }
                    recentRuns={
                      recentRunsByProvider.get(connection.provider) ??
                      EMPTY_RUNS
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  No providers connected yet
                </p>
                <Button variant="outline" onClick={handleCopyPairLink}>
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-success-muted" />
                      Link Copied!
                    </>
                  ) : (
                    <>
                      <LinkIcon className="h-4 w-4" />
                      Copy Pairing Link
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Data Summary */}
        <DataSummarySection userId={userId} />
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent
          className="max-w-2xl"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name" className="text-foreground/90">
                  First Name
                </Label>
                <Input
                  id="first_name"
                  value={editForm.first_name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, first_name: e.target.value })
                  }
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name" className="text-foreground/90">
                  Last Name
                </Label>
                <Input
                  id="last_name"
                  value={editForm.last_name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, last_name: e.target.value })
                  }
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground/90">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm({ ...editForm, email: e.target.value })
                }
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="external_user_id" className="text-foreground/90">
                External User ID
              </Label>
              <Input
                id="external_user_id"
                value={editForm.external_user_id}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    external_user_id: e.target.value,
                  })
                }
                placeholder="external-123"
              />
              <p className="text-xs text-muted-foreground">
                Optional identifier from your system
              </p>
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={isUpdating}>
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ============================================================================
// Data Summary
// ============================================================================

// Rank accents for the top three entries (matches the dashboard metrics cards).
const RANK_COLORS = [
  'text-primary',
  'text-foreground-muted',
  'text-foreground-subtle',
];

interface DataSummarySectionProps {
  userId: string;
}

function formatSeriesType(code: string): string {
  return code.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatProvider(provider: string): string {
  return provider.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function StatCard({
  icon: Icon,
  label,
  value,
  iconClass,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  iconClass?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border/60 bg-card/40 p-5 transition-colors hover:border-border hover:bg-card/60">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-3xl font-bold leading-none tabular-nums text-foreground">
            {formatCompactNumber(value)}
          </p>
          <p className="mt-2 text-xs font-medium text-muted-foreground">
            {label}
          </p>
        </div>
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-transform group-hover:scale-105',
            iconClass ?? 'border-border/60 bg-muted/40 text-muted-foreground'
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

const TypeGrid = memo(function TypeGrid({
  counts,
  limit,
}: {
  counts: Record<string, number>;
  limit?: number;
}) {
  const displayed = useMemo(() => {
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return limit ? entries.slice(0, limit) : entries;
  }, [counts, limit]);

  if (displayed.length === 0) {
    return <p className="text-sm text-muted-foreground">No data points</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {displayed.map(([type, count], i) => (
        <div
          key={type}
          className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card/40 p-4 transition-colors duration-200 hover:bg-card/60"
        >
          <span
            className={cn(
              'font-mono text-[10px] font-semibold',
              RANK_COLORS[i] ?? RANK_COLORS[2]
            )}
          >
            #{i + 1}
          </span>
          <p className="text-2xl font-bold tabular-nums leading-none text-foreground">
            {formatCompactNumber(count)}
          </p>
          <p
            className="truncate text-xs text-muted-foreground"
            title={formatSeriesType(type)}
          >
            {formatSeriesType(type)}
          </p>
        </div>
      ))}
    </div>
  );
});

// Record-type composition, distinguished by ink weight rather than hue to stay
// within the neutral graphite palette. Order matches the summary stat cards.
const RECORD_SEGMENTS = [
  { key: 'data_points', label: 'data points', bar: 'bg-foreground/85' },
  { key: 'workout_count', label: 'workouts', bar: 'bg-foreground/55' },
  { key: 'sleep_count', label: 'sleep', bar: 'bg-foreground/30' },
] as const;

// One comparative row per provider: a share bar (this provider's slice of the
// user's total records) segmented by record type, with a self-labeling
// breakdown and optional series-type drill-down. Replaces the old accordion
// that hid three numbers behind a click and offered no cross-provider
// comparison.
const ProviderRow = memo(function ProviderRow({
  provider,
  grandTotal,
  isPrimary,
}: {
  provider: ProviderDataCount;
  grandTotal: number;
  isPrimary: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const segments = [
    provider.data_points,
    provider.workout_count,
    provider.sleep_count,
  ];
  const total = segments.reduce((a, b) => a + b, 0);
  const share = grandTotal > 0 ? (total / grandTotal) * 100 : 0;
  const seriesEntries = Object.entries(provider.series_counts);
  const hasSeries = seriesEntries.length > 0;

  return (
    <div className="rounded-xl border border-border/60 bg-card/40 transition-colors hover:border-border/80">
      <div className="px-4 py-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/40 text-[10px] font-bold text-foreground/70">
              {formatProvider(provider.provider).charAt(0)}
            </div>
            <span className="truncate text-sm font-medium text-foreground">
              {formatProvider(provider.provider)}
            </span>
            {isPrimary && (
              <span className="shrink-0 rounded-full border border-border/60 bg-muted/40 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                Primary
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-baseline gap-1.5">
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {formatCompactNumber(total)}
            </span>
            <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">
              {share.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Track = user's total records; fill = this provider, split by type. */}
        <div className="mt-2.5 flex h-2 w-full overflow-hidden rounded-full bg-muted/60">
          <div className="flex h-full" style={{ width: `${share}%` }}>
            {RECORD_SEGMENTS.map(({ key, bar }, i) =>
              segments[i] > 0 ? (
                <div
                  key={key}
                  className={bar}
                  style={{ width: `${(segments[i] / total) * 100}%` }}
                />
              ) : null
            )}
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          {RECORD_SEGMENTS.map(({ key, label, bar }, i) =>
            segments[i] > 0 ? (
              <span key={key} className="inline-flex items-center gap-1.5">
                <span className={cn('h-1.5 w-1.5 rounded-full', bar)} />
                <span className="tabular-nums text-foreground/80">
                  {formatCompactNumber(segments[i])}
                </span>
                {label}
              </span>
            ) : null
          )}
          {hasSeries && (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="ml-auto inline-flex items-center gap-1 transition-colors hover:text-foreground/90"
            >
              {expanded ? 'Hide series' : `${seriesEntries.length} series types`}
              {expanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
          )}
        </div>
      </div>

      {expanded && hasSeries && (
        <div className="border-t border-border/60 px-4 py-4">
          <TypeGrid counts={provider.series_counts} />
        </div>
      )}
    </div>
  );
});

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[72px] rounded-lg" />
        ))}
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-8" />
        ))}
      </div>
    </div>
  );
}

const WORKOUT_TYPES_PAGE_SIZES = [10, 25, 50, 100];

// Paginated table of workout types and their record counts, sorted by count.
function WorkoutTypesTable({ counts }: { counts: Record<string, number> }) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(WORKOUT_TYPES_PAGE_SIZES[0]);

  const rows = useMemo(
    () => Object.entries(counts).sort((a, b) => b[1] - a[1]),
    [counts]
  );

  const total = rows.length;
  const pageCount = Math.ceil(total / pageSize);
  // Clamp in case the underlying data shrank (e.g. the date filter changed).
  const currentPage = Math.min(page, Math.max(0, pageCount - 1));
  const start = currentPage * pageSize;
  const pageRows = rows.slice(start, start + pageSize);

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Workout Type</TableHead>
            <TableHead className="text-right">Records</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map(([type, count]) => (
            <TableRow key={type}>
              <TableCell className="font-medium text-foreground">
                {formatSeriesType(type)}
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {formatCompactNumber(count)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <DataTablePagination
        page={currentPage}
        pageCount={pageCount}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(0);
        }}
        pageSizeOptions={WORKOUT_TYPES_PAGE_SIZES}
        itemLabel="workout types"
      />
    </div>
  );
}

function DataSummarySection({ userId }: DataSummarySectionProps) {
  const [range, setRange] = useState<DataSummaryParams | undefined>(undefined);
  const { data, isLoading } = useUserDataSummary(userId, range);
  const [showAllTypes, setShowAllTypes] = useState(false);

  // Rank providers by total records so the comparison reads top-down, and keep
  // the grand total for each row's share calculation.
  const providers = useMemo(() => {
    const rows = (data?.by_provider ?? []).map((provider) => ({
      provider,
      total:
        provider.data_points + provider.workout_count + provider.sleep_count,
    }));
    rows.sort((a, b) => b.total - a.total);
    const grandTotal = rows.reduce((sum, r) => sum + r.total, 0);
    return { rows, grandTotal };
  }, [data?.by_provider]);

  const isEmpty =
    data &&
    data.total_data_points === 0 &&
    data.total_workouts === 0 &&
    data.total_sleep_events === 0;

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 px-6 py-4 border-b border-border/60">
        <div>
          <h2 className="text-sm font-medium text-foreground">Data Summary</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {range
              ? 'Health data collected in the selected period'
              : 'Overview of all health data collected for this user'}
          </p>
        </div>
        <DateFilter onChange={setRange} />
      </div>
      <div className="p-6">
        {isLoading ? (
          <LoadingSkeleton />
        ) : isEmpty ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {range
                ? 'No data in the selected period'
                : 'No data collected yet'}
            </p>
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard
                icon={Database}
                label="Data Points"
                value={data.total_data_points}
                iconClass="border-primary/30 bg-primary/10 text-primary-muted"
              />
              <StatCard
                icon={Dumbbell}
                label="Workouts"
                value={data.total_workouts}
                iconClass="border-secondary-muted/30 bg-secondary-muted/10 text-secondary-muted"
              />
              <StatCard
                icon={Moon}
                label="Sleep Events"
                value={data.total_sleep_events}
                iconClass="border-accent-muted/30 bg-accent-muted/10 text-accent-muted"
              />
            </div>

            {/* Series types */}
            {Object.keys(data.series_type_counts).length > 0 && (
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Series Types
                </h3>
                <TypeGrid
                  counts={data.series_type_counts}
                  limit={showAllTypes ? undefined : 8}
                />
                {Object.keys(data.series_type_counts).length > 8 && (
                  <button
                    type="button"
                    onClick={() => setShowAllTypes(!showAllTypes)}
                    className="mt-3 text-xs text-muted-foreground transition-colors hover:text-foreground/90"
                  >
                    {showAllTypes
                      ? 'Show less'
                      : `Show all ${Object.keys(data.series_type_counts).length} types`}
                  </button>
                )}
              </div>
            )}

            {/* Workout types */}
            {Object.keys(data.workout_type_counts).length > 0 && (
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Workout Types
                </h3>
                <WorkoutTypesTable counts={data.workout_type_counts} />
              </div>
            )}

            {/* Provider breakdown */}
            {providers.rows.length > 0 && (
              <div>
                <div className="mb-3 flex items-baseline justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    By Provider
                  </h3>
                  <span className="text-[11px] tabular-nums text-muted-foreground">
                    {providers.rows.length}{' '}
                    {providers.rows.length === 1 ? 'source' : 'sources'}
                  </span>
                </div>
                <div className="space-y-2">
                  {providers.rows.map((row, i) => (
                    <ProviderRow
                      key={row.provider.provider}
                      provider={row.provider}
                      grandTotal={providers.grandTotal}
                      isPrimary={i === 0 && providers.rows.length > 1}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
