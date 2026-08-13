import { useEffect, useMemo, useState } from 'react';
import { format, startOfMonth, startOfWeek } from 'date-fns';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import {
  useSleepSessions,
  useSleepSummaries,
  useTimeSeries,
  useDeleteSleepSession,
  useUserDataSummary,
} from '@/hooks/api/use-health';
import { useCursorPagination } from '@/hooks/use-cursor-pagination';
import { usePeriodRange } from '@/hooks/use-date-range';
import type { PeriodValue } from '@/components/ui/date-range-selector';
import { Card } from '@/components/ui/card';
import { CursorPagination } from '@/components/common/cursor-pagination';
import { DataSourceInfo } from '@/components/common/data-source-info';
import { SectionHeader } from '@/components/common/section-header';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  formatDuration,
  formatMinutes,
  formatBedtime,
  parseApiDate,
} from '@/lib/utils/format';
import {
  calculateSleepStats,
  getSleepSessionDetailFields,
  getSleepStageData,
  SLEEP_STAGE_COLORS,
  SLEEP_STAGE_CHART_COLORS,
  SLEEP_STAGE_LABELS,
  type SleepStageKey,
} from '@/lib/utils/sleep';
import { prepareHrChartData } from '@/lib/utils/timeseries';
import { HR_CHART_CONFIG } from '@/lib/utils/chart-config';
import { cn } from '@/lib/utils';
import type { SleepSession, SleepStagesSummary } from '@/lib/api/types';
import { EventDeleteDialog } from '@/components/common/event-delete-dialog';

interface SleepSectionProps {
  userId: string;
  dateRange: PeriodValue;
}

const SESSIONS_PER_PAGE = 10;

// Indigo trend accent, tied to the "deep sleep" colour so the chart rhymes with
// the stage ramp instead of introducing a new hue. Theme-aware via the shared
// `--sleep-deep` variable.
const CHART_INK = 'hsl(var(--sleep-deep))';

type SleepMetricKey = 'efficiency' | 'duration';

const METRIC_OPTIONS: { value: SleepMetricKey; label: string }[] = [
  { value: 'duration', label: 'Duration' },
  { value: 'efficiency', label: 'Efficiency' },
];

// Sleep stages, bottom-to-top in the stacked duration bars.
const STAGE_KEYS = ['deep', 'rem', 'light', 'awake'] as const;

// Chart config drives the per-stage CSS colors (--color-deep …) and tooltip
// labels for the stacked duration view.
const STAGE_CHART_CONFIG = {
  deep: { label: SLEEP_STAGE_LABELS.deep, color: SLEEP_STAGE_CHART_COLORS.deep },
  rem: { label: SLEEP_STAGE_LABELS.rem, color: SLEEP_STAGE_CHART_COLORS.rem },
  light: {
    label: SLEEP_STAGE_LABELS.light,
    color: SLEEP_STAGE_CHART_COLORS.light,
  },
  awake: {
    label: SLEEP_STAGE_LABELS.awake,
    color: SLEEP_STAGE_CHART_COLORS.awake,
  },
};

// How the daily summaries are bucketed for the trend chart.
type Grouping = 'day' | 'week' | 'month';

const GROUPING_OPTIONS: { value: Grouping; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

// Neutral summary tile matching the dashboard / data-summary aesthetic:
// a label and a single big tabular number, no decorative color.
function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold leading-none tabular-nums text-foreground">
        {value}
      </p>
    </div>
  );
}

// Small reusable pill segmented control (used for both metric and grouping).
function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
            value === option.value
              ? 'bg-muted-foreground/30 text-foreground'
              : 'text-muted-foreground hover:text-foreground/90'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// Horizontal sleep-stage composition bar (deep → awake, monochrome ramp).
function SleepStagesBar({
  stages,
  className = '',
}: {
  stages: SleepStagesSummary | null;
  className?: string;
}) {
  const stageData = getSleepStageData(stages);

  if (stageData.length === 0) {
    return (
      <div className={cn('h-2 overflow-hidden rounded-full bg-muted', className)}>
        <div className="h-full w-full bg-muted-foreground/25" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex h-2 overflow-hidden rounded-full bg-muted',
        className
      )}
    >
      {stageData.map(
        (stage) =>
          stage.pct > 0 && (
            <Tooltip key={stage.key}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    stage.color,
                    'cursor-pointer transition-opacity hover:opacity-80'
                  )}
                  style={{ width: `${stage.pct}%` }}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {stage.label}: {formatMinutes(stage.minutes)} (
                  {Math.round(stage.pct)}%)
                </p>
              </TooltipContent>
            </Tooltip>
          )
      )}
    </div>
  );
}

