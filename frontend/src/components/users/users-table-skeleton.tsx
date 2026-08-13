import { Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { DataTableSkeleton } from '@/components/ui/data-table-skeleton';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

export interface UsersTableSkeletonProps {
  rows?: number;
}

/** Loading placeholder that matches the real UsersTable layout: a Card with the
 * search bar, the five-column table, and the pagination footer. */
export function UsersTableSkeleton({ rows = 9 }: UsersTableSkeletonProps) {
  return (
    <Card className="overflow-hidden rounded-xl">
      <div className="border-b border-border p-4">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50"
            aria-hidden="true"
          />
          <Input
            disabled
            placeholder="Search by name or email..."
            className="px-9"
          />
        </div>
      </div>

      <DataTableSkeleton columns={5} rows={rows} />

      <div className="flex items-center justify-between border-t border-border p-4">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="h-8 w-60" />
      </div>
    </Card>
  );
}
