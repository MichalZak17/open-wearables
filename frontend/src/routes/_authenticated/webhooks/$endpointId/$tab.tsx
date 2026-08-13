import type { ComponentType } from 'react';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { WebhookOverview } from '@/components/webhooks/webhook-overview';
import { WebhookDeliveries } from '@/components/webhooks/webhook-deliveries';

/** Maps the `$tab` URL segment to the tab's content. Keep in sync with the
 * tab bar in the layout ({@link ../$endpointId.tsx}). */
const TAB_COMPONENTS: Record<string, ComponentType<{ endpointId: string }>> = {
  overview: WebhookOverview,
  deliveries: WebhookDeliveries,
};

export const Route = createFileRoute(
  '/_authenticated/webhooks/$endpointId/$tab'
)({
  beforeLoad: ({ params }) => {
    if (!TAB_COMPONENTS[params.tab]) {
      throw redirect({
        to: '/webhooks/$endpointId/$tab',
        params: { endpointId: params.endpointId, tab: 'overview' },
      });
    }
  },
  component: WebhookTabRoute,
});

function WebhookTabRoute() {
  const { endpointId, tab } = Route.useParams();
  const TabComponent = TAB_COMPONENTS[tab];
  return TabComponent ? <TabComponent endpointId={endpointId} /> : null;
}
