import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
  useNavigate,
} from '@tanstack/react-router';
import { useState } from 'react';
import { ArrowLeft, Send, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WebhookTestEventDialog } from '@/components/webhooks/webhook-test-event-dialog';
import { WebhookDeleteDialog } from '@/components/webhooks/webhook-delete-dialog';
import { useWebhookEndpoint } from '@/hooks/api/use-webhooks';
import { ROUTES } from '@/lib/constants/routes';

export const Route = createFileRoute('/_authenticated/webhooks/$endpointId')({
  component: WebhookDetailLayout,
});

function WebhookDetailLayout() {
  const { endpointId } = Route.useParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const endpoint = useWebhookEndpoint(endpointId);

  const [isTestOpen, setIsTestOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  if (endpoint.isLoading) {
    return (
      <div className="p-8">
        <div className="space-y-3 rounded-2xl border border-border/60 bg-gradient-to-br from-card/80 to-card/40 p-6 backdrop-blur-xl animate-pulse">
          <div className="h-6 w-1/3 rounded bg-muted" />
          <div className="h-32 rounded bg-muted/50" />
        </div>
      </div>
    );
  }

  if (endpoint.error || !endpoint.data) {
    return (
      <div className="p-8">
        <Link to={ROUTES.webhooks}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-card/80 to-card/40 p-8 text-center backdrop-blur-xl">
          <p className="text-muted-foreground">
            Webhook not found or failed to load.
          </p>
        </div>
      </div>
    );
  }

  const ep = endpoint.data;
  const segment = pathname.split('/').pop() ?? '';
  const activeTab = segment === 'deliveries' ? 'deliveries' : 'overview';

  return (
    <div className="p-8">
      <Link to={ROUTES.webhooks}>
        <Button variant="ghost" size="sm" className="mb-4 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Back to webhooks
        </Button>
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-medium text-foreground">
            {ep.description || 'Webhook endpoint'}
          </h1>
          <code className="break-all font-mono text-xs text-muted-foreground">
            {ep.url}
          </code>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" onClick={() => setIsTestOpen(true)}>
            <Send className="h-4 w-4" />
            Send test
          </Button>
          <Button
            variant="outline"
            className="border-destructive-muted/30 text-destructive-muted hover:bg-destructive-muted/10"
            onClick={() => setIsDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(tab) =>
          navigate({
            to: '/webhooks/$endpointId/$tab',
            params: { endpointId, tab },
          })
        }
        variant="underline"
      >
        <div className="border-b border-border">
          <TabsList className="border-b-0">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      <div className="mt-6">
        <Outlet />
      </div>

      <WebhookTestEventDialog
        endpointId={ep.id}
        open={isTestOpen}
        onOpenChange={setIsTestOpen}
      />
      <WebhookDeleteDialog
        endpointId={isDeleteOpen ? ep.id : null}
        url={ep.url}
        onClose={() => setIsDeleteOpen(false)}
        onDeleted={() => navigate({ to: ROUTES.webhooks })}
      />
    </div>
  );
}
