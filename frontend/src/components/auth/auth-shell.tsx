import type { ReactNode } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

/**
 * Shared full-screen wrapper for the unauthenticated auth pages (login,
 * register, forgot/reset password, accept invite). Provides the themed
 * background, subtle grid + glow, and a theme toggle so every auth screen
 * supports light and dark.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  const { resolvedTheme, setTheme } = useTheme();
  const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';

  return (
    <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-background p-4 text-foreground antialiased selection:bg-primary/20 sm:p-8">
      {/* Global background elements */}
      <div className="bg-grid absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[1000px] -translate-x-1/2 rounded-full bg-primary/[0.06] blur-[120px]" />

      {/* Theme toggle */}
      <button
        type="button"
        aria-label={`Switch to ${nextTheme} theme`}
        title={`Switch to ${nextTheme} theme`}
        onClick={() => setTheme(nextTheme)}
        className="absolute right-4 top-4 z-20 flex size-10 items-center justify-center rounded-lg border border-border/60 bg-card/60 text-muted-foreground outline-none backdrop-blur-sm transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring sm:right-6 sm:top-6"
      >
        {resolvedTheme === 'dark' ? (
          <Moon className="size-4" aria-hidden="true" />
        ) : (
          <Sun className="size-4" aria-hidden="true" />
        )}
      </button>

      {children}
    </div>
  );
}
