import { useMemo } from 'react';
import {
  addDays,
  format,
  parseISO,
  subDays,
  startOfDay,
  getUnixTime,
} from 'date-fns';
import type { PeriodValue } from '@/components/ui/date-range-selector';

interface DateRangeParams {
  start_date: string;
  end_date: string;
}

/**
 * A period resolved to a concrete half-open interval `[startDate, endDate)`.
 * Provides both ISO strings (for API params) and Date objects (for formatting
 * or unix-timestamp conversion), plus the window length in days.
 */
interface ResolvedPeriod {
  startDate: Date;
  endDate: Date; // exclusive
  startIso: string;
  endIso: string; // exclusive
  days: number;
}

/**
 * Convert a local date to UTC midnight.
 * Takes the year/month/day from the local date and creates a UTC timestamp.
 * This ensures the user's "today" is correctly represented in UTC.
 */
function toUTCMidnight(date: Date): Date {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
}

const DAY_MS = 86_400_000;

/**
 * Resolve a {@link PeriodValue} (preset or custom span) to a concrete half-open
 * interval `[startDate, endDate)` in UTC.
 *
 * - Preset: start = UTC midnight N days ago, end = UTC midnight tomorrow
 *   (exclusive, so today's data is included).
 * - Custom: `from`/`to` are inclusive `yyyy-MM-dd` days; end is UTC midnight of
 *   the day after `to`.
 */
export function usePeriodRange(period: PeriodValue): ResolvedPeriod {
  return useMemo(() => {
    if (period.type === 'preset') {
      const today = startOfDay(new Date());
      const start = toUTCMidnight(subDays(today, period.days));
      const end = toUTCMidnight(addDays(today, 1));
      return {
        startDate: start,
        endDate: end,
        startIso: start.toISOString(),
        endIso: end.toISOString(),
        days: period.days,
      };
    }

    // Custom inclusive [from, to] → half-open [from, day-after-to) in UTC.
    const startIso = `${period.from}T00:00:00.000Z`;
    const endDay = format(addDays(parseISO(period.to), 1), 'yyyy-MM-dd');
    const endIso = `${endDay}T00:00:00.000Z`;
    const start = new Date(startIso);
    const end = new Date(endIso);
    const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / DAY_MS));
    return { startDate: start, endDate: end, startIso, endIso, days };
  }, [period]);
}

/**
 * Hook to get an "all time" date range for fetching complete data.
 * Returns a stable object with start_date and end_date for API params.
 *
 * Uses half-open interval [start, end) where end is start of tomorrow in UTC.
 */
export function useAllTimeRange(): DateRangeParams {
  return useMemo(() => {
    const today = startOfDay(new Date());
    const start = new Date('2000-01-01T00:00:00.000Z');

    // End date: start of tomorrow UTC (exclusive, for half-open interval)
    const end = toUTCMidnight(addDays(today, 1));

    return {
      start_date: start.toISOString(),
      end_date: end.toISOString(),
    };
  }, []);
}

/**
 * Hook to get an "all time" date range as unix timestamps (seconds).
 * Used for APIs that expect unix timestamp format.
 *
 * Uses half-open interval [start, end) where end is start of tomorrow in UTC.
 */
export function useAllTimeRangeTimestamp(): DateRangeParams {
  return useMemo(() => {
    const today = startOfDay(new Date());
    const start = new Date('2000-01-01T00:00:00.000Z');

    // End date: start of tomorrow UTC (exclusive, for half-open interval)
    const end = toUTCMidnight(addDays(today, 1));

    return {
      start_date: getUnixTime(start).toString(),
      end_date: getUnixTime(end).toString(),
    };
  }, []);
}
