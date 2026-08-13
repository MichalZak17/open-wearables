import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { RefreshCw, History, Filter, X } from 'lucide-react';
import {
  useAllSyncRuns,
  type AllSyncRunsFilters,
} from '@/hooks/api/use-sync-status';
import { useOAuthProviders } from '@/hooks/api/use-oauth-providers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CursorPagination } from '@/components/common/cursor-pagination';
import { cn } from '@/lib/utils';
import {
  SOURCE_LABELS,
  RUN_STATUS_CLASSES,
  formatRunDuration,
  formatRelative,
} from '@/lib/utils/sync-format';
import { ROUTES } from '@/lib/constants/routes';
import type { SyncRunSummary } from '@/lib/api';

export const Route = createFileRoute('/_authenticated/syncs/')({
  component: SyncsPage,
});

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 50;
/** Must not exceed the backend's le= on GET /sync/runs. */
const MAX_ALL_RUNS_LIMIT = 10_000;

function SyncsPage() {
  const [filters, setFilters] = useState<AllSyncRunsFilters>({});
  const [userIdInput, setUserIdInput] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

  const { data: providerSettings } = useOAuthProviders();
  const providerOptions = useMemo(
    () => (providerSettings ?? []).map((p) => p.provider).sort(),
    [providerSettings]
  );

  const activeFilters = useMemo(() => {
    const f: AllSyncRunsFilters = { ...filters };
    if (userIdInput.trim()) f.user_id = userIdInput.trim();
    return f;
  }, [filters, userIdInput]);

  const {
    data: runs,
    isLoading,
    isFetching,
    refetch,
  } = useAllSyncRuns(
    activeFilters,
    Math.min(pageSize * (page + 1) + 1, MAX_ALL_RUNS_LIMIT)
  );

  const paginatedRuns = useMemo(() => {
    if (!runs) return [];
    return runs.slice(page * pageSize, (page + 1) * pageSize);
  }, [runs, page, pageSize]);

  const hasMore = (runs?.length ?? 0) > pageSize * (page + 1);

  const clearFilters = () => {
    setFilters({});
    setUserIdInput('');
    setPage(0);
  };

  const hasActiveFilters =
    !!userIdInput.trim() ||
    !!filters.provider ||
    !!filters.status ||
    !!filters.source;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium text-foreground">Syncs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor sync activity across all users and providers.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-2"
        >
          <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filter by user ID..."
          value={userIdInput}
          onChange={(e) => {
            setUserIdInput(e.target.value);
            setPage(0);
          }}
          className="h-8 w-72 border-border bg-input text-sm"
        />
        <FilterSelect
          value={filters.provider}
          placeholder="Provider"
          options={providerOptions}
          onChange={(v) => {
            setFilters((f) => ({ ...f, provider: v || undefined }));
            setPage(0);
          }}
        />
        <FilterSelect
          value={filters.status}
          placeholder="Status"
          options={['success', 'partial', 'failed', 'cancelled', 'in_progress']}
          onChange={(v) => {
            setFilters((f) => ({ ...f, status: v || undefined }));
            setPage(0);
          }}
        />
        <FilterSelect
          value={filters.source}
          placeholder="Source"
          options={[
            'pull',
            'webhook',
            'sdk',
            'backfill',
            'xml_import',
            'linked_account',
          ]}
          onChange={(v) => {
            setFilters((f) => ({ ...f, source: v || undefined }));
            setPage(0);
          }}
        />
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 gap-1 text-xs text-muted-foreground"
          >
            <X className="h-3 w-3" />
            Clear
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(0);
            }}
            className="h-8 rounded-md border border-border bg-input px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : paginatedRuns.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/20 p-12 text-center">
          <History className="mx-auto h-8 w-8 text-muted-foreground/40" />
          <p className="mt-2 text-sm text-muted-foreground">
            No sync activity found.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>User ID</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Items / Message</TableHead>
                  <TableHead>Last Update</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRuns.map((run) => (
                  <SyncRow key={run.run_id} run={run} />
                ))}
              </TableBody>
            </Table>
          </div>

          <CursorPagination
            currentPage={page + 1}
            hasPrevPage={page > 0}
            hasNextPage={hasMore}
            isFetching={isFetching}
            onPrevPage={() => setPage((p) => p - 1)}
            onNextPage={() => setPage((p) => p + 1)}
            itemLabel="runs"
          />
        </>
      )}
    </div>
  );
}

function SyncRow({ run }: { run: SyncRunSummary }) {
  const badgeClass =
    RUN_STATUS_CLASSES[run.status] ?? RUN_STATUS_CLASSES.in_progress;
  const sourceLabel = SOURCE_LABELS[run.source] ?? run.source;
  const shortUserId = run.user_id.slice(0, 8);

  return (
    <TableRow>
      <TableCell>
        <Link
          to={ROUTES.user}
          params={{ userId: run.user_id }}
          className="font-mono text-xs text-primary hover:underline"
        >
          {shortUserId}
          {run.user_id.length > 8 ? '…' : ''}
        </Link>
      </TableCell>
      <TableCell className="capitalize">{run.provider}</TableCell>
      <TableCell className="text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          {sourceLabel}
          {run.source === 'linked_account' && run.primary_user_id && (
            <Link
              to={ROUTES.user}
              params={{ userId: run.primary_user_id }}
              className="font-mono text-xs text-primary hover:underline"
            >
              {run.primary_user_id.slice(0, 8)}…
            </Link>
          )}
        </span>
      </TableCell>
      <TableCell>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-xs font-medium capitalize',
            badgeClass
          )}
        >
          {run.status.replace('_', ' ')}
        </span>
      </TableCell>
      <TableCell className="tabular-nums text-muted-foreground">
        {formatRunDuration(run.started_at, run.ended_at)}
      </TableCell>
      <TableCell className="max-w-xs text-muted-foreground">
        {run.items_processed !== null && (
          <div className="tabular-nums">
            {`${run.items_processed}${run.items_total !== null ? ` / ${run.items_total} items` : ' items'}`}
          </div>
        )}
        {run.message ? (
          <span className="block truncate text-xs text-muted-foreground/80">
            {run.message}
          </span>
        ) : (
          run.items_processed === null && '—'
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {formatRelative(run.last_update)}
      </TableCell>
    </TableRow>
  );
}

function FilterSelect({
  value,
  placeholder,
  options,
  onChange,
}: {
  value: string | undefined;
  placeholder: string;
  options: string[];
  onChange: (val: string) => void;
}) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 rounded-md border border-border bg-input px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt.replace('_', ' ')}
        </option>
      ))}
    </select>
  );
}
