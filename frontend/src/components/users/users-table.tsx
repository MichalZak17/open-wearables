'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import type { SortingState, PaginationState } from '@tanstack/react-table';
import { Loader2, Search } from 'lucide-react';
import type { UserRead, UserQueryParams } from '@/lib/api/types';
import { ROUTES } from '@/lib/constants/routes';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { Input } from '@/components/ui/input';
import {
  columnToSortBy,
  createUsersColumns,
} from '@/components/users/users-columns';

interface UsersTableProps {
  data: UserRead[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  isLoading?: boolean;
  onDelete: (userId: string) => void;
  isDeleting?: boolean;
  onQueryChange: (params: UserQueryParams) => void;
}

export function UsersTable({
  data,
  total,
  page,
  pageSize,
  pageCount,
  isLoading,
  onDelete,
  isDeleting,
  onQueryChange,
}: UsersTableProps) {
  const navigate = useNavigate();
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'created_at', desc: true },
  ]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: page - 1,
    pageSize,
  });
  const [globalFilter, setGlobalFilter] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const onQueryChangeRef = useRef(onQueryChange);
  useEffect(() => {
    onQueryChangeRef.current = onQueryChange;
  });

  const prevSearchRef = useRef(debouncedSearch);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(globalFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [globalFilter]);

  useEffect(() => {
    const searchChanged = prevSearchRef.current !== debouncedSearch;
    prevSearchRef.current = debouncedSearch;

    if (searchChanged && pagination.pageIndex !== 0) {
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
      return;
    }

    const effectivePage = searchChanged ? 1 : pagination.pageIndex + 1;
    const sortColumn = sorting[0];
    const sortBy = sortColumn ? columnToSortBy[sortColumn.id] : 'created_at';
    const sortOrder = sortColumn?.desc ? 'desc' : 'asc';

    onQueryChangeRef.current({
      page: effectivePage,
      limit: pagination.pageSize,
      sort_by: sortBy,
      sort_order: sortOrder,
      search: debouncedSearch || undefined,
    });
  }, [pagination, sorting, debouncedSearch]);

  const columns = useMemo(
    () => createUsersColumns({ onDelete, isDeleting }),
    [onDelete, isDeleting]
  );

  const goToUser = (userId: string) =>
    navigate({ to: `${ROUTES.users}/$userId`, params: { userId } });

  return (
    <Card className="overflow-hidden rounded-xl">
      <div className="border-b border-border p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name or email..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="px-9"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data}
        pageCount={pageCount}
        sorting={sorting}
        onSortingChange={setSorting}
        pagination={pagination}
        onPaginationChange={setPagination}
        onRowClick={(user) => goToUser(user.id)}
        emptyMessage={
          globalFilter
            ? 'No users match your search criteria.'
            : 'No users found'
        }
      />

      <DataTablePagination
        page={pagination.pageIndex}
        pageCount={pageCount}
        pageSize={pagination.pageSize}
        total={total}
        onPageChange={(pageIndex) =>
          setPagination((prev) => ({ ...prev, pageIndex }))
        }
        itemLabel="users"
      />
    </Card>
  );
}
