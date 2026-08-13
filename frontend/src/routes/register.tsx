import { createFileRoute, redirect, Link } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/use-auth';
import { getCopyrightText } from '@/lib/constants/app';
import { isAuthenticated } from '@/lib/auth/session';
import {
  registerSchema,
  type RegisterFormData,
} from '@/lib/validation/auth.schemas';
import { ArrowRight, Mail, ShieldCheck, Zap, Bot, Loader2 } from 'lucide-react';
import { LogoMark } from '@/components/common/logo-mark';
import { AuthShell } from '@/components/auth/auth-shell';
import { PasswordInput } from '@/components/auth/password-input';
import { DEFAULT_REDIRECTS, ROUTES } from '@/lib/constants/routes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const Route = createFileRoute('/register')({
  component: RegisterPage,
  beforeLoad: () => {
    if (typeof window !== 'undefined' && isAuthenticated()) {
      throw redirect({ to: DEFAULT_REDIRECTS.authenticated });
    }
  },
});

const FEATURES = [
  {
    icon: Zap,
    title: 'Quick Setup',
    description: 'Get started in minutes with our SDK',
  },
  {
    icon: ShieldCheck,
    title: 'Enterprise Ready',
    description: 'SOC 2, HIPAA compliant infrastructure',
  },
  {
    icon: Bot,
    title: 'AI-Powered Insights',
    description: 'Natural language automations and insights',
  },
] as const;

function RegisterPage() {
  const { register: registerUser, isRegistering } = useAuth();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    registerUser({ email: data.email, password: data.password });
  };

  return (
    <AuthShell>
      {/* Card container */}
      <div className="relative z-10 grid h-full max-h-[700px] w-full max-w-[1100px] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl lg:grid-cols-2">
        {/* Left: form */}
        <div className="flex flex-col justify-between border-b border-border bg-card p-8 sm:p-12 lg:border-b-0 lg:border-r">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <LogoMark className="size-8 text-foreground" />
            <span className="text-lg font-bold tracking-tight text-foreground">
              Open Wearables
            </span>
          </div>

          {/* Form */}
          <div className="mx-auto my-auto w-full max-w-sm space-y-6 py-8">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Create account
              </h1>
              <p className="text-sm text-muted-foreground">
                Sign up to start building with Open Wearables
              </p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Email */}
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
                    placeholder="developer@example.com"
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

              {/* Password */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="password"
                  className="text-xs text-foreground-muted"
                >
                  Password
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
                  Confirm password
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

              {/* Submit */}
              <Button type="submit" disabled={isRegistering} className="w-full">
                {isRegistering ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create account
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

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-foreground-subtle">
            <p>{getCopyrightText()}</p>
            <div className="flex gap-3">
              <a
                href="#"
                className="transition-colors hover:text-foreground-muted"
              >
                Privacy
              </a>
              <a
                href="#"
                className="transition-colors hover:text-foreground-muted"
              >
                Terms
              </a>
            </div>
          </div>
        </div>

        {/* Right: features */}
        <div className="relative hidden flex-col overflow-hidden bg-background-elevated lg:flex">
          <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.05] blur-[80px]" />

          <div className="relative flex h-full flex-col items-center justify-center p-8">
            <div className="w-full max-w-[350px] space-y-6">
              <h2 className="text-center text-xl font-medium text-foreground">
                Start Building Today
              </h2>
              <p className="text-center text-sm text-muted-foreground">
                Create your developer account and integrate health data from any
                wearable device.
              </p>

              <div className="mt-8 space-y-4">
                {FEATURES.map((feature) => (
                  <div
                    key={feature.title}
                    className="flex items-start gap-4 rounded-lg border border-border bg-card p-4"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                      <feature.icon className="h-4 w-4 text-secondary-foreground" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-foreground">
                        {feature.title}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthShell>
  );
}
