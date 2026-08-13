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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
  pageCount: number;
  sorting: SortingState;
  onSortingChange: Dispatch<SetStateAction<SortingState>>;
  pagination: PaginationState;
  onPaginationChange: Dispatch<SetStateAction<PaginationState>>;
  /** Invoked when a row is activated (click / Enter / Space). */
  onRowClick?: (row: TData) => void;
  emptyMessage?: ReactNode;
}

/**
 * Reusable table built on the shadcn "base" data-table pattern
 * (@tanstack/react-table v9 `useTable` + the shared Table primitives).
 * Configured for server-side (manual) sorting and pagination.
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
}: DataTableProps<TData>) {
  const table = useTable({
    features,
    data,
    columns,
    state: { sorting, pagination },
    onSortingChange,
    onPaginationChange,
    manualPagination: true,
    manualSorting: true,
    pageCount,
  });

  const rows = table.getRowModel().rows;
  const interactive = Boolean(onRowClick);

  return (
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
}
