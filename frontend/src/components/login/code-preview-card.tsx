import { ShieldCheck, Zap, Bot, HeartPulse } from 'lucide-react';
import type { ReactNode } from 'react';

const CODE_LINES: { indent?: string; node: ReactNode }[] = [
  {
    node: (
      <span className="text-muted-foreground">
        // Define natural language automation
      </span>
    ),
  },
  {
    node: (
      <>
        <span className="text-chart-3">const</span>{' '}
        <span className="text-foreground">insight</span>{' '}
        <span className="text-chart-3">=</span>{' '}
        <span className="text-chart-5">await</span> openWearables.
        <span className="text-chart-3">create</span>({'{'}
      </>
    ),
  },
  {
    indent: 'pl-4',
    node: (
      <>
        name: <span className="text-chart-4">"Post-Run Recovery"</span>,
      </>
    ),
  },
  {
    indent: 'pl-4',
    node: (
      <>
        trigger: <span className="text-chart-4">"Run &gt; 5km"</span>,
      </>
    ),
  },
  {
    indent: 'pl-4',
    node: (
      <>
        action: <span className="text-chart-3">async</span> (
        <span className="text-chart-2">data</span>) =&gt; {'{'}
      </>
    ),
  },
  {
    indent: 'pl-8',
    node: (
      <>
        <span className="text-chart-5">if</span> (data.hrv &lt; 40) {'{'}
      </>
    ),
  },
  {
    indent: 'pl-12',
    node: (
      <>
        <span className="text-chart-5">return</span>{' '}
        <span className="text-chart-4">"Suggest yoga"</span>;
      </>
    ),
  },
  { indent: 'pl-8', node: <>{'}'}</> },
  { node: <>{'}'});</> },
];

const PROVIDERS = ['G', 'F', 'O', 'W'];

const FEATURES = [
  { icon: ShieldCheck, label: 'Secure' },
  { icon: Zap, label: 'Fast' },
  { icon: Bot, label: 'AI' },
];

export function CodePreviewCard() {
  return (
    <div className="relative flex h-full flex-col items-center justify-center p-8">
      {/* Card + floating badge share the rotation; the badge sits outside the
          card's clipped bounds so it can overhang the corner. */}
      <div className="relative w-full max-w-[380px] rotate-1 transition-transform duration-500 hover:rotate-0">
        {/* Floating live-data badge */}
        <div className="absolute -right-3 -top-4 z-10 flex items-center gap-2 rounded-lg border border-border bg-popover px-2.5 py-1.5 shadow-lg">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-chart-4/15">
            <HeartPulse className="h-3.5 w-3.5 text-chart-4" />
          </div>
          <div className="leading-tight">
            <div className="text-[10px] font-semibold text-foreground">
              HRV 38 ms
            </div>
            <div className="text-[8px] uppercase tracking-wide text-muted-foreground">
              Recovery low
            </div>
          </div>
        </div>

        {/* Code / UI preview card */}
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
          {/* Fake window header */}
          <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-3">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
              <div className="h-2.5 w-2.5 rounded-full bg-warning/70" />
              <div className="h-2.5 w-2.5 rounded-full bg-success/70" />
            </div>
            <div className="font-mono text-[10px] text-muted-foreground">
              health_automation.ts
            </div>
          </div>

          {/* Code content with line-number gutter */}
          <div className="flex p-5 font-mono text-[11px] leading-5">
            <div
              aria-hidden="true"
              className="mr-4 flex select-none flex-col items-end text-muted-foreground/40"
            >
              {CODE_LINES.map((_, i) => (
                <span key={i}>{i + 1}</span>
              ))}
            </div>
            <div className="flex-1 text-foreground/90">
              {CODE_LINES.map((line, i) => (
                <div key={i} className={line.indent}>
                  {line.node}
                </div>
              ))}
            </div>
          </div>

          {/* Integration footer */}
          <div className="flex items-center justify-between border-t border-border bg-muted/50 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                {PROVIDERS.map((provider) => (
                  <div
                    key={provider}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[9px] font-bold text-secondary-foreground ring-2 ring-card"
                  >
                    {provider}
                  </div>
                ))}
                <div className="flex h-5 items-center justify-center rounded-full bg-secondary px-1.5 text-[9px] font-bold text-muted-foreground ring-2 ring-card">
                  +20
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-medium text-success-muted">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-success-muted" />
              Connected
            </div>
          </div>
        </div>
      </div>

      {/* Text content */}
      <div className="mt-10 max-w-[320px] text-center">
        <h2 className="mb-2 text-base font-medium tracking-tight text-foreground">
          Normalized Health Data
        </h2>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Connect Garmin, Fitbit, Oura, and 20+ more through a single,
          normalized API.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2">
          {FEATURES.map((feature) => (
            <div
              key={feature.label}
              className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5"
            >
              <feature.icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] font-medium text-foreground-muted">
                {feature.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
