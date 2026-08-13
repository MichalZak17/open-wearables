import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import {
  ChevronDown,
  Dumbbell,
  Flame,
  MoveHorizontal,
  Timer,
  Trash2,
} from 'lucide-react';
import {
  useWorkouts,
  useTimeSeries,
  useDeleteWorkout,
  useUserDataSummary,
} from '@/hooks/api/use-health';
import { useCursorPagination } from '@/hooks/use-cursor-pagination';
import { usePeriodRange } from '@/hooks/use-date-range';
import type { PeriodValue } from '@/components/ui/date-range-selector';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { CursorPagination } from '@/components/common/cursor-pagination';
import { SectionHeader } from '@/components/common/section-header';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { getWorkoutStyle } from '@/lib/utils/workout-styles';
import { DataSourceInfo } from '@/components/common/data-source-info';
import { formatDuration, formatCalories } from '@/lib/utils/format';
import { prepareHrChartData } from '@/lib/utils/timeseries';
import { HR_CHART_CONFIG } from '@/lib/utils/chart-config';
import {
  getWorkoutCategory,
  getWorkoutDetailFields,
  calculateWorkoutStats,
  dateToTimestamp,
} from '@/lib/utils/workout';
import type { EventRecordResponse } from '@/lib/api/types';
import { EventDeleteDialog } from '@/components/common/event-delete-dialog';

interface WorkoutSectionProps {
  userId: string;
  dateRange: PeriodValue;
}

// Number of columns in the workout table – used for full-width expanded rows.
const WORKOUT_COLUMN_COUNT = 7;

