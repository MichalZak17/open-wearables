import { ProviderLogo } from '@/components/common/provider-logo';
import { providerLabel } from '@/components/common/source-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ProviderConnectionCount } from '@/lib/api/types';
import { cn } from '@/lib/utils';
import { formatCompactNumber } from '@/lib/utils/format';

export interface ProvidersSectionProps {
  providers: ProviderConnectionCount[];
  className?: string;
}

export function ProvidersSection({
  providers,
  className,
}: ProvidersSectionProps) {
  return (
    <div className={cn('min-w-0 px-4 py-5 sm:px-6 sm:py-6', className)}>
      <h2 className="text-sm font-semibold text-foreground">Providers</h2>

      {providers.length === 0 ? (
        <div className="flex min-h-40 items-center justify-center">
          <p className="text-sm text-muted-foreground">
            No connected providers yet
          </p>
        </div>
      ) : (
        <Table className="mt-3">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-9 border-b border-border px-0 text-xs font-medium">
                Provider
              </TableHead>
              <TableHead className="h-9 border-b border-border px-0 text-right text-xs font-medium">
                Connections
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {providers.map(({ provider, count }) => (
              <TableRow key={provider} className="hover:bg-muted/30">
                <TableCell className="h-14 px-0 py-3">
                  <span className="flex items-center gap-3">
                    <ProviderLogo provider={provider} />
                    <span className="font-medium text-foreground">
                      {providerLabel(provider)}
                    </span>
                  </span>
                </TableCell>
                <TableCell className="h-14 px-0 py-3 text-right font-medium text-foreground tabular-nums">
                  {formatCompactNumber(count)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
