import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Info, TriangleAlert } from 'lucide-react';
import { useCoverage } from '@/hooks/api/use-coverage';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CoverageMatrix } from '@/components/pages/coverage/coverage-matrix';
import { ProviderDetail } from '@/components/pages/coverage/provider-detail';
import { SourceBadge } from '@/components/common/source-badge';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export const Route = createFileRoute('/_authenticated/coverage')({
  component: CoveragePage,
});

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {Array.from({ length: 11 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}

function CoveragePage() {
  const { data, isLoading, error } = useCoverage();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <PageHeader
        title="Data Coverage"
        description="What each provider is capable of delivering, by API layer."
      />

      <Alert className="bg-muted/40">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-muted-foreground">
          This matrix shows provider{' '}
          <span className="text-foreground">capabilities</span> — the data types
          Open Wearables can ingest from each provider. A green dot means the
          type is supported and normalized in code; it does{' '}
          <span className="text-foreground">not</span> reflect what has actually
          been synced for your users in this instance.
        </AlertDescription>
      </Alert>

      {isLoading && <LoadingSkeleton />}

      {error && (
        <Alert variant="destructive">
          <TriangleAlert className="h-4 w-4" />
          <AlertDescription>Failed to load coverage data.</AlertDescription>
        </Alert>
      )}

      {data && (
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              View
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                aria-pressed={selected === null}
                onClick={() => setSelected(null)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  selected === null
                    ? 'border-border bg-muted text-foreground'
                    : 'border-border/60 text-muted-foreground hover:text-foreground/90'
                )}
              >
                Compare all
              </button>
              {data.providers.map((p) => {
                const active = selected === p;
                return (
                  <button
                    key={p}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelected(active ? null : p)}
                    title={`Inspect ${p}`}
                    className={cn(
                      'rounded-full transition-all',
                      active
                        ? 'opacity-100 ring-2 ring-ring ring-offset-2 ring-offset-background'
                        : selected
                          ? 'opacity-40 hover:opacity-80'
                          : 'opacity-100 hover:opacity-80'
                    )}
                  >
                    <SourceBadge provider={p} />
                  </button>
                );
              })}
            </div>
          </div>

          {selected ? (
            <ProviderDetail data={data} provider={selected} />
          ) : (
            <Card className="p-4">
              <CoverageMatrix data={data} />
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
