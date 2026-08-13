import {
  createFileRoute,
  Outlet,
  useLocation,
  useNavigate,
} from '@tanstack/react-router';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/page-header';

export const Route = createFileRoute('/_authenticated/settings')({
  component: SettingsLayout,
});

const TABS = [
  { id: 'credentials', label: 'Credentials' },
  { id: 'providers', label: 'Providers' },
  { id: 'priorities', label: 'Priorities' },
  { id: 'data-lifecycle', label: 'Data Lifecycle' },
  { id: 'team', label: 'Team' },
  { id: 'security', label: 'Security' },
  { id: 'seed-data', label: 'Seed Data' },
];

function SettingsLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const segment = pathname.split('/').pop() ?? '';
  const activeTab = TABS.find((t) => t.id === segment)?.id ?? 'credentials';

  return (
    <div className="space-y-6 p-6 md:p-8">
      <PageHeader
        title="Settings"
        description="Manage your settings and preferences"
      />

      <Tabs
        value={activeTab}
        onValueChange={(tab) =>
          navigate({ to: '/settings/$tab', params: { tab } })
        }
        variant="underline"
      >
        <div className="border-b border-border">
          <TabsList className="border-b-0">
            {TABS.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      <Outlet />
    </div>
  );
}
