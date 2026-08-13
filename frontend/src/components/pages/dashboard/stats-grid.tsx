import type { DashboardStats } from '@/lib/api/types';
import { Card } from '@/components/ui/card';
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
    <dl className={cn('grid grid-cols-2 gap-6 sm:grid-cols-4', className)}>
      {items.map((item) => (
        <Card
          key={item.label}
          role="region"
          aria-label={item.label}
          className="flex min-h-28 flex-col items-center justify-center rounded-xl px-4 py-5 text-center sm:min-h-32"
        >
          <dt className="text-xs font-medium text-muted-foreground sm:text-sm">
            {item.label}
          </dt>
          <dd className="mt-2 text-3xl font-semibold tracking-tight text-foreground tabular-nums">
            {formatCompactNumber(item.value)}
          </dd>
        </Card>
      ))}
    </dl>
  );
}
