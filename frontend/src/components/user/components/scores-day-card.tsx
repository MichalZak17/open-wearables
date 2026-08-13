import { memo, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { SourceBadge } from '@/components/common/source-badge';
import type { HealthScoreResponse } from '@/lib/api/types';
import {
  CATEGORY_CONFIG,
  CATEGORY_ORDER,
  formatComponentName,
  formatScore,
} from './scores-config';

interface ScoreDayCardProps {
  date: string;
  scores: HealthScoreResponse[];
}

function ScoreDayCardComponent({ date, scores }: ScoreDayCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Group scores by category in defined order
  const byCategory = useMemo(() => {
    const groups = new Map<string, HealthScoreResponse[]>();
    for (const score of scores) {
      if (!groups.has(score.category)) groups.set(score.category, []);
      groups.get(score.category)!.push(score);
    }
    return new Map(
      CATEGORY_ORDER.filter((cat) => groups.has(cat)).map((cat) => [
        cat,
        groups.get(cat)!,
      ])
    );
  }, [scores]);

  const hasComponents = scores.some(
    (s) => s.components && Object.keys(s.components).length > 0
  );

  return (
    <div className="border border-border/60 rounded-lg overflow-hidden bg-card/30 hover:bg-card/40 transition-colors">
      <button
        onClick={() => hasComponents && setIsExpanded(!isExpanded)}
        className="w-full p-4 text-left"
        disabled={!hasComponents}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">
              {format(new Date(date + 'T00:00:00'), 'EEE, MMM d')}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(date + 'T00:00:00'), 'yyyy')}
            </p>
          </div>

          {hasComponents && (
            <div className="flex-shrink-0 ml-2">
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          )}
        </div>

        {/* Category rows */}
        <div className="mt-3 space-y-2">
          {Array.from(byCategory.entries()).map(
            ([category, categoryScores]) => {
              const config = CATEGORY_CONFIG[category];
              const Icon = config?.icon || Activity;
              return (
                <div key={category} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 w-28 flex-shrink-0">
                    <Icon
                      className={`h-3.5 w-3.5 ${config?.color || 'text-muted-foreground'}`}
                    />
                    <span className="text-xs text-muted-foreground">
                      {config?.label || category}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {categoryScores.map((score) => {
                      const resilienceScore =
                        category === 'resilience'
                          ? (score.components?.resilience_score?.value ?? null)
                          : null;
                      return (
                        <div
                          key={score.id}
                          className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-muted/50 border border-border/30"
                        >
                          <SourceBadge provider={score.provider || 'unknown'} />
                          <span className="text-sm font-semibold text-foreground">
                            {resilienceScore !== null
                              ? Number(resilienceScore).toFixed(0)
                              : formatScore(score.value, category)}
                          </span>
                          {resilienceScore !== null && (
                            <span className="text-[10px] text-muted-foreground">
                              {formatScore(score.value, 'resilience')}
                            </span>
                          )}
                          {score.qualifier && (
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                              {score.qualifier}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }
          )}
        </div>
      </button>

      {/* Expanded: show components */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-border/60">
          <h4 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
            Score Components
          </h4>
          <div className="space-y-4">
            {scores
              .filter(
                (s) => s.components && Object.keys(s.components).length > 0
              )
              .map((score) => (
                <div key={score.id}>
                  <div className="flex items-center gap-2 mb-2">
                    <SourceBadge provider={score.provider || 'unknown'} />
                    <span className="text-xs text-muted-foreground">
                      {CATEGORY_CONFIG[score.category]?.label || score.category}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1 pl-4">
                    {Object.entries(score.components!).map(([key, comp]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between py-1"
                      >
                        <span className="text-xs text-muted-foreground">
                          {formatComponentName(key)}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-foreground">
                            {formatScore(comp.value)}
                          </span>
                          {comp.qualifier && (
                            <span className="text-[10px] text-muted-foreground/70 uppercase">
                              {comp.qualifier}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export const ScoreDayCard = memo(ScoreDayCardComponent);
