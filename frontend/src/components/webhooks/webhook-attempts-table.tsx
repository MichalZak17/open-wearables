import { useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { ColumnDef } from '@tanstack/react-table';

import { Badge } from '@/components/ui/badge';
import { DataTable, type DataTableFeatures } from '@/components/ui/data-table';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { WebhookMessageAttempt } from '@/lib/api/types';

interface WebhookAttemptsTableProps {
  attempts: WebhookMessageAttempt[];
  isLoading?: boolean;
}

const SUCCESS_STATUSES = new Set([0, 'success', 'Success']);
const PENDING_STATUSES = new Set([1, 3, 'pending', 'sending']);

function statusBadge(status: number | string) {
  if (SUCCESS_STATUSES.has(status)) {
    return (
      <Badge className="bg-success-muted/15 text-success-muted border border-success-muted/30">
        Success
      </Badge>
    );
  }
  if (PENDING_STATUSES.has(status)) {
    return (
      <Badge className="bg-warning-muted/15 text-warning-muted border border-warning-muted/30">
        Pending
      </Badge>
    );
  }
  return (
    <Badge className="bg-destructive-muted/15 text-destructive-muted border border-destructive-muted/30">
      Failed
    </Badge>
  );
}

function statusCodeColor(code: number) {
  if (code >= 200 && code < 300) return 'text-success-muted';
  if (code >= 300 && code < 400) return 'text-warning-muted';
  return 'text-destructive-muted';
}

export function WebhookAttemptsTable({
  attempts,
  isLoading,
}: WebhookAttemptsTableProps) {
  const [selected, setSelected] = useState<WebhookMessageAttempt | null>(null);

  const columns = useMemo<
    ColumnDef<DataTableFeatures, WebhookMessageAttempt>[]
  >(
    () => [
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => statusBadge(row.original.status),
      },
      {
        id: 'code',
        header: 'Code',
        cell: ({ row }) => (
          <span
            className={`font-mono text-xs ${statusCodeColor(row.original.responseStatusCode)}`}
          >
            {row.original.responseStatusCode || '-'}
          </span>
        ),
      },
      {
        id: 'event',
        header: 'Event',
        cell: ({ row }) => (
          <span className="text-xs text-foreground/90">
            {row.original.msg?.eventType ?? row.original.msgId}
          </span>
        ),
      },
      {
        id: 'duration',
        header: 'Duration',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.responseDurationMs} ms
          </span>
        ),
      },
      {
        id: 'when',
        header: 'When',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.timestamp
              ? formatDistanceToNow(new Date(row.original.timestamp), {
                  addSuffix: true,
                })
              : '-'}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <>
      <DataTable
        card
        columns={columns}
        data={attempts}
        isLoading={isLoading}
        skeletonRows={4}
        onRowClick={setSelected}
        emptyMessage={
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">No deliveries yet.</p>
            <p className="text-xs text-muted-foreground/70">
              Send a test event or wait for real activity to see delivery
              attempts here.
            </p>
          </div>
        }
      />

      <Sheet
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <SheetContent className="w-full sm:max-w-xl border-border/60">
          <SheetHeader>
            <SheetTitle className="text-foreground">
              Delivery attempt
            </SheetTitle>
            <SheetDescription>
              {selected?.id && (
                <code className="font-mono text-[10px] text-muted-foreground break-all">
                  {selected.id}
                </code>
              )}
            </SheetDescription>
          </SheetHeader>
          {selected && (
            <div className="overflow-y-auto px-4 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Status">{statusBadge(selected.status)}</Field>
                <Field label="HTTP code">
                  <span
                    className={`font-mono ${statusCodeColor(selected.responseStatusCode)}`}
                  >
                    {selected.responseStatusCode}
                  </span>
                </Field>
                <Field label="Duration">{selected.responseDurationMs} ms</Field>
                <Field label="When">
                  {selected.timestamp
                    ? new Date(selected.timestamp).toLocaleString()
                    : '-'}
                </Field>
              </div>
              <Field label="URL">
                <code className="font-mono text-xs text-foreground/90 break-all">
                  {selected.url}
                </code>
              </Field>
              <Field label="Event type">
                <code className="font-mono text-xs text-foreground/90">
                  {selected.msg?.eventType ?? '-'}
                </code>
              </Field>
              <Field label="Response body">
                <pre className="text-xs text-foreground/90 bg-card border border-border/60 rounded-md p-3 overflow-x-auto whitespace-pre-wrap break-all">
                  {selected.response || '(empty)'}
                </pre>
              </Field>
              {selected.msg?.payload && (
                <Field label="Payload">
                  <pre className="text-xs text-foreground/90 bg-card border border-border/60 rounded-md p-3 overflow-x-auto">
                    {JSON.stringify(selected.msg.payload, null, 2)}
                  </pre>
                </Field>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div>{children}</div>
    </div>
  );
}
