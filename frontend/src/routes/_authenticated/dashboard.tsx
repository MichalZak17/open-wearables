import { createFileRoute } from '@tanstack/react-router';
import {
  DashboardErrorState,
  DashboardLoadingState,
  DataMetricsSection,
  ProvidersSection,
  RecentUsersSection,
  StatsGrid,
} from '@/components/pages/dashboard';
import { Card } from '@/components/ui/card';
import { useDashboardStats } from '@/hooks/api/use-dashboard';
import { useUsers } from '@/hooks/api/use-users';

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  const { data: stats, isLoading, error, refetch } = useDashboardStats();
  const { data: lastSyncedUsers, isLoading: isLoadingLastSynced } = useUsers({
    sort_by: 'last_synced_at',
    sort_order: 'desc',
    limit: 5,
  });

  if (isLoading) {
    return <DashboardLoadingState />;
  }

  if (error || !stats) {
    return <DashboardErrorState onRetry={refetch} />;
  }

  const recentUsers = (lastSyncedUsers?.items ?? []).filter(
    (user) => user.last_synced_at
  );

  return (
    <div className="min-h-full px-4 py-7 sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto w-full max-w-[96rem]">
        <header>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/8 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-success-muted">
            <span
              className="size-1.5 rounded-full bg-success"
              aria-hidden="true"
            />
            Live
          </div>
          <h1 className="mt-2.5 text-3xl font-semibold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your platform overview and key metrics
          </p>
        </header>

        <Card
          role="region"
          aria-label="Platform overview"
          className="mt-6 overflow-hidden rounded-xl"
        >
          <StatsGrid stats={stats} />
          <DataMetricsSection
            connectionsCoverage={stats.connections_coverage}
            totalUsers={stats.total_users.count}
          />
        </Card>

        <Card
          role="region"
          aria-label="Providers and recent activity"
          className="mt-5 grid overflow-hidden rounded-xl lg:grid-cols-[minmax(20rem,5fr)_minmax(30rem,7fr)] lg:divide-x lg:divide-border"
        >
          <ProvidersSection
            providers={stats.connections_coverage.top_providers}
          />
          <RecentUsersSection
            users={recentUsers}
            isLoading={isLoadingLastSynced}
            className="border-t border-border lg:border-t-0"
          />
        </Card>
      </div>
    </div>
  );
}
