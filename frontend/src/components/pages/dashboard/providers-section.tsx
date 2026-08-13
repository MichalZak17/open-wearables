import { Cell, Pie, PieChart } from 'recharts';
import { providerLabel } from '@/components/common/source-badge';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import type { ProviderConnectionCount } from '@/lib/api/types';
import { cn } from '@/lib/utils';
import { formatCompactNumber } from '@/lib/utils/format';

export interface ProvidersSectionProps {
  providers: ProviderConnectionCount[];
  className?: string;
}

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

function chartKey(provider: string) {
  return provider.toLowerCase().replaceAll(/[^a-z0-9]/g, '-');
}

export function ProvidersSection({
  providers,
  className,
}: ProvidersSectionProps) {
  const data = providers.map((item, index) => ({
    ...item,
    key: chartKey(item.provider),
    label: providerLabel(item.provider),
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const totalConnections = data.reduce((sum, item) => sum + item.count, 0);

  const chartConfig: ChartConfig = Object.fromEntries(
    data.map((item) => [item.key, { label: item.label, color: item.color }])
  );

  return (
    <div
      className={cn(
        'flex h-full min-w-0 flex-col px-4 py-5 sm:px-6 sm:py-6',
        className
      )}
    >
      <h2 className="text-sm font-semibold text-foreground">Providers</h2>

      {data.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">
            No connected providers yet
          </p>
        </div>
      ) : (
        <div className="mt-4 flex flex-1 flex-col items-center justify-center gap-8 sm:flex-row sm:gap-10">
          <div className="relative aspect-square h-44 shrink-0 sm:h-52">
            <ChartContainer config={chartConfig} className="size-full">
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent nameKey="label" hideLabel />}
                />
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="label"
                  innerRadius="65%"
                  outerRadius="100%"
                  paddingAngle={data.length > 1 ? 2 : 0}
                  stroke="none"
                  isAnimationActive={false}
                >
                  {data.map((item) => (
                    <Cell key={item.key} fill={`var(--color-${item.key})`} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
                {formatCompactNumber(totalConnections)}
              </span>
              <span className="text-xs text-muted-foreground">connections</span>
            </div>
          </div>

          <dl className="grid w-full gap-3 text-sm sm:max-w-xs">
            {data.map((item) => (
              <div key={item.key} className="flex items-center gap-3">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                  aria-hidden="true"
                />
                <dt className="flex-1 truncate font-medium text-foreground">
                  {item.label}
                </dt>
                <dd className="font-medium text-foreground tabular-nums">
                  {formatCompactNumber(item.count)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
