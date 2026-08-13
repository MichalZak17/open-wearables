import { useEffect, useMemo, useState } from 'react';
import { FlaskConical, type LucideIcon } from 'lucide-react';
import { useHealthScores } from '@/hooks/api/use-health';
import { usePeriodRange } from '@/hooks/use-date-range';
import type { PeriodValue } from '@/components/ui/date-range-selector';
import { Card } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { SectionHeader } from '@/components/common/section-header';
import { ScoreDayCard } from '@/components/user/components/scores-day-card';
import { ScoreTrendChart } from '@/components/user/components/scores-chart';
import {
  CATEGORY_CONFIG,
  CATEGORY_ORDER,
  buildChartData,
  groupScoresByDate,
} from '@/components/user/components/scores-config';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CategoryPill({
  label,
  icon: Icon,
  iconColor,
  isSelected,
  onClick,
}: {
  label: string;
  icon?: LucideIcon;
  iconColor?: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
        isSelected
          ? 'bg-muted-foreground/40 text-foreground border border-border'
          : 'bg-muted/50 text-muted-foreground border border-border/60 hover:border-border hover:text-foreground/90'
      }`}
    >
      {Icon && (
        <Icon
          className={`h-3.5 w-3.5 ${isSelected ? 'text-foreground' : iconColor || 'text-muted-foreground'}`}
        />
      )}
      {label}
    </button>
  );
}

function ScoresSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-7 w-20 bg-muted rounded-full animate-pulse"
          />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-4 border border-border/60 rounded-lg bg-card/30"
          >
            <div className="h-5 w-24 bg-muted rounded animate-pulse mb-3" />
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="h-8 w-32 bg-muted rounded animate-pulse" />
                <div className="h-8 w-32 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface ScoresSectionProps {
  userId: string;
  dateRange: PeriodValue;
}

export function ScoresSection({ userId, dateRange }: ScoresSectionProps) {
  const { startIso, endIso } = usePeriodRange(dateRange);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data: scoresData, isLoading } = useHealthScores(userId, {
    start_date: startIso,
    end_date: endIso,
    limit: 1000,
  });

  const scores = useMemo(() => scoresData?.data ?? [], [scoresData?.data]);

  // Categories that have data, in defined order
  const availableCategories = useMemo(() => {
    const cats = new Set(scores.map((s) => s.category));
    return CATEGORY_ORDER.filter((c) => cats.has(c));
  }, [scores]);

  // Reset category when it's no longer available in the current data
  useEffect(() => {
    if (
      selectedCategory !== 'all' &&
      availableCategories.length > 0 &&
      !availableCategories.includes(selectedCategory)
    ) {
      setSelectedCategory('all');
    }
  }, [availableCategories, selectedCategory]);

  // Unique providers for the selected category
  const providers = useMemo(() => {
    const filtered =
      selectedCategory === 'all'
        ? scores
        : scores.filter((s) => s.category === selectedCategory);
    return [
      ...new Set(filtered.map((s) => s.provider).filter(Boolean)),
    ] as string[];
  }, [scores, selectedCategory]);

  // Chart data (only for a specific category)
  const chartData = useMemo(() => {
    if (selectedCategory === 'all') return [];
    return buildChartData(scores, selectedCategory);
  }, [scores, selectedCategory]);

  // Daily scores grouped by date
  const dailyScores = useMemo(() => {
    const filtered =
      selectedCategory === 'all'
        ? scores
        : scores.filter((s) => s.category === selectedCategory);

    const byDate = groupScoresByDate(filtered);

    return Array.from(byDate.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, dayScores]) => ({ date, scores: dayScores }));
  }, [scores, selectedCategory]);

  const categoryConfig = CATEGORY_CONFIG[selectedCategory];

  return (
    <div className="space-y-6">
      {/* Summary + Chart Section */}
      <Card className="overflow-hidden">
        <SectionHeader title="Health Scores" />

        <div className="px-6 pt-4">
          <Alert variant="warning">
            <FlaskConical className="h-4 w-4" />
            <AlertTitle>Experimental</AlertTitle>
            <AlertDescription className="text-muted-foreground">
              Scores calculated by Open Wearables (OW) are in an experimental
              phase and may change as the algorithm is refined.
            </AlertDescription>
          </Alert>
        </div>

        <div className="p-6">
          {isLoading ? (
            <ScoresSkeleton />
          ) : scores.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No health scores in this period
            </p>
          ) : (
            <div className="space-y-6">
              {/* Category filter pills */}
              <div className="flex flex-wrap gap-2">
                <CategoryPill
                  label="All"
                  isSelected={selectedCategory === 'all'}
                  onClick={() => setSelectedCategory('all')}
                />
                {availableCategories.map((cat) => {
                  const config = CATEGORY_CONFIG[cat];
                  return (
                    <CategoryPill
                      key={cat}
                      label={config?.label || cat}
                      icon={config?.icon}
                      iconColor={config?.color}
                      isSelected={selectedCategory === cat}
                      onClick={() => setSelectedCategory(cat)}
                    />
                  );
                })}
              </div>

              {/* Provider comparison chart */}
              {selectedCategory !== 'all' &&
                chartData.length > 1 &&
                providers.length > 0 && (
                  <ScoreTrendChart
                    category={selectedCategory}
                    categoryConfig={categoryConfig}
                    chartData={chartData}
                    providers={providers}
                  />
                )}
            </div>
          )}
        </div>
      </Card>

      {/* Daily Scores */}
      {!isLoading && dailyScores.length > 0 && (
        <Card className="overflow-hidden">
          <SectionHeader title="Daily Scores" />
          <div className="p-6">
            <div className="space-y-3">
              {dailyScores.map(({ date, scores: dayScores }) => (
                <ScoreDayCard key={date} date={date} scores={dayScores} />
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
