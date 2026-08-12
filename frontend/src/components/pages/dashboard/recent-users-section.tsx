import { formatDistanceToNow } from 'date-fns';
import { SourceBadge } from '@/components/common/source-badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { UserRead } from '@/lib/api/types';
import { cn } from '@/lib/utils';

export interface RecentUsersSectionProps {
  users: UserRead[];
  isLoading?: boolean;
  className?: string;
}

function userDisplayName(user: UserRead): string {
  const name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  return name || user.email || 'Unknown user';
}

function relativeSyncTime(value: string | null): string {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return formatDistanceToNow(date, { addSuffix: true });
}

function LoadingRows() {
  return (
    <div className="mt-3 space-y-1" aria-label="Loading recent activity">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="flex h-14 items-center gap-4 border-b border-border px-0 last:border-b-0"
        >
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-2.5 w-44" />
          </div>
          <Skeleton className="h-5 w-14" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

export function RecentUsersSection({
  users,
  isLoading,
  className,
}: RecentUsersSectionProps) {
  return (
    <div className={cn('min-w-0 px-4 py-5 sm:px-6 sm:py-6', className)}>
      <h2 className="text-sm font-semibold text-foreground">Recent activity</h2>

      {isLoading ? (
        <LoadingRows />
      ) : users.length === 0 ? (
        <div className="flex min-h-40 items-center justify-center">
          <p className="text-sm text-muted-foreground">
            No recent activity yet
          </p>
        </div>
      ) : (
        <Table className="mt-3 min-w-[30rem]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-9 border-b border-border px-0 text-xs font-medium">
                User
              </TableHead>
              <TableHead className="h-9 w-24 border-b border-border px-3 text-xs font-medium">
                Source
              </TableHead>
              <TableHead className="h-9 w-24 border-b border-border px-0 text-right text-xs font-medium">
                Last seen
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className="hover:bg-muted/30">
                <TableCell className="h-14 min-w-0 px-0 py-2.5">
                  <p className="max-w-72 truncate font-medium text-foreground">
                    {userDisplayName(user)}
                  </p>
                  <p className="mt-0.5 max-w-72 truncate text-xs text-muted-foreground">
                    {user.email || user.external_user_id || 'No email'}
                  </p>
                </TableCell>
                <TableCell className="h-14 px-3 py-2.5">
                  {user.last_synced_provider ? (
                    <SourceBadge provider={user.last_synced_provider} />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="h-14 whitespace-nowrap px-0 py-2.5 text-right text-xs text-muted-foreground">
                  {relativeSyncTime(user.last_synced_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
