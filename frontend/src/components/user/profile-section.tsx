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
  AlertTriangle,
  CheckCircle2,
  EllipsisVertical,
  History,
  Loader2,
  Link2,
  MinusCircle,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  Timer,
  Trash2,
  TriangleAlert,
  Unlink,
  XCircle,
  Zap,
} from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { formatDistanceToNow } from 'date-fns';
import {
  useUserConnections,
  useUserDataSummary,
  useDisconnectProvider,
  usePurgeProviderData,
  useSynchronizeDataFromProvider,
  useSyncHistoricalData,
  useGarminBackfillStatus,
  useGarminCancelBackfill,
  useRetryGarminBackfill,
} from '@/hooks/api/use-health';
import { useUser, useUpdateUser } from '@/hooks/api/use-users';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { providerLabel } from '@/components/common/source-badge';
import { API_CONFIG } from '@/lib/api/config';
import {
  STAGE_LABELS,
  SOURCE_LABELS,
  RUN_STATUS_CLASSES,
  formatRunDuration,
  formatRelative,
} from '@/lib/utils/sync-format';
import type { SyncStatusEvent, SyncRunSummary } from '@/lib/api';
import type {
  DataSummaryParams,
  ProviderDataCount,
  UserConnection,
} from '@/lib/api/types';
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

        {/* Connected Providers — a header with the provider cards standing on
            their own, rather than nested inside another panel. */}
        <section>
          <div className="mb-4">
            <h2 className="text-sm font-medium text-foreground">
              Connected Providers
            </h2>
            <p className="text-xs text-foreground/70 mt-1">
              Wearable devices and health platforms connected to this user
            </p>
          </div>
          {connectionsLoading ? (
            <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(400px,1fr))]">
              {[1, 2].map((i) => (
                <Card key={i} className="p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-24 bg-muted rounded animate-pulse" />
                    <div className="h-5 w-16 bg-muted/50 rounded animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-40 bg-muted/50 rounded animate-pulse" />
                    <div className="h-4 w-36 bg-muted/50 rounded animate-pulse" />
                  </div>
                </Card>
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
                    recentRunsByProvider.get(connection.provider) ?? EMPTY_RUNS
                  }
                />
              ))}
            </div>
          ) : (
            <Card className="flex flex-col items-center justify-center border-dashed py-10 text-center">
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
            </Card>
          )}
        </section>

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
// Connection Card
// ============================================================================

function SyncProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value * 100));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function ActiveSyncPanel({ event }: { event: SyncStatusEvent }) {
  const stageLabel = STAGE_LABELS[event.stage] ?? event.stage;
  const sourceLabel = SOURCE_LABELS[event.source] ?? event.source;
  const itemsLabel =
    event.items_total !== null && event.items_processed !== null
      ? `${event.items_processed} / ${event.items_total} items`
      : event.items_processed !== null
        ? `${event.items_processed} items`
        : null;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-blue-200/60 bg-gradient-to-r from-blue-50/80 to-indigo-50/40 p-3 dark:border-blue-900/40 dark:from-blue-950/40 dark:to-indigo-950/20">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
            {sourceLabel}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/60 dark:text-blue-200">
            {stageLabel}
          </span>
          {itemsLabel && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {itemsLabel}
            </span>
          )}
        </div>
      </div>
      {event.progress !== null && <SyncProgressBar value={event.progress} />}
      {event.message && (
        <p className="text-xs text-blue-700/70 dark:text-blue-300/70 line-clamp-1">
          {event.message}
        </p>
      )}
    </div>
  );
}

