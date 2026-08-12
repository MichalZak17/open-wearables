import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { Sidebar } from '@/components/layout/sidebar';
import { isAuthenticated } from '@/lib/auth/session';
import { DEFAULT_REDIRECTS } from '@/lib/constants/routes';

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedLayout,
  beforeLoad: () => {
    // Skip auth check during SSR - localStorage is not available on the server
    // The check will run on the client after hydration
    if (typeof window === 'undefined') {
      return;
    }
    if (!isAuthenticated()) {
      throw redirect({ to: DEFAULT_REDIRECTS.unauthenticated });
    }
  },
});

function AuthenticatedLayout() {
  return (
    <div className="flex min-h-svh w-full flex-col bg-background md:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 bg-background md:h-svh md:overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
