import type { DashboardStats } from '@/lib/api/types';
import { cn } from '@/lib/utils';
import { formatCompactNumber } from '@/lib/utils/format';

export interface StatsGridProps {
  stats: DashboardStats;
  className?: string;
}

export function StatsGrid({ stats, className }: StatsGridProps) {
  const items = [
    { label: 'Total users', value: stats.total_users.count },
    { label: 'Active connections', value: stats.active_conn.count },
    { label: 'Data points', value: stats.data_points.count },
    { label: 'Event records', value: stats.event_records.count },
  ];

  return (
    <dl className={cn('grid grid-cols-2 sm:grid-cols-4', className)}>
      {items.map((item, index) => (
        <div
          key={item.label}
          className={cn(
            'flex min-h-28 flex-col items-center justify-center px-4 py-5 text-center sm:min-h-32',
            index >= 2 && 'border-t border-border sm:border-t-0',
            index % 2 === 1 && 'border-l border-border',
            index > 0 && 'sm:border-l sm:border-border'
          )}
        >
          <dt className="text-xs font-medium text-muted-foreground sm:text-sm">
            {item.label}
          </dt>
          <dd className="mt-2 text-3xl font-semibold tracking-tight text-foreground tabular-nums">
            {formatCompactNumber(item.value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
