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
import { PageHeader } from '@/components/ui/page-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable, type DataTableFeatures } from '@/components/ui/data-table';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { useClientPagination } from '@/hooks/use-client-pagination';
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
/** Stable empty reference so useClientPagination doesn't reslice each render. */
const EMPTY_RUNS: SyncRunSummary[] = [];

function SyncsPage() {
  const [filters, setFilters] = useState<AllSyncRunsFilters>({});
  const [userIdInput, setUserIdInput] = useState('');
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

  // Fetch the full filtered set (bounded by the backend cap) so we know the
  // real total and can offer numbered pages, like the Users table. Cursor
  // responses carry no count, so paging one-ahead couldn't show "Page X of Y".
  const {
    data: runs,
    isLoading,
    isFetching,
    refetch,
  } = useAllSyncRuns(activeFilters, MAX_ALL_RUNS_LIMIT);

  const {
    page: safePage,
    setPage,
    pageCount,
    total,
    pageItems: paginatedRuns,
  } = useClientPagination(runs ?? EMPTY_RUNS, pageSize);

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
    <div className="space-y-6 p-6 md:p-8">
      <PageHeader
        title="Syncs"
        description="Monitor sync activity across all users and providers."
        action={
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={cn('h-4 w-4', isFetching && 'animate-spin')}
            />
            Refresh
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filter by user ID..."
          value={userIdInput}
          onChange={(e) => {
            setUserIdInput(e.target.value);
            setPage(0);
          }}
          className="h-9 w-72"
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
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              setPageSize(Number(v));
              setPage(0);
            }}
          >
            <SelectTrigger className="h-9 w-[76px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <DataTable
        card
        columns={SYNC_COLUMNS}
        data={paginatedRuns}
        isLoading={isLoading}
        emptyMessage={
          <div className="py-6">
            <History className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-2 text-sm text-muted-foreground">
              No sync activity found.
            </p>
          </div>
        }
        footer={
          <DataTablePagination
            page={safePage}
            pageCount={pageCount}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            itemLabel="runs"
          />
        }
      />
    </div>
  );
}

const SYNC_COLUMNS: ColumnDef<DataTableFeatures, SyncRunSummary>[] = [
  {
    id: 'user_id',
    header: 'User ID',
    cell: ({ row }) => (
      <Link
        to={ROUTES.user}
        params={{ userId: row.original.user_id }}
        className="font-mono text-xs text-primary hover:underline"
      >
        {row.original.user_id.slice(0, 8)}
        {row.original.user_id.length > 8 ? '…' : ''}
      </Link>
    ),
  },
  {
    id: 'provider',
    header: 'Provider',
    cell: ({ row }) => (
      <span className="capitalize">{row.original.provider}</span>
    ),
  },
  {
    id: 'source',
    header: 'Source',
    cell: ({ row }) => {
      const run = row.original;
      const sourceLabel = SOURCE_LABELS[run.source] ?? run.source;
      return (
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
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
      );
    },
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <span
        className={cn(
          'rounded-full px-2 py-0.5 text-xs font-medium capitalize',
          RUN_STATUS_CLASSES[row.original.status] ??
            RUN_STATUS_CLASSES.in_progress
        )}
      >
        {row.original.status.replace('_', ' ')}
      </span>
    ),
  },
  {
    id: 'duration',
    header: 'Duration',
    cell: ({ row }) => (
      <span className="tabular-nums text-muted-foreground">
        {formatRunDuration(row.original.started_at, row.original.ended_at)}
      </span>
    ),
  },
  {
    id: 'items',
    header: 'Items / Message',
    cell: ({ row }) => {
      const run = row.original;
      return (
        <div className="max-w-xs text-muted-foreground">
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
        </div>
      );
    },
  },
  {
    id: 'last_update',
    header: 'Last Update',
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {formatRelative(row.original.last_update)}
      </span>
    ),
  },
];

const ALL_VALUE = '__all__';

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
    <Select
      value={value ?? ''}
      onValueChange={(v) => onChange(v === ALL_VALUE ? '' : v)}
    >
      <SelectTrigger className="h-9 w-[140px] capitalize">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_VALUE}>
          All {placeholder.toLowerCase()}s
        </SelectItem>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt} className="capitalize">
            {opt.replace('_', ' ')}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
