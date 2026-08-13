import { KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Single sign-on button. Presentational only for now — wiring up the SSO flow
 * is a follow-up, so this intentionally has no click handler yet.
 */
export function SsoButton({
  label = 'Continue with SSO',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className={cn('w-full', className)}
      title="SSO sign-in is coming soon"
    >
      <KeyRound className="h-4 w-4 opacity-70" />
      {label}
    </Button>
  );
}
