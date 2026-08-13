import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  Copy,
  Link as LinkIcon,
  Trash2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Column, ColumnDef } from '@tanstack/react-table';
import type { DataTableFeatures } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { UserRead, UserQueryParams } from '@/lib/api/types';
import { ROUTES } from '@/lib/constants/routes';
import { copyToClipboard } from '@/lib/utils/clipboard';
import { truncateId } from '@/lib/utils/format';

/** Maps table column ids to the API `sort_by` values they drive. */
export const columnToSortBy: Record<string, UserQueryParams['sort_by']> = {
  created_at: 'created_at',
  first_name: 'first_name',
  name: 'first_name',
  last_synced_at: 'last_synced_at',
};

function SortableHeader({
  column,
  children,
}: {
  column: Column<DataTableFeatures, UserRead>;
  children: ReactNode;
}) {
  if (!(column.id in columnToSortBy)) {
    return (
      <span className="font-medium text-muted-foreground">{children}</span>
    );
  }

  return (
    <button
      className="-ml-2 flex items-center gap-1 rounded px-2 py-1 font-medium text-muted-foreground transition-colors hover:text-foreground"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      {children}
      {column.getIsSorted() === 'asc' ? (
        <ChevronUp className="h-3.5 w-3.5" />
      ) : column.getIsSorted() === 'desc' ? (
        <ChevronDown className="h-3.5 w-3.5" />
      ) : (
        <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
      )}
    </button>
  );
}

function CopyIdButton({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(id, 'User ID copied to clipboard');
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      title="Copy user ID"
      onClick={(e) => {
        e.stopPropagation();
        handleCopy();
      }}
    >
      {copied ? (
        <Check className="h-3 w-3 text-success-muted" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </Button>
  );
}

function CopyPairLinkButton({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const pairLink = `${window.location.origin}${ROUTES.users}/${id}/pair`;
    const success = await copyToClipboard(
      pairLink,
      'Pairing link copied to clipboard'
    );
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      title="Copy pairing link"
      onClick={(e) => {
        e.stopPropagation();
        handleCopy();
      }}
    >
      {copied ? (
        <Check className="h-4 w-4 text-success-muted" />
      ) : (
        <LinkIcon className="h-4 w-4" />
      )}
    </Button>
  );
}

export interface CreateUsersColumnsOptions {
  onDelete: (userId: string) => void;
  isDeleting?: boolean;
}

export function createUsersColumns({
  onDelete,
  isDeleting,
}: CreateUsersColumnsOptions): ColumnDef<DataTableFeatures, UserRead>[] {
  return [
    {
      accessorKey: 'id',
      header: () => (
        <span className="font-medium text-muted-foreground">User ID</span>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <code className="rounded bg-muted px-2 py-1 font-mono text-xs text-foreground/90">
            {truncateId(row.original.id)}
          </code>
          <CopyIdButton id={row.original.id} />
        </div>
      ),
      enableSorting: false,
    },
    {
      id: 'name',
      accessorFn: (row) =>
        `${row.first_name || ''} ${row.last_name || ''}`.trim(),
      header: ({ column }) => (
        <SortableHeader column={column}>Name</SortableHeader>
      ),
      cell: ({ row }) => {
        const fullName =
          `${row.original.first_name || ''} ${row.original.last_name || ''}`.trim();
        return (
          <span
            className={
              fullName
                ? 'text-sm text-foreground/90'
                : 'text-muted-foreground/70'
            }
          >
            {fullName || '—'}
          </span>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <SortableHeader column={column}>Created</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(row.original.created_at), {
            addSuffix: true,
          })}
        </span>
      ),
    },
    {
      accessorKey: 'last_synced_at',
      header: ({ column }) => (
        <SortableHeader column={column}>Last Synced</SortableHeader>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">
            {row.original.last_synced_at
              ? formatDistanceToNow(new Date(row.original.last_synced_at), {
                  addSuffix: true,
                })
              : 'Never'}
          </span>
          {row.original.last_synced_provider && (
            <Badge
              variant="outline"
              className="px-1.5 py-0 text-[10px] capitalize"
            >
              {row.original.last_synced_provider}
            </Badge>
          )}
        </div>
      ),
    },
    {
      id: 'actions',
      header: () => (
        <span className="block text-right font-medium text-muted-foreground">
          Actions
        </span>
      ),
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <CopyPairLinkButton id={row.original.id} />
          <Button
            variant="destructive-outline"
            size="icon"
            title="Delete user"
            disabled={isDeleting}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(row.original.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      enableSorting: false,
    },
  ];
}
