import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { WebhookAttemptsTable } from '@/components/webhooks/webhook-attempts-table';
import { CursorPagination } from '@/components/common/cursor-pagination';
import {
  useWebhookAttempts,
  useWebhookEventTypes,
} from '@/hooks/api/use-webhooks';
import type { WebhookAttemptsParams } from '@/lib/api/types';

export function WebhookDeliveries({ endpointId }: { endpointId: string }) {
  const [attemptsParams, setAttemptsParams] = useState<WebhookAttemptsParams>({
    limit: 50,
  });
  const [iteratorStack, setIteratorStack] = useState<(string | null)[]>([]);

  const attempts = useWebhookAttempts(endpointId, attemptsParams);

  const hasPrev = iteratorStack.length > 0;
  const hasNext = !attempts.data?.done && !!attempts.data?.iterator;

  function handleNext() {
    const nextIterator = attempts.data?.iterator ?? null;
    setIteratorStack((s) => [...s, attemptsParams.iterator ?? null]);
    setAttemptsParams((p) => ({ ...p, iterator: nextIterator }));
  }

  function handlePrev() {
    const stack = [...iteratorStack];
    const prevIterator = stack.pop() ?? null;
    setIteratorStack(stack);
    setAttemptsParams((p) => ({ ...p, iterator: prevIterator }));
  }

  function handleFilterChange(patch: Partial<WebhookAttemptsParams>) {
    setIteratorStack([]);
    setAttemptsParams((p) => ({ ...p, ...patch, iterator: null }));
  }

  return (
    <div className="space-y-4">
      <DeliveriesFilters
        params={attemptsParams}
        onChange={handleFilterChange}
      />
      <WebhookAttemptsTable
        attempts={attempts.data?.data ?? []}
        isLoading={attempts.isLoading}
      />
      <CursorPagination
        currentPage={iteratorStack.length + 1}
        hasPrevPage={hasPrev}
        hasNextPage={hasNext}
        isFetching={attempts.isLoading}
        onPrevPage={handlePrev}
        onNextPage={handleNext}
        itemLabel="deliveries"
      />
    </div>
  );
}

const STATUS_OPTIONS = [
  { label: 'All statuses', value: '' },
  { label: 'Success', value: '0' },
  { label: 'Pending', value: '1' },
  { label: 'Failed', value: '2' },
  { label: 'Sending', value: '3' },
];

const LIMIT_OPTIONS = [25, 50, 100, 250];

function DeliveriesFilters({
  params,
  onChange,
}: {
  params: WebhookAttemptsParams;
  onChange: (patch: Partial<WebhookAttemptsParams>) => void;
}) {
  const eventTypes = useWebhookEventTypes();
  const [etOpen, setEtOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selected = new Set(params.event_types ?? []);

  useEffect(() => {
    if (!etOpen) return;
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setEtOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [etOpen]);

  function toggleEventType(name: string) {
    const next = new Set(selected);
    if (next.has(name)) {
      next.delete(name);
    } else {
      next.add(name);
    }
    onChange({ event_types: next.size > 0 ? Array.from(next) : undefined });
  }

  function clearEventTypes() {
    onChange({ event_types: undefined });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        className="rounded-md border border-border bg-card px-3 py-1.5 text-xs text-foreground/90 focus:outline-none focus:ring-1 focus:ring-ring"
        value={params.status ?? ''}
        onChange={(e) =>
          onChange({
            status: e.target.value !== '' ? Number(e.target.value) : null,
          })
        }
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <select
        className="rounded-md border border-border bg-card px-3 py-1.5 text-xs text-foreground/90 focus:outline-none focus:ring-1 focus:ring-ring"
        value={params.limit ?? 50}
        onChange={(e) => onChange({ limit: Number(e.target.value) })}
      >
        {LIMIT_OPTIONS.map((n) => (
          <option key={n} value={n}>
            {n} per page
          </option>
        ))}
      </select>

      {/* Event type multi-select */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setEtOpen((o) => !o)}
          className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs text-foreground/90 hover:border-border-hover focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {selected.size > 0 ? (
            <span className="text-foreground">
              {selected.size} event type{selected.size > 1 ? 's' : ''}
            </span>
          ) : (
            'All event types'
          )}
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>

        {etOpen && (
          <div className="absolute left-0 top-full z-20 mt-1 w-72 overflow-hidden rounded-lg border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Filter by event type
              </span>
              {selected.size > 0 && (
                <button
                  type="button"
                  onClick={clearEventTypes}
                  className="text-[10px] text-muted-foreground hover:text-foreground/90"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {eventTypes.isLoading ? (
                <p className="px-3 py-4 text-xs text-muted-foreground">
                  Loading…
                </p>
              ) : (
                eventTypes.data?.map((et) => (
                  <label
                    key={et.name}
                    className="flex cursor-pointer items-center gap-2.5 px-3 py-1.5 hover:bg-muted"
                  >
                    <input
                      type="checkbox"
                      className="accent-primary"
                      checked={selected.has(et.name)}
                      onChange={() => toggleEventType(et.name)}
                    />
                    <span className="font-mono text-[11px] text-foreground/90">
                      {et.name}
                    </span>
                  </label>
                ))
              )}
            </div>
            {selected.size > 0 && (
              <div className="flex flex-wrap gap-1 border-t border-border/60 px-3 py-2">
                {Array.from(selected).map((name) => (
                  <Badge
                    key={name}
                    variant="secondary"
                    className="cursor-pointer text-[10px]"
                    onClick={() => toggleEventType(name)}
                  >
                    {name} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
