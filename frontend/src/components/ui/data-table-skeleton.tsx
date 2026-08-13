import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface DataTableSkeletonProps {
  /** Number of columns to render skeleton cells for. */
  columns: number;
  /** Number of placeholder rows. Defaults to the page size feel (8). */
  rows?: number;
  /** Render the header row. Defaults to true. */
  showHeader?: boolean;
}

/**
 * Shared loading placeholder for tables. Mirrors the {@link DataTable} layout
 * (a header row plus N body rows) so every table shows the same skeleton
 * instead of hand-rolling its own.
 */
export function DataTableSkeleton({
  columns,
  rows = 8,
  showHeader = true,
}: DataTableSkeletonProps) {
  return (
    <Table>
      {showHeader && (
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {Array.from({ length: columns }).map((_, i) => (
              <TableHead key={i}>
                <Skeleton className="h-3 w-20" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
      )}
      <TableBody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <TableRow key={rowIndex} className="hover:bg-transparent">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <TableCell key={colIndex} className="h-14">
                <Skeleton className="h-3.5 w-full max-w-[120px]" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
