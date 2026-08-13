import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface DashboardLoadingStateProps {
  className?: string;
}

export function DashboardLoadingState({
  className,
}: DashboardLoadingStateProps) {
  return (
    <div
      className={cn('min-h-full px-4 py-7 sm:px-6 sm:py-8 lg:px-10', className)}
    >
      <div
        className="mx-auto w-full max-w-[96rem]"
        aria-label="Loading dashboard"
      >
        <Skeleton className="h-6 w-14 rounded-full" />
        <Skeleton className="mt-3 h-9 w-44" />
        <Skeleton className="mt-2 h-4 w-64" />

        <Card className="mt-6 overflow-hidden rounded-xl">
          <div className="grid grid-cols-2 sm:grid-cols-4">
            {[1, 2, 3, 4].map((item, index) => (
              <div
                key={item}
                className={cn(
                  'flex min-h-28 flex-col items-center justify-center gap-3 px-4 py-5 sm:min-h-32',
                  index >= 2 && 'border-t border-border sm:border-t-0',
                  index % 2 === 1 && 'border-l border-border',
                  index > 0 && 'sm:border-l sm:border-border'
                )}
              >
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-14" />
              </div>
            ))}
          </div>
          <div className="border-t border-border px-4 py-5 sm:px-6 sm:py-6">
            <div className="flex items-end justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-6 w-12" />
            </div>
            <Skeleton className="mt-4 h-1.5 w-full rounded-full" />
            <div className="mt-4 flex justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </Card>

        <Card className="mt-5 grid overflow-hidden rounded-xl lg:grid-cols-[5fr_7fr] lg:divide-x lg:divide-border">
          <div className="h-64 p-6">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-5 h-40 w-full" />
          </div>
          <div className="h-64 border-t border-border p-6 lg:border-t-0">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-5 h-40 w-full" />
          </div>
        </Card>
      </div>
    </div>
  );
}
