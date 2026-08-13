import { cn } from '@/lib/utils';

interface SourceBadgeProps {
  provider: string;
  className?: string;
}

// The pill itself is uniform and neutral; each provider's brand colour survives
// only as a small dot, so providers stay recognisable without a loud badge.
const PROVIDER_STYLES: Record<string, { label: string; dot: string }> = {
  garmin: { label: 'Garmin', dot: 'bg-blue-500' },
  fitbit: { label: 'Fitbit', dot: 'bg-teal-500' },
  oura: { label: 'Oura', dot: 'bg-violet-500' },
  whoop: { label: 'WHOOP', dot: 'bg-yellow-400' },
  strava: { label: 'Strava', dot: 'bg-orange-500' },
  google: { label: 'Google', dot: 'bg-green-500' },
  'google-fit': { label: 'Google Fit', dot: 'bg-green-500' },
  withings: { label: 'Withings', dot: 'bg-cyan-500' },
  polar: { label: 'Polar', dot: 'bg-red-500' },
  suunto: { label: 'Suunto', dot: 'bg-orange-400' },
  samsung: { label: 'Samsung', dot: 'bg-sky-500' },
  ultrahuman: { label: 'Ultrahuman', dot: 'bg-purple-500' },
  apple: { label: 'Apple', dot: 'bg-zinc-400' },
  internal: { label: 'OW', dot: 'bg-success-muted' },
};

const UNKNOWN_DOT = 'bg-muted-foreground/40';

/** Human-readable label for a provider key (falls back to a capitalized key). */
export function providerLabel(provider: string): string {
  return (
    PROVIDER_STYLES[provider]?.label ??
    provider.charAt(0).toUpperCase() + provider.slice(1)
  );
}

export function SourceBadge({ provider, className = '' }: SourceBadgeProps) {
  const dot = PROVIDER_STYLES[provider]?.dot ?? UNKNOWN_DOT;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-md border border-border/60 bg-muted/60 px-2.5 py-1 text-xs font-medium leading-none text-muted-foreground',
        className
      )}
    >
      <span className={cn('h-2 w-2 shrink-0 rounded-full', dot)} />
      {providerLabel(provider)}
    </span>
  );
}