// Sleep-stage composition: the ramped bar plus a labelled legend with minutes
// and share per stage. Shared by the summary (period average) and each
// expanded session (that single night).
function StageBreakdown({
  stages,
  title,
  className,
}: {
  stages: SleepStagesSummary | null;
  title?: string;
  className?: string;
}) {
  const rows = useMemo(() => {
    if (!stages) return [];
    const total = STAGE_KEYS.reduce(
      (sum, key) => sum + (stages[`${key}_minutes`] || 0),
      0
    );
    if (total <= 0) return [];
    return STAGE_KEYS.map((key) => {
      const minutes = stages[`${key}_minutes`] || 0;
      return { key, minutes, pct: (minutes / total) * 100 };
    });
  }, [stages]);

  if (rows.length === 0) return null;

  return (
    <div className={className}>
      {title && (
        <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h4>
      )}
      <SleepStagesBar stages={stages} className="h-2.5" />
      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 md:grid-cols-4">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center gap-2">
            <div
              className={cn(
                'h-2.5 w-2.5 shrink-0 rounded-sm',
                SLEEP_STAGE_COLORS[row.key]
              )}
            />
            <span className="text-xs text-foreground/90">
              {SLEEP_STAGE_LABELS[row.key]}
            </span>
            <span className="ml-auto text-xs tabular-nums text-muted-foreground">
              {formatMinutes(row.minutes)}
            </span>
            <span className="w-9 text-right text-xs tabular-nums text-foreground/80">
              {Math.round(row.pct)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Session row
// ---------------------------------------------------------------------------

function SleepSessionRow({
  session,
  userId,
}: {
  session: SleepSession;
  userId: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const deleteSleep = useDeleteSleepSession(userId);

  const { data: hrData, isLoading: hrLoading } = useTimeSeries(userId, {
    start_time: session.start_time,
    end_time: session.end_time,
    types: ['heart_rate'],
    resolution: '5min',
    limit: 100,
  });

  const hrChartData = useMemo(() => prepareHrChartData(hrData?.data), [hrData]);
  const detailFields = useMemo(
    () => getSleepSessionDetailFields(session),
    [session]
  );

  const asleep =
    session.sleep_duration_seconds !== null
      ? formatDuration(session.sleep_duration_seconds)
      : '—';
  const inBed = formatDuration(session.duration_seconds);
  const efficiency =
    session.efficiency_percent !== null
      ? `${Math.round(session.efficiency_percent)}% efficiency`
      : null;
  const bedtime = format(new Date(session.start_time), 'h:mm a');
  const wake = format(new Date(session.end_time), 'h:mm a');
  const secondary = [efficiency, `${inBed} in bed`].filter(Boolean).join(' · ');

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card/40 transition-colors hover:border-border/80">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3.5 text-left"
      >
        <div className="flex items-center gap-4">
          {/* Date */}
          <div className="w-24 shrink-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium text-foreground">
                {format(new Date(session.end_time), 'EEE, MMM d')}
              </p>
              {session.is_nap && (
                <span className="rounded border border-border/60 bg-muted px-1 py-0.5 text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                  Nap
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(session.end_time), 'yyyy')}
            </p>
          </div>

          {/* Duration headline + stage composition */}
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {asleep}
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  asleep
                </span>
              </span>
              <span className="truncate text-xs tabular-nums text-muted-foreground">
                {secondary}
              </span>
            </div>
            <SleepStagesBar stages={session.stages} />
          </div>

          {/* Bedtime → wake */}
          <div className="hidden w-24 shrink-0 text-right sm:block">
            <p className="text-sm tabular-nums text-foreground">{bedtime}</p>
            <p className="text-xs tabular-nums text-muted-foreground">
              → {wake}
            </p>
          </div>

          {isExpanded ? (
            <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
        </div>

        <DataSourceInfo source={session.source} className="mt-2.5" />
      </button>

      {isExpanded && (
        <div className="space-y-5 border-t border-border/60 px-4 pb-4 pt-4">
          {/* Sleep stages for this night */}
          <StageBreakdown stages={session.stages} title="Sleep Stages" />

          {/* Heart rate during sleep */}
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Heart Rate During Sleep
            </h4>
            {hrLoading ? (
              <div className="flex h-[160px] items-center justify-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
              </div>
            ) : hrChartData.length > 0 ? (
              <ChartContainer
                config={HR_CHART_CONFIG}
                className="h-[160px] w-full"
              >
                <LineChart
                  accessibilityLayer
                  data={hrChartData}
                  margin={{ left: 8, right: 8 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    interval="preserveStartEnd"
                    tick={{ fill: '#71717a', fontSize: 10 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fill: '#71717a', fontSize: 10 }}
                    domain={['dataMin - 5', 'dataMax + 5']}
                    width={35}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                  />
                  <Line
                    isAnimationActive={false}
                    dataKey="hr"
                    type="monotone"
                    stroke="var(--color-avgHr)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: 'var(--color-avgHr)' }}
                  />
                </LineChart>
              </ChartContainer>
            ) : (
              <p className="py-4 text-center text-xs text-muted-foreground">
                No heart rate data available for this session
              </p>
            )}
          </div>

          {/* Detail fields */}
          {detailFields.length > 0 && (
            <div className="grid grid-cols-1 gap-x-8 gap-y-1 border-t border-border/40 pt-3 sm:grid-cols-2">
              {detailFields.map((field) => (
                <div
                  key={field.label}
                  className="flex items-center justify-between py-1"
                >
                  <span className="text-sm text-muted-foreground">
                    {field.label}
                  </span>
                  <span className="text-sm font-medium tabular-nums text-foreground">
                    {field.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end border-t border-border/40 pt-3">
            <button
              onClick={() => setShowDelete(true)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-destructive-muted"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete sleep session
            </button>
          </div>
        </div>
      )}

      <EventDeleteDialog
        open={showDelete}
        title="Delete sleep session?"
        description="This sleep session and all associated data (stages, scores) will be permanently removed. This cannot be undone."
        isPending={deleteSleep.isPending}
        onClose={() => setShowDelete(false)}
        onConfirm={() =>
          deleteSleep.mutate(session.id, {
            onSuccess: () => setShowDelete(false),
          })
        }
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeletons
// ---------------------------------------------------------------------------

function SleepSummarySkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-border/60 bg-card/40 p-4"
          >
            <div className="h-3 w-20 animate-pulse rounded bg-muted/60" />
            <div className="mt-3 h-6 w-16 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="h-[200px] animate-pulse rounded-xl bg-muted/40" />
    </div>
  );
}

function SessionsListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-border/60 bg-card/40 px-4 py-3.5"
        >
          <div className="flex items-center gap-4">
            <div className="w-24 shrink-0 space-y-1.5">
              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
              <div className="h-3 w-10 animate-pulse rounded bg-muted/50" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-muted/50" />
              <div className="h-2 w-full animate-pulse rounded-full bg-muted" />
            </div>
            <div className="hidden w-24 shrink-0 space-y-1.5 sm:block">
              <div className="ml-auto h-4 w-14 animate-pulse rounded bg-muted" />
              <div className="ml-auto h-3 w-10 animate-pulse rounded bg-muted/50" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main section
// ---------------------------------------------------------------------------

export function SleepSection({ userId, dateRange }: SleepSectionProps) {
  const pagination = useCursorPagination();

  // Deduplicate sessions across providers (highest-priority source per night).
  const [deduplicate, setDeduplicate] = useState(true);
  const [selectedMetric, setSelectedMetric] =
    useState<SleepMetricKey>('duration');
  const [grouping, setGrouping] = useState<Grouping>('day');

  const { startIso, endIso } = usePeriodRange(dateRange);

  // Reset pagination when the date range changes so a stale cursor from a
  // previous window doesn't carry over into the new one.
  const { reset: resetPagination } = pagination;
  useEffect(() => {
    resetPagination();
  }, [dateRange, resetPagination]);

  // Summary stats (date-range filtered)
  const { data: sleepSummaries, isLoading: summaryLoading } = useSleepSummaries(
    userId,
    {
      start_date: startIso,
      end_date: endIso,
      limit: 100,
    }
  );

  // Paginated sessions (date-range filtered)
  const {
    data: sessionsData,
    isLoading: sessionsLoading,
    isFetching,
  } = useSleepSessions(userId, {
    start_date: startIso,
    end_date: endIso,
    limit: SESSIONS_PER_PAGE,
    cursor: pagination.currentCursor ?? undefined,
    filter_by_priority: deduplicate,
  });

  // Range-scoped total so the pagination can show "Page X of Y" (cursor
  // responses don't carry a count).
  const { data: rangeSummary } = useUserDataSummary(userId, {
    start_date: startIso,
    end_date: endIso,
  });

  // Toggling dedup changes the result set, so restart pagination from page 1.
  const handleDeduplicateChange = (checked: boolean) => {
    setDeduplicate(checked);
    pagination.reset();
  };

  const nextCursor = sessionsData?.pagination?.next_cursor ?? null;
  const hasNextPage = sessionsData?.pagination?.has_more ?? false;
  const handleNextPage = () => pagination.goToNextPage(nextCursor);
  const handlePrevPage = pagination.goToPrevPage;

  const stats = useMemo(
    () => calculateSleepStats(sleepSummaries?.data || []),
    [sleepSummaries]
  );

  const displayedSessions = sessionsData?.data || [];

  const metricLabel =
    METRIC_OPTIONS.find((m) => m.value === selectedMetric)?.label ?? 'Duration';

  // Chart data from summaries, bucketed by the selected grouping. Each row
  // carries the per-stage minutes (for the stacked duration view) and the
  // efficiency value. Day keeps each night; Week/Month average across the
  // nights in the bucket, so the stacked segments sum to the average total.
  const chartData = useMemo(() => {
    const points = (sleepSummaries?.data || []).map((s) => ({
      date: parseApiDate(s.date),
      deep: s.stages?.deep_minutes || 0,
      rem: s.stages?.rem_minutes || 0,
      light: s.stages?.light_minutes || 0,
      awake: s.stages?.awake_minutes || 0,
      value: s.efficiency_percent || 0,
    }));
    if (points.length === 0) return [];

    type Point = (typeof points)[number];
    const toRow = (label: string, items: Point[]) => {
      const avg = (select: (p: Point) => number) =>
        items.reduce((sum, p) => sum + select(p), 0) / items.length;
      return {
        label,
        deep: avg((p) => p.deep),
        rem: avg((p) => p.rem),
        light: avg((p) => p.light),
        awake: avg((p) => p.awake),
        value: avg((p) => p.value),
      };
    };

    if (grouping === 'day') {
      return points
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map((p) => toRow(format(p.date, 'MMM d'), [p]));
    }

    const bucketStart =
      grouping === 'week'
        ? (d: Date) => startOfWeek(d, { weekStartsOn: 1 })
        : (d: Date) => startOfMonth(d);
    const labelFormat = grouping === 'week' ? 'MMM d' : 'MMM yyyy';

    const buckets = new Map<number, { start: Date; items: Point[] }>();
    for (const p of points) {
      const start = bucketStart(p.date);
      const key = start.getTime();
      const existing = buckets.get(key);
      if (existing) existing.items.push(p);
      else buckets.set(key, { start, items: [p] });
    }

    return [...buckets.values()]
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .map((b) => toRow(format(b.start, labelFormat), b.items));
  }, [sleepSummaries, grouping]);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="overflow-hidden">
        <SectionHeader title="Sleep Summary" />

        <div className="p-6">
          {summaryLoading ? (
            <SleepSummarySkeleton />
          ) : !stats ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No sleep data in this period
            </p>
          ) : (
            <div className="space-y-6">
              {/* Key stats */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <SummaryStat
                  label="Nights Tracked"
                  value={String(stats.nightsTracked)}
                />
                <SummaryStat
                  label="Avg Duration"
                  value={formatMinutes(stats.avgDuration)}
                />
                <SummaryStat
                  label="Avg Efficiency"
                  value={
                    stats.avgEfficiency !== null
                      ? `${Math.round(stats.avgEfficiency)}%`
                      : '—'
                  }
                />
                <SummaryStat
                  label="Avg Bedtime"
                  value={formatBedtime(stats.avgBedtime)}
                />
              </div>

              {/* Trend */}
              {chartData.length >= 1 && (
                <div className="border-t border-border/60 pt-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Trend
                    </h4>
                    <div className="flex items-center gap-2">
                      <SegmentedToggle
                        options={GROUPING_OPTIONS}
                        value={grouping}
                        onChange={setGrouping}
                      />
                      <SegmentedToggle
                        options={METRIC_OPTIONS}
                        value={selectedMetric}
                        onChange={setSelectedMetric}
                      />
                    </div>
                  </div>
                  <ChartContainer
                    config={
                      selectedMetric === 'duration'
                        ? STAGE_CHART_CONFIG
                        : { value: { label: metricLabel, color: CHART_INK } }
                    }
                    className="h-[200px] w-full"
                  >
                    <BarChart accessibilityLayer data={chartData}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        interval="preserveStartEnd"
                        tick={{ fill: '#71717a', fontSize: 11 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tick={{ fill: '#71717a', fontSize: 11 }}
                        tickFormatter={(value) =>
                          selectedMetric === 'duration'
                            ? `${Math.round(value / 60)}h`
                            : `${value}%`
                        }
                        domain={
                          selectedMetric === 'efficiency' ? [0, 100] : undefined
                        }
                        width={40}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            labelFormatter={
                              selectedMetric === 'duration'
                                ? (label, payload) => {
                                    const total = (payload ?? []).reduce(
                                      (sum, p) => sum + (Number(p.value) || 0),
                                      0
                                    );
                                    return `${label} · ${formatMinutes(total)}`;
                                  }
                                : undefined
                            }
                            formatter={(value, name) =>
                              selectedMetric === 'duration' ? (
                                <div className="flex w-full items-center justify-between gap-4">
                                  <span className="flex items-center gap-1.5 text-muted-foreground">
                                    <span
                                      className="h-2.5 w-2.5 rounded-[2px]"
                                      style={{
                                        background:
                                          STAGE_CHART_CONFIG[
                                            name as SleepStageKey
                                          ]?.color,
                                      }}
                                    />
                                    {STAGE_CHART_CONFIG[name as SleepStageKey]
                                      ?.label ?? name}
                                  </span>
                                  <span className="font-mono font-medium tabular-nums text-foreground">
                                    {formatMinutes(Number(value))}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex w-full items-center justify-between gap-4">
                                  <span className="text-muted-foreground">
                                    {metricLabel}
                                  </span>
                                  <span className="font-mono font-medium tabular-nums text-foreground">
                                    {`${Math.round(Number(value))}%`}
                                  </span>
                                </div>
                              )
                            }
                          />
                        }
                      />
                      {selectedMetric === 'duration' ? (
                        STAGE_KEYS.map((stage, i) => (
                          <Bar
                            key={stage}
                            isAnimationActive={false}
                            dataKey={stage}
                            stackId="stages"
                            fill={`var(--color-${stage})`}
                            radius={
                              i === STAGE_KEYS.length - 1
                                ? [4, 4, 0, 0]
                                : undefined
                            }
                          />
                        ))
                      ) : (
                        <Bar
                          isAnimationActive={false}
                          dataKey="value"
                          fill="var(--color-value)"
                          radius={[4, 4, 0, 0]}
                        />
                      )}
                    </BarChart>
                  </ChartContainer>
                </div>
              )}

              {/* Average sleep stages */}
              {stats.stages && (
                <StageBreakdown
                  stages={stats.stages}
                  title="Average Sleep Stages"
                  className="border-t border-border/60 pt-5"
                />
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Sessions */}
      <Card className="overflow-hidden">
        <SectionHeader
          title="Sleep Sessions"
          rightContent={
            <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
              <Switch
                checked={deduplicate}
                onCheckedChange={handleDeduplicateChange}
                aria-label="Deduplicate sources"
              />
              Deduplicate sources
            </label>
          }
        />

        <div className="p-6">
          {sessionsLoading ? (
            <SessionsListSkeleton />
          ) : displayedSessions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No sleep sessions in this period
            </p>
          ) : (
            <div className="space-y-4">
              <div className="space-y-3">
                {displayedSessions.map((session) => (
                  <SleepSessionRow
                    key={session.id}
                    session={session}
                    userId={userId}
                  />
                ))}
              </div>

              <CursorPagination
                currentPage={pagination.currentPage}
                hasPrevPage={pagination.hasPrevPage}
                hasNextPage={hasNextPage}
                isFetching={isFetching}
                onPrevPage={handlePrevPage}
                onNextPage={handleNextPage}
                totalItems={rangeSummary?.total_sleep_events}
                pageSize={SESSIONS_PER_PAGE}
                itemLabel="sleep events"
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
