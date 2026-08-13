import { useState } from 'react';
import { format, subDays } from 'date-fns';
import { cn } from '@/lib/utils';

/** Preset window lengths, in days. */
export type PresetDays = 7 | 30 | 90 | 180 | 365;

/**
 * A selected period: either one of the quick presets (last N days) or a custom
 * inclusive `[from, to]` span. `from`/`to` are `yyyy-MM-dd` day strings.
 */
export type PeriodValue =
  | { type: 'preset'; days: PresetDays }
  | { type: 'custom'; from: string; to: string };

/** Convenience constructor for a preset period. */
export function presetPeriod(days: PresetDays): PeriodValue {
  return { type: 'preset', days };
}

const PRESETS: PresetDays[] = [7, 30, 90, 180, 365];
const DATE_FMT = 'yyyy-MM-dd';

interface DateRangeSelectorProps {
  value: PeriodValue;
  onChange: (value: PeriodValue) => void;
  className?: string;
}

export function DateRangeSelector({
  value,
  onChange,
  className,
}: DateRangeSelectorProps) {
  const today = format(new Date(), DATE_FMT);
  const isCustom = value.type === 'custom';

  // Draft state for the custom inputs. Seeded from the current value when it is
  // already custom, otherwise from a sensible last-30-days default.
  const [from, setFrom] = useState(
    isCustom ? value.from : format(subDays(new Date(), 30), DATE_FMT)
  );
  const [to, setTo] = useState(isCustom ? value.to : today);

  const emitCustom = (nextFrom: string, nextTo: string) => {
    // Guard against an inverted range (from after to).
    const [lo, hi] =
      nextFrom <= nextTo ? [nextFrom, nextTo] : [nextTo, nextFrom];
    onChange({ type: 'custom', from: lo, to: hi });
  };

  const pillClass = (active: boolean) =>
    cn(
      'rounded-md px-2 py-1 text-xs font-medium transition-colors',
      active
        ? 'bg-muted-foreground/40 text-foreground'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground/90'
    );

  // Borderless input that sits inside the grouped `bg-foreground/5` container.
  const dateInputClass =
    'h-8 border-0 bg-transparent px-2.5 text-xs font-medium tabular-nums text-foreground ' +
    'focus:outline-none [color-scheme:light] dark:[color-scheme:dark]';

  return (
    <div
      className={cn('flex flex-wrap items-center justify-end gap-2', className)}
    >
      {isCustom && (
        <div className="inline-flex h-8 items-center overflow-hidden rounded-lg bg-foreground/5 transition-shadow focus-within:ring-1 focus-within:ring-primary/50">
          <input
            type="date"
            value={from}
            max={today}
            onChange={(e) => {
              setFrom(e.target.value);
              emitCustom(e.target.value, to);
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
              emitCustom(from, e.target.value);
            }}
            className={dateInputClass}
            aria-label="To date"
          />
        </div>
      )}

      <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-1">
        {PRESETS.map((days) => (
          <button
            key={days}
            type="button"
            onClick={() => onChange({ type: 'preset', days })}
            className={pillClass(
              value.type === 'preset' && value.days === days
            )}
          >
            {days}d
          </button>
        ))}
        <button
          type="button"
          onClick={() => emitCustom(from, to)}
          className={pillClass(isCustom)}
        >
          Custom
        </button>
      </div>
    </div>
  );
}
