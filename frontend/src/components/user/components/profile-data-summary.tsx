import { memo, useMemo, useState, type ComponentType } from 'react';
import { ChevronDown, ChevronUp, Database, Dumbbell, Moon } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { Card } from '@/components/ui/card';
import { DataTable, type DataTableFeatures } from '@/components/ui/data-table';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { DateFilter } from '@/components/ui/date-filter';
import { Skeleton } from '@/components/ui/skeleton';
import { useClientPagination } from '@/hooks/use-client-pagination';
import { useUserDataSummary } from '@/hooks/api/use-health';
import { cn } from '@/lib/utils';
import { formatCompactNumber } from '@/lib/utils/format';
import type { DataSummaryParams, ProviderDataCount } from '@/lib/api/types';

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
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number;
  iconClass?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border/60 bg-card-elevated/50 p-5 transition-colors hover:border-border hover:bg-card-elevated/70">
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
          className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card-elevated/50 p-4 transition-colors duration-200 hover:bg-card-elevated/70"
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

// Record-type composition, colour-coded so each type reads at a glance and the
// legend matches the summary stat-card icons above (data points = indigo,
// workouts = emerald, sleep = violet).
const RECORD_SEGMENTS = [
  { key: 'data_points', label: 'data points', bar: 'bg-chart-1' },
  { key: 'workout_count', label: 'workouts', bar: 'bg-chart-4' },
  { key: 'sleep_count', label: 'sleep', bar: 'bg-chart-5' },
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
    <div className="rounded-xl border border-border/60 bg-card-elevated/50 transition-colors hover:border-border/80">
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
              {expanded
                ? 'Hide series'
                : `${seriesEntries.length} series types`}
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

interface WorkoutTypeRow {
  type: string;
  count: number;
}

const WORKOUT_TYPE_COLUMNS: ColumnDef<DataTableFeatures, WorkoutTypeRow>[] = [
  {
    id: 'type',
    header: 'Workout Type',
    cell: ({ row }) => (
      <span className="font-medium text-foreground">
        {formatSeriesType(row.original.type)}
      </span>
    ),
  },
  {
    id: 'records',
    header: () => <span className="block text-right">Records</span>,
    cell: ({ row }) => (
      <span className="block text-right tabular-nums text-muted-foreground">
        {formatCompactNumber(row.original.count)}
      </span>
    ),
  },
];

// Paginated table of workout types and their record counts, sorted by count.
function WorkoutTypesTable({ counts }: { counts: Record<string, number> }) {
  const [pageSize, setPageSize] = useState(WORKOUT_TYPES_PAGE_SIZES[0]);

  const rows = useMemo<WorkoutTypeRow[]>(
    () =>
      Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([type, count]) => ({ type, count })),
    [counts]
  );

  const { page, setPage, pageCount, total, pageItems } = useClientPagination(
    rows,
    pageSize
  );

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <DataTable
        columns={WORKOUT_TYPE_COLUMNS}
        data={pageItems}
        footer={
          <DataTablePagination
            page={page}
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
        }
      />
    </div>
  );
}

export function DataSummarySection({ userId }: DataSummarySectionProps) {
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
                iconClass="border-chart-1/30 bg-chart-1/10 text-chart-1"
              />
              <StatCard
                icon={Dumbbell}
                label="Workouts"
                value={data.total_workouts}
                iconClass="border-chart-4/30 bg-chart-4/10 text-chart-4"
              />
              <StatCard
                icon={Moon}
                label="Sleep Events"
                value={data.total_sleep_events}
                iconClass="border-chart-5/30 bg-chart-5/10 text-chart-5"
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
