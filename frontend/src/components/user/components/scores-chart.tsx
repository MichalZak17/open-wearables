import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  getProviderColor,
  getProviderLabel,
  type CategoryConfig,
} from './scores-config';

interface ScoreTrendChartProps {
  category: string;
  categoryConfig?: CategoryConfig;
  chartData: Record<string, string | number>[];
  providers: string[];
}

export function ScoreTrendChart({
  category,
  categoryConfig,
  chartData,
  providers,
}: ScoreTrendChartProps) {
  return (
    <div className="pt-4 border-t border-border/60">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-foreground">
          {categoryConfig?.label || category} Score Trend
        </h4>
        <div className="flex items-center gap-3">
          {providers.map((provider) => (
            <div key={provider} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: getProviderColor(provider) }}
              />
              <span className="text-xs text-muted-foreground">
                {getProviderLabel(provider)}
              </span>
            </div>
          ))}
        </div>
      </div>
      <ChartContainer
        config={Object.fromEntries(
          providers.map((p) => [
            p,
            {
              label: getProviderLabel(p),
              color: getProviderColor(p),
            },
          ])
        )}
        className="h-[200px] w-full"
      >
        <LineChart accessibilityLayer data={chartData}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
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
            domain={[0, categoryConfig?.maxScale || 100]}
            width={category === 'resilience' ? 45 : 35}
            tickFormatter={
              category === 'resilience' ? (v) => `${v}%` : undefined
            }
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                formatter={
                  category === 'resilience'
                    ? (value) => `${Number(value).toFixed(1)}%`
                    : undefined
                }
              />
            }
          />
          {providers.map((provider) => (
            <Line
              key={provider}
              isAnimationActive={false}
              dataKey={provider}
              type="monotone"
              stroke={`var(--color-${provider})`}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: `var(--color-${provider})` }}
              connectNulls
            />
          ))}
        </LineChart>
      </ChartContainer>
    </div>
  );
}
