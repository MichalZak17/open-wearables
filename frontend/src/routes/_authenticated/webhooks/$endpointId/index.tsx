import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/webhooks/$endpointId/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/webhooks/$endpointId/$tab',
      params: { endpointId: params.endpointId, tab: 'overview' },
    });
  },
});
