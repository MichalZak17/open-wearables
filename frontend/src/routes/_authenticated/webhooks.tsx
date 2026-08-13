import { createFileRoute, Outlet } from '@tanstack/react-router';
import { FlaskConical } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export const Route = createFileRoute('/_authenticated/webhooks')({
  component: WebhooksLayout,
});

function WebhooksLayout() {
  return (
    <>
      <div className="px-8 pt-8">
        <Alert variant="warning">
          <FlaskConical className="h-4 w-4" />
          <AlertTitle>Beta</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            Webhooks are in beta. The API and delivery behavior may change, and
            we don't recommend relying on them for production workloads yet.
          </AlertDescription>
        </Alert>
      </div>
      <Outlet />
    </>
  );
}
