import { createFileRoute, redirect, Link } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/use-auth';
import { isAuthenticated } from '@/lib/auth/session';
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from '@/lib/validation/auth.schemas';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { LogoMark } from '@/components/common/logo-mark';
import { AuthShell } from '@/components/auth/auth-shell';
import { PasswordInput } from '@/components/auth/password-input';
import { DEFAULT_REDIRECTS, ROUTES } from '@/lib/constants/routes';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export const Route = createFileRoute('/reset-password')({
  component: ResetPasswordPage,
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || '',
  }),
  beforeLoad: () => {
    if (typeof window !== 'undefined' && isAuthenticated()) {
      throw redirect({ to: DEFAULT_REDIRECTS.authenticated });
    }
  },
});

function ResetPasswordPage() {
  const { token } = Route.useSearch();
  const { resetPassword, isResetPasswordPending } = useAuth();

  useEffect(() => {
    if (token && typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/reset-password');
    }
  }, [token]);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (data: ResetPasswordFormData) => {
    if (!token) return;
    resetPassword({ token, password: data.password });
  };

  // Error state - no token
  if (!token) {
    return (
      <AuthShell>
        <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="border-b border-border p-8">
            <div className="mb-8 flex items-center gap-2.5">
              <LogoMark className="size-8 text-foreground" />
              <span className="text-lg font-bold tracking-tight text-foreground">
                Open Wearables
              </span>
            </div>

            <div className="py-4 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="mb-2 text-xl font-medium text-foreground">
                Invalid reset link
              </h2>
              <p className="text-sm text-muted-foreground">
                This password reset link is invalid or has expired. Please
                request a new one.
              </p>
            </div>
          </div>

          <div className="space-y-4 p-8">
            <Button asChild className="w-full">
              <Link to={ROUTES.forgotPassword}>Request new reset link</Link>
            </Button>
          </div>

          <div className="border-t border-border bg-background-elevated px-8 py-6">
            <Link
              to={ROUTES.login}
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Link>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="border-b border-border p-8">
          <div className="mb-8 flex items-center gap-2.5">
            <LogoMark className="size-8 text-foreground" />
            <span className="text-lg font-bold tracking-tight text-foreground">
              Open Wearables
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Set new password
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your new password below
          </p>
        </div>

        <div className="space-y-6 p-8">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* New Password */}
            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-xs text-foreground-muted"
              >
                New password
              </Label>
              <PasswordInput
                id="password"
                {...form.register('password')}
                placeholder="At least 8 characters"
              />
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label
                htmlFor="confirmPassword"
                className="text-xs text-foreground-muted"
              >
                Confirm new password
              </Label>
              <PasswordInput
                id="confirmPassword"
                {...form.register('confirmPassword')}
                placeholder="Confirm your password"
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isResetPasswordPending}
              className="w-full"
            >
              {isResetPasswordPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Resetting password...
                </>
              ) : (
                'Reset password'
              )}
            </Button>
          </form>
        </div>

        <div className="border-t border-border bg-background-elevated px-8 py-6">
          <Link
            to={ROUTES.login}
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
