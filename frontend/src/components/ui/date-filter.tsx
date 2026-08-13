import { addDays, format, parseISO, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export interface DateFilterValue {
  start_date: string; // ISO datetime (UTC midnight)
  end_date: string; // ISO datetime (UTC midnight, exclusive)
  // Index signature keeps this assignable to the API's DataSummaryParams.
  [key: string]: string | undefined;
}

type FilterMode = 'all' | 'day' | 'range';

interface DateFilterProps {
  /** Called whenever the selected scope changes. `undefined` means all-time (no filter). */
  onChange: (value: DateFilterValue | undefined) => void;
  className?: string;
}

const MODES: { value: FilterMode; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: 'day', label: 'Day' },
  { value: 'range', label: 'Range' },
];

const DATE_FMT = 'yyyy-MM-dd';

/** Convert a `yyyy-MM-dd` day string to UTC-midnight ISO. */
function dayStartIso(day: string): string {
  return `${day}T00:00:00.000Z`;
}

/** Build the half-open `[start, end)` range that covers the given inclusive day span. */
function buildRange(fromDay: string, toDay: string): DateFilterValue {
  return {
    start_date: dayStartIso(fromDay),
    end_date: dayStartIso(format(addDays(parseISO(toDay), 1), DATE_FMT)),
  };
}

export function DateFilter({ onChange, className }: DateFilterProps) {
  const today = format(new Date(), DATE_FMT);
  const [mode, setMode] = useState<FilterMode>('all');
  const [day, setDay] = useState(today);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);

  const emit = (next: {
    mode: FilterMode;
    day?: string;
    from?: string;
    to?: string;
  }) => {
    if (next.mode === 'all') {
      onChange(undefined);
    } else if (next.mode === 'day') {
      onChange(buildRange(next.day ?? day, next.day ?? day));
    } else {
      const f = next.from ?? from;
      const t = next.to ?? to;
      // Guard against an inverted range (from after to).
      const [lo, hi] = f <= t ? [f, t] : [t, f];
      onChange(buildRange(lo, hi));
    }
  };

  const selectMode = (nextMode: FilterMode) => {
    setMode(nextMode);
    emit({ mode: nextMode });
  };

  const stepDay = (delta: number) => {
    const nextDay = format(
      delta < 0 ? subDays(parseISO(day), 1) : addDays(parseISO(day), 1),
      DATE_FMT
    );
    setDay(nextDay);
    emit({ mode: 'day', day: nextDay });
  };

  const onDayKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      stepDay(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      stepDay(1);
    }
  };

  // Borderless input that sits inside the grouped `bg-foreground/5` container.
  const dateInputClass =
    'h-8 border-0 bg-transparent px-2.5 text-xs font-medium tabular-nums text-foreground ' +
    'focus:outline-none [color-scheme:light] dark:[color-scheme:dark]';

  const stepperButtonClass =
    'flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors ' +
    'hover:bg-foreground/5 hover:text-foreground';

  return (
    <div className={cn('flex flex-col items-end gap-2', className)}>
      {/* Segmented mode toggle. */}
      <div
        role="tablist"
        aria-label="Date filter mode"
        className="inline-flex h-8 items-center gap-1 rounded-lg bg-foreground/5 p-1"
      >
        {MODES.map(({ value, label }) => {
          const active = mode === value;
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => selectMode(value)}
              className={cn(
                'flex h-full items-center justify-center whitespace-nowrap rounded-md px-3 text-xs font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground/70'
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {mode === 'day' && (
        <div
          tabIndex={0}
          onKeyDown={onDayKeyDown}
          className="inline-flex h-8 items-center overflow-hidden rounded-lg bg-foreground/5 outline-none transition-shadow focus-within:ring-1 focus-within:ring-primary/50"
          aria-label="Selected day (use left and right arrow keys to switch days)"
        >
          <button
            type="button"
            onClick={() => stepDay(-1)}
            className={cn(stepperButtonClass, 'border-r border-border/40')}
            aria-label="Previous day"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <input
            type="date"
            value={day}
            max={today}
            onChange={(e) => {
              setDay(e.target.value);
              emit({ mode: 'day', day: e.target.value });
            }}
            className={dateInputClass}
          />
          <button
            type="button"
            onClick={() => stepDay(1)}
            className={cn(stepperButtonClass, 'border-l border-border/40')}
            aria-label="Next day"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {mode === 'range' && (
        <div className="inline-flex h-8 items-center overflow-hidden rounded-lg bg-foreground/5 transition-shadow focus-within:ring-1 focus-within:ring-primary/50">
          <input
            type="date"
            value={from}
            max={to}
            onChange={(e) => {
              setFrom(e.target.value);
              emit({ mode: 'range', from: e.target.value });
            }}
            className={dateInputClass}
            aria-label="From date"
          />
          <span className="flex h-8 items-center border-x border-border/40 px-2 text-xs text-muted-foreground">
            →
          </span>
          <input
            type="date"
            value={to}
            max={today}
            min={from}
            onChange={(e) => {
              setTo(e.target.value);
              emit({ mode: 'range', to: e.target.value });
            }}
            className={dateInputClass}
            aria-label="To date"
          />
        </div>
      )}
    </div>
  );
}
