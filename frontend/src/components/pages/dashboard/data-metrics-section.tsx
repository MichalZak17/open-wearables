import { AlertTriangle } from 'lucide-react';
import type { ConnectionsCoverage } from '@/lib/api/types';
import { cn } from '@/lib/utils';
import { formatCompactNumber } from '@/lib/utils/format';

export interface DataMetricsSectionProps {
  connectionsCoverage: ConnectionsCoverage;
  totalUsers: number;
  className?: string;
}

export function DataMetricsSection({
  connectionsCoverage,
  totalUsers,
  className,
}: DataMetricsSectionProps) {
  const connected = connectionsCoverage.users_with_active;
  const multiple = connectionsCoverage.users_with_multi_active;
  const notConnected = Math.max(totalUsers - connected, 0);
  const rawPercentage = totalUsers > 0 ? (connected / totalUsers) * 100 : 0;
  const percentage = Math.min(Math.max(Math.round(rawPercentage), 0), 100);

  return (
    <div
      className={cn(
        'border-t border-border px-4 py-5 sm:px-6 sm:py-6',
        className
      )}
    >
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Connection coverage
          </h2>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            {formatCompactNumber(connected)} of{' '}
            {formatCompactNumber(totalUsers)} users connected
          </p>
        </div>
        <p className="text-xl font-semibold tracking-tight text-foreground tabular-nums">
          {percentage}%
        </p>
      </div>

      <div
        role="progressbar"
        aria-label="Users with active connections"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
        className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-success transition-[width] duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3 sm:gap-6">
        <p className="flex items-center gap-2 sm:justify-start">
          <span className="size-2 rounded-full bg-success" aria-hidden="true" />
          <span>
            <strong className="font-semibold text-foreground tabular-nums">
              {formatCompactNumber(connected)}
            </strong>{' '}
            connected
          </span>
        </p>
        <p className="flex items-center gap-2 sm:justify-center">
          <AlertTriangle
            className="size-3.5 text-muted-foreground"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <span>
            <strong className="font-semibold text-foreground tabular-nums">
              {formatCompactNumber(multiple)}
            </strong>{' '}
            multiple connections
          </span>
        </p>
        <p className="flex items-center gap-2 sm:justify-end">
          <span
            className="size-2 rounded-full bg-destructive"
            aria-hidden="true"
          />
          <span>
            <strong className="font-semibold text-foreground tabular-nums">
              {formatCompactNumber(notConnected)}
            </strong>{' '}
            not connected
          </span>
        </p>
      </div>
    </div>
  );
}