function SyncRunRow({ run }: { run: SyncRunSummary }) {
  const sourceLabel = SOURCE_LABELS[run.source] ?? run.source;
  const badgeClass =
    RUN_STATUS_CLASSES[run.status] ?? RUN_STATUS_CLASSES.in_progress;

  const isSuccess = run.status === 'success';
  const isPartial = run.status === 'partial';
  const isFailed = run.status === 'failed';
  const isCancelled = run.status === 'cancelled';
  const isSkipped = run.status === 'skipped';

  const Icon = isSuccess
    ? CheckCircle2
    : isPartial
      ? AlertTriangle
      : isFailed || isCancelled
        ? XCircle
        : isSkipped
          ? MinusCircle
          : PlayCircle;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-card/40 p-2.5">
      <div className="flex items-center gap-2 min-w-0">
        <Icon
          className={cn(
            'h-3.5 w-3.5 shrink-0',
            isSuccess && 'text-emerald-500',
            isPartial && 'text-amber-500',
            (isFailed || isCancelled) && 'text-rose-500',
            !isSuccess &&
              !isPartial &&
              !isFailed &&
              !isCancelled &&
              'text-muted-foreground'
          )}
        />
        <div className="flex flex-col min-w-0 gap-0.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>{sourceLabel}</span>
            {run.source === 'linked_account' && run.primary_user_id && (
              <>
                <span>·</span>
                <Link
                  to="/users/$userId"
                  params={{ userId: run.primary_user_id }}
                  className="font-mono text-blue-500 hover:text-blue-400 hover:underline transition-colors"
                >
                  {run.primary_user_id.slice(0, 8)}…
                </Link>
              </>
            )}
            <span>·</span>
            <span>{formatRelative(run.last_update)}</span>
            {run.started_at && run.ended_at && (
              <>
                <span>·</span>
                <span>{formatRunDuration(run.started_at, run.ended_at)}</span>
              </>
            )}
            {run.items_processed !== null && (
              <>
                <span>·</span>
                <span className="tabular-nums">
                  {run.items_processed}
                  {run.items_total !== null ? ` / ${run.items_total}` : ''}{' '}
                  items
                </span>
              </>
            )}
          </div>
          {run.error ? (
            <p className="text-xs text-rose-600 dark:text-rose-400 line-clamp-1">
              {run.error}
            </p>
          ) : (
            run.message && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {run.message}
              </p>
            )
          )}
        </div>
      </div>
      <span
        className={cn(
          'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize',
          badgeClass
        )}
      >
        {run.status.replace('_', ' ')}
      </span>
    </div>
  );
}

interface ConnectionCardProps {
  connection: UserConnection;
  className?: string;
  /** Currently active sync event for this provider (from SSE stream). */
  activeSync?: SyncStatusEvent | null;
  /** Recent completed sync runs for this provider. */
  recentRuns?: SyncRunSummary[];
}

