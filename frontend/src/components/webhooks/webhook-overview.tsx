import { Copy } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { WebhookForm } from '@/components/webhooks/webhook-form';
import { WebhookSecretReveal } from '@/components/webhooks/webhook-secret-reveal';
import {
  useUpdateWebhookEndpoint,
  useWebhookEndpoint,
} from '@/hooks/api/use-webhooks';

export function WebhookOverview({ endpointId }: { endpointId: string }) {
  const endpoint = useWebhookEndpoint(endpointId);
  const update = useUpdateWebhookEndpoint();
  const ep = endpoint.data;

  if (!ep) return null;

  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-2xl border border-border/60 bg-gradient-to-br from-card/80 to-card/40 p-5 backdrop-blur-xl">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Endpoint ID
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 break-all font-mono text-xs text-foreground/90">
            {ep.id}
          </code>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 shrink-0 p-0 text-muted-foreground hover:text-foreground/90"
            onClick={() => {
              navigator.clipboard.writeText(ep.id);
              toast.success('Endpoint ID copied');
            }}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-card/80 to-card/40 p-5 backdrop-blur-xl">
        <h3 className="mb-4 text-sm font-medium text-foreground">
          Configuration
        </h3>
        <WebhookForm
          initial={ep}
          submitLabel="Save changes"
          isSubmitting={update.isPending}
          onSubmit={(data) =>
            update.mutate({
              id: ep.id,
              data: {
                url: data.url,
                description: data.description ?? null,
                filter_types: data.filter_types ?? null,
                user_id: data.user_id ?? null,
              },
            })
          }
        />
      </div>

      <WebhookSecretReveal endpointId={ep.id} />
    </div>
  );
}
