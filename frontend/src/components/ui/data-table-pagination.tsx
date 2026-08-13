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
}: DataTablePaginationProps) {
  if (pageCount <= 0) {
    return null;
  }

  const canPrevious = page > 0;
  const canNext = page < pageCount - 1;
  const from = total === 0 ? 0 : page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, total);

  return (
    <div className="flex items-center justify-between border-t border-border p-4">
      <div className="text-sm text-muted-foreground">
        Showing{' '}
        <span className="font-medium text-foreground/90">{from}</span> to{' '}
        <span className="font-medium text-foreground/90">{to}</span> of{' '}
        <span className="font-medium text-foreground/90">{total}</span>{' '}
        {itemLabel}
      </div>

      {pageCount > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => canPrevious && onPageChange(page - 1)}
                className={
                  canPrevious
                    ? 'cursor-pointer'
                    : 'pointer-events-none opacity-50'
                }
              />
            </PaginationItem>

            {getPageNumbers(page, pageCount).map((pageNum, idx) =>
              pageNum === 'ellipsis' ? (
                <PaginationItem key={`ellipsis-${idx}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => onPageChange(pageNum)}
                    isActive={page === pageNum}
                    className="cursor-pointer"
                  >
                    {pageNum + 1}
                  </PaginationLink>
                </PaginationItem>
              )
            )}

            <PaginationItem>
              <PaginationNext
                onClick={() => canNext && onPageChange(page + 1)}
                className={
                  canNext ? 'cursor-pointer' : 'pointer-events-none opacity-50'
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
