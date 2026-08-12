import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface DashboardErrorStateProps {
  onRetry: () => void;
  className?: string;
}

export function DashboardErrorState({
  onRetry,
  className,
}: DashboardErrorStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-full items-center justify-center px-4 py-12 sm:px-6',
        className
      )}
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center">
        <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-destructive/8 text-destructive">
          <AlertTriangle className="size-5" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-base font-semibold text-foreground">
          Dashboard unavailable
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          We could not load your platform metrics. Try the request again.
        </p>
        <Button variant="outline" onClick={onRetry} className="mt-5">
          <RefreshCw className="size-4" aria-hidden="true" />
          Retry
        </Button>
      </div>
    </div>
  );
}
