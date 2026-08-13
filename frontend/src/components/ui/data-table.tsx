import type { Dispatch, ReactNode, SetStateAction } from 'react';
import {
  useTable,
  tableFeatures,
  rowSortingFeature,
  rowPaginationFeature,
  type ColumnDef,
  type RowData,
  type SortingState,
  type PaginationState,
} from '@tanstack/react-table';
import { Card } from '@/components/ui/card';
import { DataTableSkeleton } from '@/components/ui/data-table-skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

const features = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
});

/** Feature set shared by every DataTable column definition. */
export type DataTableFeatures = typeof features;

export interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<DataTableFeatures, TData>[];
  data: TData[];
  /** Total number of server-side pages (manual pagination). */
  pageCount?: number;
  /** Sorting state. Omit for a static (non-sortable) table. */
  sorting?: SortingState;
  onSortingChange?: Dispatch<SetStateAction<SortingState>>;
  /** Pagination state. Omit to render every row (no client pagination). */
  pagination?: PaginationState;
  onPaginationChange?: Dispatch<SetStateAction<PaginationState>>;
  /** Invoked when a row is activated (click / Enter / Space). */
  onRowClick?: (row: TData) => void;
  emptyMessage?: ReactNode;
  /** When true, render a {@link DataTableSkeleton} instead of the rows. */
  isLoading?: boolean;
  /** Row count for the loading skeleton. */
  skeletonRows?: number;
  /** Wrap the table (and any toolbar/footer) in a bordered {@link Card}. */
  card?: boolean;
  /** Extra classes for the Card wrapper (only applies when `card`). */
  className?: string;
  /** Content rendered above the table (e.g. search/filters), inside the card. */
  toolbar?: ReactNode;
  /** Content rendered below the table (e.g. a pagination footer). */
  footer?: ReactNode;
}

/**
 * Reusable table built on the shadcn "base" data-table pattern
 * (@tanstack/react-table v9 `useTable` + the shared Table primitives).
 *
 * Sorting and pagination are optional: pass the state + change handlers for
 * server-side (manual) sorting/pagination, or omit them for a static table.
 * Pass `card`/`toolbar`/`footer`/`isLoading` to let the component own the full
 * shell (card wrapper, toolbar, pagination footer, loading skeleton) instead of
 * each caller rebuilding it.
 */
export function DataTable<TData extends RowData>({
  columns,
  data,
  pageCount,
  sorting,
  onSortingChange,
  pagination,
  onPaginationChange,
  onRowClick,
  emptyMessage = 'No results.',
  isLoading,
  skeletonRows,
  card,
  className,
  toolbar,
  footer,
}: DataTableProps<TData>) {
  const table = useTable({
    features,
    data,
    columns,
    state: {
      sorting: sorting ?? [],
      // Without a pagination prop, show every row (a single big page).
      pagination: pagination ?? {
        pageIndex: 0,
        pageSize: Math.max(data.length, 1),
      },
    },
    onSortingChange,
    onPaginationChange,
    manualPagination: Boolean(onPaginationChange),
    manualSorting: Boolean(onSortingChange),
    pageCount: pageCount ?? -1,
  });

  const rows = table.getRowModel().rows;
  const interactive = Boolean(onRowClick);

  const body = isLoading ? (
    <DataTableSkeleton columns={columns.length} rows={skeletonRows} />
  ) : (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {header.isPlaceholder ? null : (
                  <table.FlexRender header={header} />
                )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {rows.length ? (
          rows.map((row) => (
            <TableRow
              key={row.id}
              role={interactive ? 'link' : undefined}
              tabIndex={interactive ? 0 : undefined}
              className={
                interactive
                  ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring'
                  : undefined
              }
              onClick={
                interactive ? () => onRowClick?.(row.original) : undefined
              }
              onKeyDown={
                interactive
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onRowClick?.(row.original);
                      }
                    }
                  : undefined
              }
            >
              {row.getAllCells().map((cell) => (
                <TableCell key={cell.id}>
                  <table.FlexRender cell={cell} />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell
              colSpan={columns.length}
              className="h-24 text-center text-muted-foreground"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  if (!card && !toolbar && !footer) {
    return body;
  }

  const content = (
    <>
      {toolbar && <div className="border-b border-border p-4">{toolbar}</div>}
      {body}
      {footer}
    </>
  );

  return card ? (
    <Card className={cn('overflow-hidden rounded-xl', className)}>
      {content}
    </Card>
  ) : (
    content
  );
}