// Format data type name for display (e.g., "bodyComps" -> "Body Comps")
function formatTypeName(typeName: string): string {
  return typeName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

// Parse scope string into individual scope items
// Handles both comma-separated (Strava) and space-separated (Whoop, Polar) formats
function parseScopeString(scope: string): string[] {
  return scope.split(/[,\s]+/).filter(Boolean);
}

// Shorten scope labels for inline display (e.g. ACTIVITY_EXPORT → Activity)
function formatScopeChip(scope: string): string {
  return scope
    .replace(/_(EXPORT|IMPORT|READ|WRITE)$/i, '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^./, (c) => c.toUpperCase());
}

function ConnectionCardComponent({
  connection,
  className,
  activeSync,
  recentRuns,
}: ConnectionCardProps) {
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [showDeleteDataDialog, setShowDeleteDataDialog] = useState(false);
  const [showLastSyncs, setShowLastSyncs] = useState(false);
  const [imageError, setImageError] = useState(false);

  const iconUrl = connection.icon_url
    ? new URL(connection.icon_url, API_CONFIG.baseUrl).toString()
    : null;
  const displayName = providerLabel(connection.provider);

  const { mutate: disconnectProvider, isPending: isDisconnecting } =
    useDisconnectProvider(connection.provider, connection.user_id);

  const { mutate: purgeProviderData, isPending: isPurgingData } =
    usePurgeProviderData(connection.provider, connection.user_id);

  const { mutate: synchronizeDataFromProvider, isPending: isSynchronizing } =
    useSynchronizeDataFromProvider(connection.provider, connection.user_id);

  // For Garmin, check backfill status (30-day webhook sync)
  const { data: backfillStatus } = useGarminBackfillStatus(
    connection.user_id,
    connection.provider === 'garmin'
  );

  const { mutate: cancelBackfill, isPending: isCancelling } =
    useGarminCancelBackfill(connection.user_id);

  const { mutate: retryBackfill, isPending: isRetrying } =
    useRetryGarminBackfill(connection.user_id);

  const { mutate: syncHistorical, isPending: isSyncingHistorical } =
    useSyncHistoricalData(connection.provider, connection.user_id);

  // Check if backfill is in progress (includes retry phase)
  const isBackfillInProgress =
    connection.provider === 'garmin' &&
    (backfillStatus?.overall_status === 'in_progress' ||
      backfillStatus?.overall_status === 'retry_in_progress');

  // Check if currently in retry phase
  const isRetryPhase =
    connection.provider === 'garmin' &&
    backfillStatus?.overall_status === 'retry_in_progress';

  // Check if backfill was cancelled
  const isBackfillCancelled =
    connection.provider === 'garmin' &&
    backfillStatus?.overall_status === 'cancelled';

  // Check if permanently failed
  const isPermanentlyFailed =
    connection.provider === 'garmin' &&
    backfillStatus?.permanently_failed === true;

  // Get timed-out types from summary
  const timedOutTypes = backfillStatus?.summary
    ? Object.entries(backfillStatus.summary)
        .filter(([, v]) => v.timed_out > 0)
        .map(([type, v]) => ({ type, timedOutCount: v.timed_out }))
    : [];

  // Parse scope items once for display
  const scopeItems = connection.scope ? parseScopeString(connection.scope) : [];

  // Get failed types from summary
  const failedTypes = backfillStatus?.summary
    ? Object.entries(backfillStatus.summary)
        .filter(([, v]) => v.failed > 0)
        .map(([type, v]) => ({ type, failedCount: v.failed }))
    : [];

  // Whether the card body has anything to render. When a connection is revoked
  // or expired, most sections are hidden — skip CardContent entirely so the card
  // doesn't leave empty padding below the header.
  const hasCardContent =
    (isBackfillInProgress && !!backfillStatus) ||
    isBackfillCancelled ||
    isPermanentlyFailed ||
    timedOutTypes.length > 0 ||
    failedTypes.length > 0 ||
    connection.status === 'active' ||
    !!activeSync ||
    (recentRuns?.length ?? 0) > 0;

  // Revoked/expired connections are de-emphasized so active ones stand out.
  const isInactive =
    connection.status === 'revoked' || connection.status === 'expired';

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Active
          </Badge>
        );
      case 'revoked':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Revoked
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <TriangleAlert className="h-3 w-3" />
            Expired
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card
      className={cn(
        'relative transition-all duration-200 hover:border-border hover:shadow-md',
        className
      )}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-white p-2 shadow-sm ring-1 ring-black/5">
              {/* White chip keeps dark provider logos legible in both themes. */}
              {iconUrl && !imageError ? (
                <img
                  src={iconUrl}
                  alt={`${displayName} logo`}
                  className="h-full w-full object-contain"
                  onError={() => setImageError(true)}
                />
              ) : (
                <span className="text-xl font-medium text-black">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h3
                className={cn(
                  'text-lg font-semibold',
                  isInactive ? 'text-muted-foreground' : 'text-card-foreground'
                )}
              >
                {displayName}
              </h3>
              <p className="mt-0.5 text-sm text-foreground/70">
                Last live sync:{' '}
                {connection.last_synced_at
                  ? formatDistanceToNow(new Date(connection.last_synced_at), {
                      addSuffix: true,
                    })
                  : 'Never'}
              </p>
              {(connection.live_sync_mode || scopeItems.length > 0) && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {connection.live_sync_mode &&
                    (connection.live_sync_mode === 'webhook' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <Zap className="h-3 w-3" />
                        Webhook
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground border border-border">
                        <Timer className="h-3 w-3" />
                        Periodic pull
                      </span>
                    ))}
                  {scopeItems.length > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-muted/60 text-muted-foreground border border-border/60 cursor-default hover:bg-muted hover:text-foreground hover:border-border transition-colors">
                          {scopeItems.length} scope
                          {scopeItems.length !== 1 ? 's' : ''}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        align="start"
                        sideOffset={6}
                        hideArrow
                        className="max-w-xs"
                      >
                        <p className="text-[10px] font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                          Granted permissions
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {scopeItems.map((s) => (
                            <span
                              key={s}
                              className="inline-flex px-1.5 py-0.5 rounded text-[11px] font-medium bg-muted text-foreground border border-border"
                            >
                              {formatScopeChip(s)}
                            </span>
                          ))}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {connection.status === 'active' &&
                    connection.provider_user_id &&
                    connection.linked_user_ids &&
                    connection.linked_user_ids.length > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 cursor-default">
                            <Link2 className="h-3 w-3" />
                            {connection.linked_user_ids.length} linked
                          </span>
                        </TooltipTrigger>
                        <TooltipContent
                          side="bottom"
                          align="start"
                          sideOffset={6}
                          hideArrow
                          className="max-w-xs"
                        >
                          <p className="text-[10px] font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                            Other linked OW accounts
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {connection.linked_user_ids.map((uid) => (
                              <Link
                                key={uid}
                                to="/users/$userId"
                                params={{ userId: uid }}
                                className="inline-flex px-1.5 py-0.5 rounded text-[11px] font-mono font-medium bg-muted text-foreground border border-border hover:bg-muted-foreground/20 hover:text-foreground transition-colors"
                              >
                                {uid.slice(0, 8)}
                              </Link>
                            ))}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {renderStatusBadge(connection.status)}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="p-0 h-8 w-8">
                  <EllipsisVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {connection.status !== 'revoked' && (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive cursor-pointer"
                    disabled={isDisconnecting}
                    onClick={() => setShowDisconnectDialog(true)}
                  >
                    <Unlink className="mr-2 h-4 w-4" />
                    Disconnect
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive cursor-pointer"
                  disabled={isPurgingData}
                  onClick={() => setShowDeleteDataDialog(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete all data
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialog
              open={showDisconnectDialog}
              onOpenChange={setShowDisconnectDialog}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Disconnect {displayName}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will revoke the connection. The user will need to
                    reconnect to {displayName} to resume data syncing.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => disconnectProvider()}>
                    Disconnect
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AlertDialog
              open={showDeleteDataDialog}
              onOpenChange={setShowDeleteDataDialog}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Delete all {displayName} data?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently deletes every record synced from{' '}
                    {displayName} for this user — activities, sleep, time series
                    and health scores — and revokes the connection. Data from
                    other providers is not affected. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => purgeProviderData()}
                  >
                    Delete all data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>

      {hasCardContent && (
        <CardContent className="space-y-4">
          {/* Show backfill progress for Garmin */}
          {isBackfillInProgress && backfillStatus && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  {isRetryPhase && backfillStatus.retry_type ? (
                    <span className="text-sm text-muted-foreground">
                      Retrying {formatTypeName(backfillStatus.retry_type)}{' '}
                      {backfillStatus.retry_window !== null && (
                        <span>
                          (window {backfillStatus.retry_window + 1})...
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Fetching historical data...{' '}
                      <span className="font-medium">
                        {backfillStatus.current_window} of{' '}
                        {backfillStatus.total_windows} windows complete
                      </span>
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => cancelBackfill()}
                  disabled={isCancelling}
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{
                    width: `${backfillStatus.total_windows > 0 ? (backfillStatus.current_window / backfillStatus.total_windows) * 100 : 0}%`,
                  }}
                />
              </div>
              {/* Attempt counter */}
              {backfillStatus.attempt_count > 0 && (
                <span className="text-xs text-muted-foreground">
                  Attempt {backfillStatus.attempt_count} of{' '}
                  {backfillStatus.max_attempts}
                </span>
              )}
            </div>
          )}

          {/* Show cancelled backfill status */}
          {isBackfillCancelled && (
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
              <XCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Backfill cancelled
              </span>
            </div>
          )}

          {/* Show permanently failed state */}
          {isPermanentlyFailed && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">
                Backfill failed after {backfillStatus?.max_attempts} attempts.
                Please disconnect and reconnect your Garmin.
              </span>
            </div>
          )}

          {/* Show timed-out backfill types with retry buttons (warning/amber styling) */}
          {timedOutTypes.length > 0 &&
            !isBackfillInProgress &&
            !isPermanentlyFailed && (
              <div className="space-y-2 p-3 bg-warning-muted/10 rounded-lg border border-warning-muted/20">
                <p className="text-sm font-medium text-warning-muted dark:text-warning-muted">
                  Some data types timed out:
                </p>
                <div className="space-y-1.5">
                  {timedOutTypes.map(({ type, timedOutCount }) => (
                    <div
                      key={type}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">
                          {formatTypeName(type)}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          Timed out in {timedOutCount} window
                          {timedOutCount > 1 ? 's' : ''}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs ml-2"
                        onClick={() => retryBackfill(type)}
                        disabled={isRetrying}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Retry
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Show failed types (error/destructive styling, no retry) */}
          {failedTypes.length > 0 &&
            !isBackfillInProgress &&
            !isPermanentlyFailed && (
              <div className="space-y-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                <p className="text-sm font-medium text-destructive">
                  Some data types failed:
                </p>
                <div className="space-y-1.5">
                  {failedTypes.map(({ type, failedCount }) => (
                    <div key={type} className="flex items-center text-sm">
                      <XCircle className="h-3 w-3 text-destructive mr-2" />
                      <span className="font-medium">
                        {formatTypeName(type)}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        Failed in {failedCount} window
                        {failedCount > 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Action buttons */}
          {connection.status === 'active' && (
            <div className="flex gap-2">
              {/* Provider with a hard history cap: single constrained button */}
              {connection.max_historical_days !== null &&
                connection.max_historical_days !== undefined &&
                !isBackfillInProgress &&
                !isPermanentlyFailed && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() =>
                      syncHistorical(connection.max_historical_days as number)
                    }
                    disabled={isSyncingHistorical}
                  >
                    {isSyncingHistorical ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <History className="h-4 w-4" />
                        Sync {connection.max_historical_days}-day History
                      </>
                    )}
                  </Button>
                )}

              {/* Unconstrained providers: Sync History dropdown + Force Live Sync */}
              {(connection.max_historical_days === null ||
                connection.max_historical_days === undefined) &&
                connection.rest_pull &&
                !isPermanentlyFailed && (
                  <>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          disabled={isSyncingHistorical}
                        >
                          {isSyncingHistorical ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Starting...
                            </>
                          ) : (
                            <>
                              <History className="h-4 w-4" />
                              Sync History
                              <ChevronDown className="h-3 w-3 ml-auto opacity-60" />
                            </>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => syncHistorical(7)}>
                          Last 7 days
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => syncHistorical(30)}>
                          Last 30 days
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => syncHistorical(90)}>
                          Last 3 months
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => syncHistorical(180)}>
                          Last 6 months
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => syncHistorical(365)}>
                          Last year
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {connection.live_sync_mode !== 'webhook' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => synchronizeDataFromProvider()}
                        disabled={isSynchronizing}
                      >
                        {isSynchronizing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Syncing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4" />
                            Force Live Sync
                          </>
                        )}
                      </Button>
                    )}
                  </>
                )}
            </div>
          )}

          {/* ── Active sync (live status from SSE) ─────────────────────── */}
          {activeSync && <ActiveSyncPanel event={activeSync} />}

          {/* ── Last syncs (collapsible) ────────────────────────────────── */}
          {recentRuns && recentRuns.length > 0 && (
            <div className="border-t pt-3 space-y-2">
              <button
                type="button"
                onClick={() => setShowLastSyncs((v) => !v)}
                className="flex w-full items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5" />
                  Last syncs ({recentRuns.length})
                </span>
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 transition-transform',
                    showLastSyncs && 'rotate-180'
                  )}
                />
              </button>
              {showLastSyncs && (
                <div className="flex flex-col gap-1.5">
                  {recentRuns.map((run) => (
                    <SyncRunRow key={run.run_id} run={run} />
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

const ConnectionCard = memo(ConnectionCardComponent);

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
