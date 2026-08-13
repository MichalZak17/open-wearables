import { useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type DataTableFeatures } from '@/components/ui/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import type { WebhookEndpoint } from '@/lib/api/types';

interface WebhooksTableProps {
  data: WebhookEndpoint[];
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export function WebhooksTable({
  data,
  onDelete,
  isLoading,
}: WebhooksTableProps) {
  const navigate = useNavigate();

  const columns = useMemo<ColumnDef<DataTableFeatures, WebhookEndpoint>[]>(
    () => [
      {
        id: 'url',
        header: 'URL',
        cell: ({ row }) => (
          <span className="block max-w-[280px] truncate font-mono text-xs text-foreground">
            {row.original.url}
          </span>
        ),
      },
      {
        id: 'description',
        header: 'Description',
        cell: ({ row }) => (
          <span className="block max-w-[220px] truncate text-sm text-foreground/90">
            {row.original.description ?? (
              <span className="text-muted-foreground/70">-</span>
            )}
          </span>
        ),
      },
      {
        id: 'events',
        header: 'Events',
        cell: ({ row }) => {
          const types = row.original.filter_types;
          if (!types?.length) {
            return (
              <Badge
                variant="outline"
                className="border-border text-[10px] text-muted-foreground"
              >
                All events
              </Badge>
            );
          }
          return (
            <div className="flex max-w-[280px] flex-wrap gap-1">
              {types.slice(0, 3).map((t) => (
                <Badge
                  key={t}
                  variant="outline"
                  className="border-border text-[10px] text-foreground/90"
                >
                  {t}
                </Badge>
              ))}
              {types.length > 3 && (
                <Badge
                  variant="outline"
                  className="border-border text-[10px] text-muted-foreground"
                >
                  +{types.length - 3}
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        id: 'user_filter',
        header: 'User filter',
        cell: ({ row }) =>
          row.original.user_id ? (
            <code className="font-mono text-xs text-foreground/90">
              {row.original.user_id.slice(0, 8)}...
            </code>
          ) : (
            <span className="text-xs text-muted-foreground/70">All users</span>
          ),
      },
      {
        id: 'actions',
        header: () => <span className="block text-right">Actions</span>,
        cell: ({ row }) => (
          <div
            className="flex justify-end"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(row.original.id)}
              title="Delete"
              className="text-muted-foreground hover:text-destructive-muted"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [onDelete]
  );

  return (
    <DataTable
      card
      columns={columns}
      data={data}
      isLoading={isLoading}
      onRowClick={(endpoint) =>
        navigate({
          to: '/webhooks/$endpointId',
          params: { endpointId: endpoint.id },
        })
      }
      emptyMessage="No webhooks configured."
    />
  );
}