// Expandable workout row with HR time series
function WorkoutRow({
  workout,
  userId,
}: {
  workout: EventRecordResponse;
  userId: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const deleteWorkout = useDeleteWorkout(userId);
  const style = getWorkoutStyle(workout.type || workout.category || '');
  const category = getWorkoutCategory(workout.type || workout.category || '');

  // Get workout start and end times
  const startTime = workout.start_time || workout.start_datetime || '';
  const endTime = workout.end_time || workout.end_datetime || '';

  // Fetch heart rate time series data when expanded
  const { data: hrData, isLoading: hrLoading } = useTimeSeries(userId, {
    start_time: startTime,
    end_time: endTime,
    types: ['heart_rate'],
    resolution: '1min',
    limit: 100,
  });

  // Prepare HR chart data using utility function
  const hrChartData = useMemo(() => prepareHrChartData(hrData?.data), [hrData]);

  // Get detail fields using utility function
  const detailFields = useMemo(
    () => getWorkoutDetailFields(workout, category),
    [workout, category]
  );

  const workoutDate = workout.start_time || workout.start_datetime;

  return (
    <>
      {/* Main row - always visible */}
      <TableRow
        onClick={() => setIsExpanded(!isExpanded)}
        data-state={isExpanded ? 'selected' : undefined}
        className="cursor-pointer"
      >
        <TableCell className="font-medium text-foreground">
          {style.label}
        </TableCell>
        <TableCell>
          <DataSourceInfo source={workout.source} />
        </TableCell>
        <TableCell className="whitespace-nowrap text-muted-foreground">
          {workoutDate ? format(new Date(workoutDate), 'MMM d, yyyy') : '—'}
        </TableCell>
        <TableCell className="text-right tabular-nums text-foreground">
          {formatDuration(workout.duration_seconds)}
        </TableCell>
        <TableCell className="text-right tabular-nums text-foreground">
          {formatCalories(workout.calories_kcal)}
        </TableCell>
        <TableCell className="text-right tabular-nums text-foreground">
          {workout.avg_heart_rate_bpm
            ? `${Math.round(Number(workout.avg_heart_rate_bpm))} bpm`
            : '—'}
        </TableCell>
        <TableCell className="w-8 pl-0 text-right">
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform',
              isExpanded && 'rotate-180'
            )}
          />
        </TableCell>
      </TableRow>

      {/* Expanded details */}
      {isExpanded && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={WORKOUT_COLUMN_COUNT} className="bg-muted/20 p-0">
            <div className="space-y-4 px-4 py-4">
              {/* Heart Rate During Workout Chart */}
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                  Heart Rate During Workout
                </h4>
                {hrLoading ? (
                  <div className="h-[160px] flex items-center justify-center">
                    <div className="h-5 w-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
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
                        domain={['dataMin - 10', 'dataMax + 10']}
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
                        stroke="var(--color-hr)"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: 'var(--color-hr)' }}
                      />
                    </LineChart>
                  </ChartContainer>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No heart rate data available for this workout
                  </p>
                )}
              </div>

              {/* Detail Fields */}
              {detailFields.length > 0 && (
                <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border/40 pt-4 sm:grid-cols-3 lg:grid-cols-4">
                  {detailFields.map((field) => (
                    <div key={field.label} className="space-y-1">
                      <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        {field.label}
                      </dt>
                      <dd className="text-sm font-medium tabular-nums text-foreground">
                        {field.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}

              {/* Delete button */}
              <div className="flex justify-end border-t border-border/40 pt-3">
                <button
                  onClick={() => setShowDelete(true)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive-muted transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete workout
                </button>
              </div>

              <EventDeleteDialog
                open={showDelete}
                title="Delete workout?"
                description="This workout and all associated data will be permanently removed. This cannot be undone."
                isPending={deleteWorkout.isPending}
                onClose={() => setShowDelete(false)}
                onConfirm={() =>
                  deleteWorkout.mutate(workout.id, {
                    onSuccess: () => setShowDelete(false),
                  })
                }
              />
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// Loading skeleton
function WorkoutSectionSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="divide-y divide-border">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5">
            <div className="h-4 w-28 bg-muted rounded animate-pulse" />
            <div className="h-4 w-24 bg-muted/50 rounded animate-pulse" />
            <div className="h-4 w-24 bg-muted/50 rounded animate-pulse" />
            <div className="ml-auto h-4 w-12 bg-muted rounded animate-pulse" />
            <div className="h-4 w-14 bg-muted rounded animate-pulse" />
            <div className="h-4 w-12 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

const PAGE_SIZE = 10;

export function WorkoutSection({ userId, dateRange }: WorkoutSectionProps) {
  // Cursor-based pagination for workouts
  const pagination = useCursorPagination();

  // Date range hooks
  const { startDate, endDate, startIso, endIso } = usePeriodRange(dateRange);

  // Reset pagination when the date range changes so a stale cursor from a
  // previous window doesn't carry over into the new one.
  const { reset: resetPagination } = pagination;
  useEffect(() => {
    resetPagination();
  }, [dateRange, resetPagination]);

  // Workout total within the selected range – cursor responses don't carry a
  // count, so we source it from the (range-scoped) data summary to show
  // "Page X of Y".
  const { data: rangeSummary } = useUserDataSummary(userId, {
    start_date: startIso,
    end_date: endIso,
  });

  // Fetch workouts for the current page, scoped to the selected date range.
  const {
    data: workoutsResponse,
    isLoading,
    isFetching,
  } = useWorkouts(userId, {
    start_date: dateToTimestamp(startDate),
    end_date: dateToTimestamp(endDate),
    limit: PAGE_SIZE,
    cursor: pagination.currentCursor ?? undefined,
    sort_order: 'desc',
  });

  // Derive pagination state from response
  const nextCursor = workoutsResponse?.pagination?.next_cursor ?? null;
  const hasNextPage = workoutsResponse?.pagination?.has_more ?? false;

  const handleNextPage = () => pagination.goToNextPage(nextCursor);
  const handlePrevPage = pagination.goToPrevPage;

  // Fetch workouts for summary (with date filter, larger limit)
  const { data: summaryWorkouts, isLoading: summaryLoading } = useWorkouts(
    userId,
    {
      start_date: dateToTimestamp(startDate),
      end_date: dateToTimestamp(endDate),
      limit: 100,
      sort_order: 'desc',
    }
  );

  // Calculate summary stats from date-filtered workouts
  const stats = useMemo(
    () => calculateWorkoutStats(summaryWorkouts?.data || []),
    [summaryWorkouts]
  );

  const workouts = workoutsResponse?.data || [];
  const hasData = workouts.length > 0 || (stats?.count ?? 0) > 0;

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      <Card className="overflow-hidden">
        <SectionHeader title="Summary" />

        <div className="p-6">
          {summaryLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="p-4 border border-border/60 rounded-lg bg-card/30"
                >
                  <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-20 bg-muted/50 rounded animate-pulse mt-2" />
                </div>
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Workouts Count */}
              <div className="p-4 border border-border/60 rounded-lg bg-card/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <Dumbbell className="h-5 w-5 text-indigo-400" />
                  </div>
                </div>
                <p className="text-2xl font-semibold text-foreground">
                  {stats.count}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Workouts</p>
              </div>

              {/* Total Time */}
              <div className="p-4 border border-border/60 rounded-lg bg-card/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-sky-500/10 rounded-lg">
                    <Timer className="h-5 w-5 text-sky-400" />
                  </div>
                </div>
                <p className="text-2xl font-semibold text-foreground">
                  {formatDuration(stats.totalDuration)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Total Time</p>
              </div>

              {/* Calories */}
              <div className="p-4 border border-border/60 rounded-lg bg-card/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <Flame className="h-5 w-5 text-orange-400" />
                  </div>
                </div>
                <p className="text-2xl font-semibold text-foreground">
                  {Math.round(stats.totalCalories).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Calories</p>
              </div>

              {/* Distance */}
              <div className="p-4 border border-border/60 rounded-lg bg-card/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <MoveHorizontal className="h-5 w-5 text-purple-400" />
                  </div>
                </div>
                <p className="text-2xl font-semibold text-foreground">
                  {(stats.totalDistance / 1000).toFixed(1)} km
                </p>
                <p className="text-xs text-muted-foreground mt-1">Distance</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No workouts in this period
            </p>
          )}
        </div>
      </Card>

      {/* Workout List Section */}
      <Card className="overflow-hidden">
        <SectionHeader
          title="Workouts"
          rightContent={
            !isLoading && hasData ? (
              <span className="text-xs text-muted-foreground">
                Page {pagination.currentPage}
              </span>
            ) : undefined
          }
        />

        <div className="p-6">
          {isLoading ? (
            <WorkoutSectionSkeleton />
          ) : !hasData ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No workout data available
            </p>
          ) : (
            <div className="space-y-4">
              {/* Workout List */}
              <div className="overflow-hidden rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Type</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Duration</TableHead>
                      <TableHead className="text-right">Calories</TableHead>
                      <TableHead className="text-right">Avg HR</TableHead>
                      <TableHead className="w-8" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workouts.map((workout) => (
                      <WorkoutRow
                        key={workout.id}
                        workout={workout}
                        userId={userId}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              <CursorPagination
                currentPage={pagination.currentPage}
                hasPrevPage={pagination.hasPrevPage}
                hasNextPage={hasNextPage}
                isFetching={isFetching}
                onPrevPage={handlePrevPage}
                onNextPage={handleNextPage}
                totalItems={rangeSummary?.total_workouts}
                pageSize={PAGE_SIZE}
                itemLabel="workouts"
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
