import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import type { ColumnDef } from '@tanstack/react-table';
import { SourceBadge } from '@/components/common/source-badge';
import { DataTable, type DataTableFeatures } from '@/components/ui/data-table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { UserRead } from '@/lib/api/types';
import { cn } from '@/lib/utils';

export interface RecentUsersSectionProps {
  users: UserRead[];
  lastSyncedUsers: UserRead[];
  isLoading?: boolean;
  isLoadingLastSynced?: boolean;
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

function joinedDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return format(date, 'MMM d, yyyy');
}

function UserIdentity({ user }: { user: UserRead }) {
  return (
    <div className="min-w-0">
      <p className="max-w-72 truncate font-medium text-foreground">
        {userDisplayName(user)}
      </p>
      <p className="mt-0.5 max-w-72 truncate text-xs text-muted-foreground">
        {user.email || user.external_user_id || 'No email'}
      </p>
    </div>
  );
}

const USER_COLUMN: ColumnDef<DataTableFeatures, UserRead> = {
  id: 'user',
  header: 'User',
  cell: ({ row }) => <UserIdentity user={row.original} />,
};

const LAST_SYNCED_COLUMNS: ColumnDef<DataTableFeatures, UserRead>[] = [
  USER_COLUMN,
  {
    id: 'source',
    header: 'Source',
    cell: ({ row }) =>
      row.original.last_synced_provider ? (
        <SourceBadge provider={row.original.last_synced_provider} />
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
  },
  {
    id: 'last_seen',
    header: () => <span className="block text-right">Last seen</span>,
    cell: ({ row }) => (
      <span className="block text-right text-xs text-muted-foreground">
        {relativeSyncTime(row.original.last_synced_at)}
      </span>
    ),
  },
];

const RECENT_COLUMNS: ColumnDef<DataTableFeatures, UserRead>[] = [
  USER_COLUMN,
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span
          className={cn(
            'size-1.5 rounded-full',
            row.original.has_active_connection
              ? 'bg-success'
              : 'bg-muted-foreground/40'
          )}
          aria-hidden="true"
        />
        {row.original.has_active_connection ? 'Active' : 'Inactive'}
      </span>
    ),
  },
  {
    id: 'joined',
    header: () => <span className="block text-right">Joined</span>,
    cell: ({ row }) => (
      <span className="block text-right text-xs text-muted-foreground">
        {joinedDate(row.original.created_at)}
      </span>
    ),
  },
];

export function RecentUsersSection({
  users,
  lastSyncedUsers,
  isLoading,
  isLoadingLastSynced,
  className,
}: RecentUsersSectionProps) {
  const [tab, setTab] = useState('last-synced');

  return (
    <div className={cn('min-w-0 px-4 py-5 sm:px-6 sm:py-6', className)}>
      <Tabs
        value={tab}
        onValueChange={setTab}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <h2 className="text-sm font-semibold text-foreground">
          Recent activity
        </h2>
        <TabsList className="h-9">
          <TabsTrigger value="last-synced">Last synced</TabsTrigger>
          <TabsTrigger value="recent">Recently added</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Reserve space for a full 5-row table so switching tabs or hitting a
          loading/empty state doesn't resize the card. */}
      <div className="mt-3 min-h-[19.75rem]">
        {tab === 'last-synced' ? (
          <DataTable
            columns={LAST_SYNCED_COLUMNS}
            data={lastSyncedUsers}
            isLoading={isLoadingLastSynced}
            skeletonRows={5}
            emptyMessage="No synced users yet"
          />
        ) : (
          <DataTable
            columns={RECENT_COLUMNS}
            data={users}
            isLoading={isLoading}
            skeletonRows={5}
            emptyMessage="No users yet"
          />
        )}
      </div>
    </div>
  );
}
