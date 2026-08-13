import { Fragment, useState } from 'react';
import { SourceBadge } from '@/components/common/source-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { CoverageResponse } from '@/lib/api';

interface Row {
  code: string;
  unit?: string;
  supportedBy: string[];
}

interface Section {
  /** Optional band heading shown above the section's rows. */
  title?: string;
  rows: Row[];
}

interface MatrixProps {
  providers: string[];
  sections: Section[];
  emptyMessage?: string;
}

function Matrix({ providers, sections, emptyMessage }: MatrixProps) {
  const totalRows = sections.reduce((n, s) => n + s.rows.length, 0);
  if (totalRows === 0) {
    return (
      <p className="py-4 text-sm text-muted-foreground">
        {emptyMessage ?? 'No data for this layer.'}
      </p>
    );
  }

  const colCount = providers.length + 1;

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 w-56 border-b border-border bg-card px-3 py-3 text-left" />
            {providers.map((p) => (
              <th
                key={p}
                className="min-w-[72px] border-b border-border bg-card px-2 py-3 text-center"
              >
                <SourceBadge provider={p} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sections.map((section, si) => (
            <Fragment key={section.title ?? si}>
              {section.title && (
                <>
                  {si > 0 && (
                    <tr aria-hidden="true">
                      <td colSpan={colCount} className="h-4 bg-card" />
                    </tr>
                  )}
                  <tr>
                    <td
                      colSpan={colCount}
                      className={cn(
                        'border-b border-border bg-muted/60 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-foreground/80',
                        si > 0 && 'border-t'
                      )}
                    >
                      {section.title}
                    </td>
                  </tr>
                </>
              )}
              {section.rows.map((row, i) => (
                <tr
                  key={row.code}
                  className={cn(
                    'transition-colors hover:bg-muted/40',
                    i % 2 === 0 ? 'bg-card' : 'bg-muted/20'
                  )}
                >
                  <td className="sticky left-0 z-10 border-b border-border/50 bg-inherit px-3 py-2.5">
                    <div className="flex items-baseline gap-2">
                      <code className="font-mono text-xs text-foreground">
                        {row.code}
                      </code>
                      {row.unit && (
                        <span className="rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">
                          {row.unit}
                        </span>
                      )}
                    </div>
                  </td>
                  {providers.map((p) => {
                    const supported = row.supportedBy.includes(p);
                    return (
                      <td
                        key={p}
                        className="border-b border-border/50 px-2 py-2.5 text-center"
                      >
                        <span className="sr-only">
                          {supported ? 'Supported' : 'Not supported'}
                        </span>
                        <span
                          aria-hidden="true"
                          className={
                            supported
                              ? 'inline-flex h-2.5 w-2.5 rounded-full bg-success ring-2 ring-success/20'
                              : 'inline-flex h-2.5 w-2.5 rounded-full bg-muted-foreground/25'
                          }
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface Props {
  data: CoverageResponse;
}

export function CoverageMatrix({ data }: Props) {
  const {
    providers,
    timeseries,
    workout_fields,
    sleep_fields,
    menstrual_cycle_fields,
    health_scores,
  } = data;
  const [activeTab, setActiveTab] = useState('timeseries');

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      variant="underline"
      className="space-y-5"
    >
      <TabsList>
        <TabsTrigger value="timeseries">Timeseries</TabsTrigger>
        <TabsTrigger value="workout">Workout</TabsTrigger>
        <TabsTrigger value="sleep">Sleep</TabsTrigger>
        <TabsTrigger value="womens-health">Women's Health</TabsTrigger>
        <TabsTrigger value="scores">Health Scores</TabsTrigger>
      </TabsList>

      <TabsContent value="timeseries">
        <Matrix
          providers={providers}
          emptyMessage="No timeseries data."
          sections={timeseries.map((cat) => ({
            title: cat.name,
            rows: cat.metrics.map((m) => ({
              code: m.code,
              unit: m.unit,
              supportedBy: m.providers,
            })),
          }))}
        />
      </TabsContent>

      <TabsContent value="workout">
        <Matrix
          providers={providers}
          sections={[
            {
              rows: workout_fields.map((f) => ({
                code: f.code,
                supportedBy: f.providers,
              })),
            },
          ]}
        />
      </TabsContent>

      <TabsContent value="sleep">
        <Matrix
          providers={providers}
          sections={[
            {
              rows: sleep_fields.map((f) => ({
                code: f.code,
                supportedBy: f.providers,
              })),
            },
          ]}
        />
      </TabsContent>

      <TabsContent value="womens-health">
        <Matrix
          providers={providers}
          sections={[
            {
              rows: menstrual_cycle_fields.map((f) => ({
                code: f.code,
                supportedBy: f.providers,
              })),
            },
          ]}
        />
      </TabsContent>

      <TabsContent value="scores">
        <Matrix
          providers={providers}
          sections={[
            {
              rows: health_scores.map((s) => ({
                code: s.code,
                supportedBy: s.providers,
              })),
            },
          ]}
        />
      </TabsContent>
    </Tabs>
  );
}
