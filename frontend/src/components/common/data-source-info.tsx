import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SourceBadge, providerLabel } from '@/components/common/source-badge';
import {
  deviceTypeInfo,
  DeviceTypeIcon,
} from '@/components/common/device-type';
import { cn } from '@/lib/utils';
import type { SourceMetadata } from '@/lib/api/types';

export function DataSourceInfo({
  source,
  className = '',
}: {
  source: SourceMetadata | null | undefined;
  className?: string;
}) {
  if (!source) return null;

  const { label: deviceTypeLabel } = deviceTypeInfo(source.device_type);
  const hasKnownType =
    Boolean(source.device_type) && source.device_type !== 'unknown';

  // Prefer an explicit device name; fall back to the device-type label
  // (e.g. "Watch") and finally to a muted "Unknown device" placeholder rather
  // than surfacing a raw "???" to the user.
  const deviceName =
    source.device_name ?? (hasKnownType ? deviceTypeLabel : null);
  const isUnknownDevice = !deviceName;
  const deviceDisplay = deviceName ?? 'Unknown device';

  const deviceTooltip = source.device_name
    ? `${deviceTypeLabel}: ${source.device_name}`
    : hasKnownType
      ? deviceTypeLabel
      : 'Device not reported';

  // Native API integrations store the provider key as the source ("garmin"/"garmin"),
  // so it only carries information for HealthKit / Health Connect writers.
  const showSource =
    source.source && source.source !== source.provider ? source.source : null;

  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-1.5 leading-none',
        className
      )}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="shrink-0">
            <SourceBadge provider={source.provider} />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          Provider: {providerLabel(source.provider)}
        </TooltipContent>
      </Tooltip>

      {showSource && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="min-w-0 truncate text-[10px] text-muted-foreground">
              {showSource}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            Written by <strong>{showSource}</strong> into{' '}
            {providerLabel(source.provider)}
          </TooltipContent>
        </Tooltip>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'flex min-w-0 items-center gap-1 text-[10px] text-muted-foreground',
              isUnknownDevice && 'text-muted-foreground/60'
            )}
          >
            <DeviceTypeIcon
              deviceType={source.device_type}
              className="h-3 w-3 shrink-0"
            />
            <span className={cn('truncate', isUnknownDevice && 'italic')}>
              {deviceDisplay}
            </span>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-0.5">
            <div>{deviceTooltip}</div>
            {source.device && source.device !== deviceDisplay && (
              <div className="text-muted-foreground">
                Model: {source.device}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
