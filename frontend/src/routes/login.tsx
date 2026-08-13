import { createFileRoute, redirect, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { isAuthenticated } from '@/lib/auth/session';
import { ArrowRight, Mail, Lock, Loader2 } from 'lucide-react';
import { LogoMark } from '@/components/common/logo-mark';
import { AuthShell } from '@/components/auth/auth-shell';
import { AuthDivider } from '@/components/auth/auth-divider';
import { SsoButton } from '@/components/auth/sso-button';
import { CodePreviewCard } from '@/components/login/code-preview-card';
import { DEFAULT_REDIRECTS, ROUTES } from '@/lib/constants/routes';
import { getCopyrightText } from '@/lib/constants/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const Route = createFileRoute('/login')({
  component: LoginPage,
  beforeLoad: () => {
    if (typeof window !== 'undefined' && isAuthenticated()) {
      throw redirect({ to: DEFAULT_REDIRECTS.authenticated });
    }
  },
});

function LoginPage() {
  const { login, isLoggingIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  return (
    <AuthShell>
      {/* Centered card container */}
      <div className="relative z-10 grid h-full max-h-[700px] w-full max-w-[1100px] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl lg:grid-cols-2">
        {/* Left section: login form */}
        <div className="flex flex-col justify-between border-b border-border bg-card p-8 sm:p-12 lg:border-b-0 lg:border-r">
          {/* Header / logo */}
          <div className="flex items-center gap-2.5">
            <LogoMark className="size-8 text-foreground" />
            <span className="text-lg font-bold tracking-tight text-foreground">
              Open Wearables
            </span>
          </div>

          {/* Main form container */}
          <div className="mx-auto my-auto w-full max-w-sm space-y-6 py-8">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Welcome back
              </h1>
              <p className="text-sm text-muted-foreground">
                Sign in to access dashboard, users, and settings.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleLogin}>
              {/* Email input */}
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pr-10"
                    placeholder="developer@example.com"
                    required
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center opacity-0 transition-opacity group-focus-within:opacity-100">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>

              {/* Password input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-xs text-foreground-muted"
                  >
                    Password
                  </Label>
                  <Link
                    to={ROUTES.forgotPassword}
                    className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="group relative">
                  <Input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    placeholder="••••••••"
                    required
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center opacity-0 transition-opacity group-focus-within:opacity-100">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>

              {/* Submit button */}
              <Button type="submit" disabled={isLoggingIn} className="w-full">
                {isLoggingIn ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="h-4 w-4 opacity-60" />
                  </>
                )}
              </Button>
            </form>

            <AuthDivider>Or</AuthDivider>

            <SsoButton />

            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link
                to={ROUTES.register}
                className="font-medium text-foreground transition-colors hover:text-primary-muted"
              >
                Sign up
              </Link>
            </p>
          </div>

          {/* Footer links */}
          <div className="flex items-center text-xs text-foreground-subtle">
            <p>{getCopyrightText()}</p>
          </div>
        </div>

        {/* Right section: visuals / context */}
        <div className="relative hidden flex-col overflow-hidden bg-background-elevated lg:flex">
          {/* Inner glow */}
          <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.05] blur-[80px]" />
          <CodePreviewCard />
        </div>
      </div>
    </AuthShell>
  );
}
