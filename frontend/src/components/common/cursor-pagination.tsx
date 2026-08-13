import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface CursorPaginationProps {
  currentPage: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  isFetching?: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
  /**
   * Total number of items across all pages, when known from another source
   * (cursor responses don't carry a count). Enables a "Page X of Y" label.
   */
  totalItems?: number;
  /** Page size used to derive the page count from {@link totalItems}. */
  pageSize?: number;
  /** Plural noun for the count summary, e.g. "workouts". */
  itemLabel?: string;
}

export function CursorPagination({
  currentPage,
  hasPrevPage,
  hasNextPage,
  isFetching = false,
  onPrevPage,
  onNextPage,
  totalItems,
  pageSize,
  itemLabel = 'items',
}: CursorPaginationProps) {
  // Don't render if there's only one page
  if (!hasPrevPage && !hasNextPage) {
    return null;
  }

  // Derive the page count from an externally-known total. Clamp it against the
  // cursor's own has-next signal so the label can never contradict the buttons:
  // on the last page we know the exact total; otherwise show at least one more.
  const estimatedPages =
    totalItems !== undefined && pageSize
      ? Math.max(1, Math.ceil(totalItems / pageSize))
      : null;
  const totalPages =
    estimatedPages === null
      ? null
      : hasNextPage
        ? Math.max(estimatedPages, currentPage + 1)
        : currentPage;

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground tabular-nums">
        Page{' '}
        <span className="font-medium text-foreground/90">{currentPage}</span>
        {totalPages !== null && (
          <>
            {' '}
            of{' '}
            <span className="font-medium text-foreground/90">{totalPages}</span>
          </>
        )}
        {totalItems !== undefined && (
          <>
            {' · '}
            <span className="font-medium text-foreground/90">
              {totalItems}
            </span>{' '}
            {itemLabel}
          </>
        )}
      </p>

      <Pagination className="mx-0 w-auto justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={onPrevPage}
              aria-disabled={!hasPrevPage || isFetching}
              className={
                !hasPrevPage || isFetching
                  ? 'pointer-events-none opacity-40'
                  : 'cursor-pointer'
              }
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              onClick={onNextPage}
              aria-disabled={!hasNextPage || isFetching}
              className={
                !hasNextPage || isFetching
                  ? 'pointer-events-none opacity-40'
                  : 'cursor-pointer'
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
