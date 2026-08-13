import { createFileRoute, redirect, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/use-auth';
import { isAuthenticated } from '@/lib/auth/session';
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from '@/lib/validation/auth.schemas';
import { ArrowLeft, Mail, CheckCircle, Loader2 } from 'lucide-react';
import { LogoMark } from '@/components/common/logo-mark';
import { AuthShell } from '@/components/auth/auth-shell';
import { DEFAULT_REDIRECTS, ROUTES } from '@/lib/constants/routes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordPage,
  beforeLoad: () => {
    if (typeof window !== 'undefined' && isAuthenticated()) {
      throw redirect({ to: DEFAULT_REDIRECTS.authenticated });
    }
  },
});

function ForgotPasswordPage() {
  const { forgotPassword, isForgotPasswordPending } = useAuth();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    forgotPassword(
      { email: data.email },
      {
        onSettled: () => {
          setIsSubmitted(true);
        },
      }
    );
  };

  return (
    <AuthShell>
      {/* Card */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="border-b border-border p-8">
          <div className="mb-8 flex items-center gap-2.5">
            <LogoMark className="size-8 text-foreground" />
            <span className="text-lg font-bold tracking-tight text-foreground">
              Open Wearables
            </span>
          </div>

          {!isSubmitted ? (
            <>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Reset password
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter your email and we'll send you a reset link
              </p>
            </>
          ) : (
            <div className="py-4 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <h2 className="mb-2 text-xl font-medium text-foreground">
                Check your email
              </h2>
              <p className="text-sm text-muted-foreground">
                If an account exists with that email, we've sent password reset
                instructions.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-foreground-subtle">
                <Mail className="h-4 w-4" />
                <span>Check your inbox and spam folder</span>
              </div>
            </div>
          )}
        </div>

        {/* Form */}
        {!isSubmitted && (
          <div className="space-y-6 p-8">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="email"
                  className="text-xs text-foreground-muted"
                >
                  Email address
                </Label>
                <div className="group relative">
                  <Input
                    type="email"
                    id="email"
                    {...form.register('email')}
                    className="pr-10"
                    placeholder="you@example.com"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center opacity-0 transition-opacity group-focus-within:opacity-100">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isForgotPasswordPending}
                className="w-full"
              >
                {isForgotPasswordPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send reset link'
                )}
              </Button>
            </form>
          </div>
        )}

        {/* Footer */}
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
