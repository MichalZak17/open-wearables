import {
  createFileRoute,
  redirect,
  Link,
  useNavigate,
} from '@tanstack/react-router';
import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAuthenticated } from '@/lib/auth/session';
import { getCopyrightText } from '@/lib/constants/app';
import {
  acceptInvitationSchema,
  type AcceptInvitationFormData,
} from '@/lib/validation/auth.schemas';
import { useAcceptInvitation } from '@/hooks/api/use-invitations';
import {
  ArrowRight,
  AlertCircle,
  ArrowLeft,
  Users,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { LogoMark } from '@/components/common/logo-mark';
import { AuthShell } from '@/components/auth/auth-shell';
import { PasswordInput } from '@/components/auth/password-input';
import { DEFAULT_REDIRECTS, ROUTES } from '@/lib/constants/routes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const Route = createFileRoute('/accept-invite')({
  component: AcceptInvitePage,
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || '',
  }),
  beforeLoad: () => {
    if (typeof window !== 'undefined' && isAuthenticated()) {
      throw redirect({ to: DEFAULT_REDIRECTS.authenticated });
    }
  },
});

const STATUS_CONFIG = {
  success: {
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
    icon: CheckCircle2,
    title: 'Welcome to the Team!',
    description:
      'Your account has been created successfully. Redirecting you to sign in...',
  },
  invalid: {
    iconBg: 'bg-destructive/10',
    iconColor: 'text-destructive',
    icon: AlertCircle,
    title: 'Invalid Invitation Link',
    description:
      'This invitation link is invalid or has expired. Please contact your team administrator for a new invitation.',
  },
} as const;

function AcceptInvitePage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const acceptInvitationMutation = useAcceptInvitation();
  const [isSuccess, setIsSuccess] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<AcceptInvitationFormData>({
    resolver: zodResolver(acceptInvitationSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const onSubmit = (data: AcceptInvitationFormData) => {
    if (!token) return;

    acceptInvitationMutation.mutate(
      {
        token,
        first_name: data.first_name,
        last_name: data.last_name,
        password: data.password,
      },
      {
        onSuccess: () => {
          setIsSuccess(true);
          timeoutRef.current = setTimeout(() => {
            navigate({ to: ROUTES.login });
          }, 2000);
        },
        onError: (error) => {
          form.setError('root', {
            type: 'manual',
            message:
              error.message ||
              'Failed to accept invitation. The link may be invalid or expired.',
          });
        },
      }
    );
  };

  // Determine current status
  const status = isSuccess ? 'success' : !token ? 'invalid' : 'form';
  const config = status !== 'form' ? STATUS_CONFIG[status] : null;

  return (
    <AuthShell>
      {/* Status Card (Success or Invalid) */}
      {config && (
        <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="border-b border-border p-8">
            <div className="mb-8 flex items-center gap-2.5">
              <LogoMark className="size-8 text-foreground" />
              <span className="text-lg font-bold tracking-tight text-foreground">
                Open Wearables
              </span>
            </div>
            <div className="py-4 text-center">
              <div
                className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full ${config.iconBg}`}
              >
                <config.icon className={`h-8 w-8 ${config.iconColor}`} />
              </div>
              <h2 className="mb-2 text-xl font-medium text-foreground">
                {config.title}
              </h2>
              <p className="text-sm text-muted-foreground">
                {config.description}
              </p>
            </div>
          </div>

          {status === 'success' ? (
            <div className="p-8">
              <Button asChild className="w-full">
                <Link to={ROUTES.login}>
                  Sign in now
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="border-t border-border bg-background-elevated px-8 py-6">
              <Link
                to={ROUTES.login}
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Form Card */}
      {!config && (
        <div className="relative z-10 grid h-full max-h-[700px] w-full max-w-[1100px] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl lg:grid-cols-2">
          <div className="flex flex-col justify-between border-b border-border bg-card p-8 sm:p-12 lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-2.5">
              <LogoMark className="size-8 text-foreground" />
              <span className="text-lg font-bold tracking-tight text-foreground">
                Open Wearables
              </span>
            </div>

            <div className="mx-auto my-auto w-full max-w-sm space-y-6 py-8">
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  Accept invitation
                </h1>
                <p className="text-sm text-muted-foreground">
                  Complete your account setup to join the team
                </p>
              </div>

              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="first_name"
                      className="text-xs text-foreground-muted"
                    >
                      First name
                    </Label>
                    <Input
                      id="first_name"
                      placeholder="John"
                      {...form.register('first_name')}
                    />
                    {form.formState.errors.first_name && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.first_name.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="last_name"
                      className="text-xs text-foreground-muted"
                    >
                      Last name
                    </Label>
                    <Input
                      id="last_name"
                      placeholder="Doe"
                      {...form.register('last_name')}
                    />
                    {form.formState.errors.last_name && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.last_name.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="password"
                    className="text-xs text-foreground-muted"
                  >
                    Password
                  </Label>
                  <PasswordInput
                    id="password"
                    placeholder="At least 8 characters"
                    {...form.register('password')}
                  />
                  {form.formState.errors.password && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-xs text-foreground-muted"
                  >
                    Confirm password
                  </Label>
                  <PasswordInput
                    id="confirmPassword"
                    placeholder="Confirm your password"
                    {...form.register('confirmPassword')}
                  />
                  {form.formState.errors.confirmPassword && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                {form.formState.errors.root && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.root.message}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={acceptInvitationMutation.isPending}
                  className="w-full"
                >
                  {acceptInvitationMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Join team
                      <ArrowRight className="h-4 w-4 opacity-60" />
                    </>
                  )}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link
                  to={ROUTES.login}
                  className="font-medium text-foreground transition-colors hover:text-primary-muted"
                >
                  Sign in
                </Link>
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-foreground-subtle">
              <p>{getCopyrightText()}</p>
            </div>
          </div>

          <div className="relative hidden flex-col overflow-hidden bg-background-elevated lg:flex">
            <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.05] blur-[80px]" />
            <div className="relative flex h-full flex-col items-center justify-center p-8">
              <div className="w-full max-w-[350px] space-y-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-center text-xl font-medium text-foreground">
                  You've been invited
                </h2>
                <p className="text-center text-sm text-muted-foreground">
                  A team member has invited you to join their organization on
                  Open Wearables. Complete your registration to get started.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
