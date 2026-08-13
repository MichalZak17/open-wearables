import { useEffect, useMemo, useState } from 'react';

export interface ClientPagination<T> {
  /** Clamped current page index (0-based). */
  page: number;
  setPage: (page: number) => void;
  /** Number of pages (at least 1). */
  pageCount: number;
  /** Total item count across all pages. */
  total: number;
  /** Items for the current page. */
  pageItems: T[];
}

/**
 * Client-side pagination for an already-loaded array: slices the current page
 * and keeps the page index in range when the list shrinks (e.g. after a filter
 * change). Shared by tables that page over data held in memory rather than via
 * a server cursor.
 */
export function useClientPagination<T>(
  items: T[],
  pageSize: number
): ClientPagination<T> {
  const [page, setPage] = useState(0);

  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount - 1);

  useEffect(() => {
    if (page > pageCount - 1) setPage(pageCount - 1);
  }, [page, pageCount]);

  const pageItems = useMemo(
    () => items.slice(safePage * pageSize, (safePage + 1) * pageSize),
    [items, safePage, pageSize]
  );

  return { page: safePage, setPage, pageCount, total, pageItems };
}
