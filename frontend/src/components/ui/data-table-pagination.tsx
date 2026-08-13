import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

export interface DataTablePaginationProps {
  /** Zero-based index of the current page. */
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  /** Plural noun for the count summary, e.g. "users". */
  itemLabel?: string;
  /**
   * When provided, renders a "Rows per page" selector. Omit both to keep a
   * fixed page size (existing behaviour).
   */
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

function getPageNumbers(
  currentPage: number,
  pageCount: number
): (number | 'ellipsis')[] {
  const pages: (number | 'ellipsis')[] = [];
  const maxVisible = 5;

  if (pageCount <= maxVisible) {
    for (let i = 0; i < pageCount; i++) {
      pages.push(i);
    }
    return pages;
  }

  pages.push(0);

  if (currentPage > 2) {
    pages.push('ellipsis');
  }

  const start = Math.max(1, currentPage - 1);
  const end = Math.min(pageCount - 2, currentPage + 1);

  for (let i = start; i <= end; i++) {
    if (!pages.includes(i)) {
      pages.push(i);
    }
  }

  if (currentPage < pageCount - 3) {
    pages.push('ellipsis');
  }

  if (!pages.includes(pageCount - 1)) {
    pages.push(pageCount - 1);
  }

  return pages;
}

export function DataTablePagination({
  page,
  pageCount,
  pageSize,
  total,
  onPageChange,
  itemLabel = 'results',
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}: DataTablePaginationProps) {
  if (pageCount <= 0) {
    return null;
  }

  const canPrevious = page > 0;
  const canNext = page < pageCount - 1;
  const from = total === 0 ? 0 : page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, total);

  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
        {onPageSizeChange && (
          <label className="flex items-center gap-2">
            <span className="whitespace-nowrap">Rows per page</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-8 rounded-md border border-border bg-muted px-2 text-sm text-foreground outline-none transition-colors hover:border-primary/30 focus-visible:border-primary/50 focus-visible:ring-1 focus-visible:ring-ring"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        )}
        <p className="whitespace-nowrap tabular-nums">
          <span className="font-medium text-foreground/90">
            {from}&ndash;{to}
          </span>{' '}
          of <span className="font-medium text-foreground/90">{total}</span>{' '}
          {itemLabel}
        </p>
      </div>

      {pageCount > 1 && (
        <Pagination className="mx-0 w-auto justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => canPrevious && onPageChange(page - 1)}
                aria-disabled={!canPrevious}
                className={
                  canPrevious
                    ? 'cursor-pointer'
                    : 'pointer-events-none opacity-40'
                }
              />
            </PaginationItem>

            {getPageNumbers(page, pageCount).map((pageNum, idx) =>
              pageNum === 'ellipsis' ? (
                <PaginationItem
                  key={`ellipsis-${idx}`}
                  className="hidden sm:list-item"
                >
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => onPageChange(pageNum)}
                    isActive={page === pageNum}
                    className="cursor-pointer tabular-nums"
                  >
                    {pageNum + 1}
                  </PaginationLink>
                </PaginationItem>
              )
            )}

            <PaginationItem>
              <PaginationNext
                onClick={() => canNext && onPageChange(page + 1)}
                aria-disabled={!canNext}
                className={
                  canNext ? 'cursor-pointer' : 'pointer-events-none opacity-40'
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
