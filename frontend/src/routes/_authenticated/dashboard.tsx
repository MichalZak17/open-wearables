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
import { PageHeader } from '@/components/ui/page-header';
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
  const { data: recentlyAddedUsers, isLoading: isLoadingRecent } = useUsers({
    sort_by: 'created_at',
    sort_order: 'desc',
    limit: 5,
  });

  if (isLoading) {
    return <DashboardLoadingState />;
  }

  if (error || !stats) {
    return <DashboardErrorState onRetry={refetch} />;
  }

  const syncedUsers = (lastSyncedUsers?.items ?? []).filter(
    (user) => user.last_synced_at
  );
  const recentUsers = recentlyAddedUsers?.items ?? [];

  return (
    <div className="space-y-6 p-6 md:p-8">
      <PageHeader
        title="Dashboard"
        description="Your platform overview and key metrics"
      />

      <StatsGrid stats={stats} />

      <Card
        role="region"
        aria-label="Connection coverage"
        className="overflow-hidden rounded-xl"
      >
        <DataMetricsSection
          connectionsCoverage={stats.connections_coverage}
          totalUsers={stats.total_users.count}
        />
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card
          role="region"
          aria-label="Providers"
          className="overflow-hidden rounded-xl lg:col-span-1"
        >
          <ProvidersSection
            providers={stats.connections_coverage.top_providers}
          />
        </Card>
        <Card
          role="region"
          aria-label="Recent activity"
          className="overflow-hidden rounded-xl lg:col-span-2"
        >
          <RecentUsersSection
            users={recentUsers}
            lastSyncedUsers={syncedUsers}
            isLoading={isLoadingRecent}
            isLoadingLastSynced={isLoadingLastSynced}
          />
        </Card>
      </div>
    </div>
  );
}
