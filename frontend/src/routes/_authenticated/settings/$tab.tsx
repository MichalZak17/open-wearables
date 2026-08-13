import type { ComponentType } from 'react';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { CredentialsTab } from '@/components/settings/credentials-tab';
import { ProvidersTab } from '@/components/settings/providers-tab';
import { PrioritiesTab } from '@/components/settings/priorities-tab';
import { DataLifecycleTab } from '@/components/settings/data-lifecycle-tab';
import { TeamTab } from '@/components/settings/team-tab';
import { SecurityTab } from '@/components/settings/security-tab';
import { SeedDataTab } from '@/components/settings/seed-data-tab';

/** Maps the `$tab` URL segment to the tab's content. Keep in sync with the
 * tab bar in the settings layout ({@link ../settings.tsx}). */
const TAB_COMPONENTS: Record<string, ComponentType> = {
  credentials: CredentialsTab,
  providers: ProvidersTab,
  priorities: PrioritiesTab,
  'data-lifecycle': DataLifecycleTab,
  team: TeamTab,
  security: SecurityTab,
  'seed-data': SeedDataTab,
};

export const Route = createFileRoute('/_authenticated/settings/$tab')({
  beforeLoad: ({ params }) => {
    if (!TAB_COMPONENTS[params.tab]) {
      throw redirect({ to: '/settings/$tab', params: { tab: 'credentials' } });
    }
  },
  component: SettingsTabRoute,
});

function SettingsTabRoute() {
  const { tab } = Route.useParams();
  const TabComponent = TAB_COMPONENTS[tab];
  return TabComponent ? <TabComponent /> : null;
}
