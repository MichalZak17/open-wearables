import { format } from 'date-fns';
import {
  Moon,
  Heart,
  Zap,
  Activity,
  Flame,
  Battery,
  Dumbbell,
  Shield,
  type LucideIcon,
} from 'lucide-react';
import type { HealthScoreResponse } from '@/lib/api/types';

// ---------------------------------------------------------------------------
// Category configuration
// ---------------------------------------------------------------------------

export interface CategoryConfig {
  label: string;
  icon: LucideIcon;
  color: string;
  maxScale: number;
}

export const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  sleep: {
    label: 'Sleep',
    icon: Moon,
    color: 'text-indigo-400',
    maxScale: 100,
  },
  recovery: {
    label: 'Recovery',
    icon: Heart,
    color: 'text-rose-400',
    maxScale: 100,
  },
  readiness: {
    label: 'Readiness',
    icon: Zap,
    color: 'text-success-muted',
    maxScale: 100,
  },
  activity: {
    label: 'Activity',
    icon: Activity,
    color: 'text-sky-400',
    maxScale: 100,
  },
  stress: {
    label: 'Stress',
    icon: Flame,
    color: 'text-orange-400',
    maxScale: 100,
  },
  body_battery: {
    label: 'Body Battery',
    icon: Battery,
    color: 'text-green-400',
    maxScale: 100,
  },
  strain: {
    label: 'Strain',
    icon: Dumbbell,
    color: 'text-destructive-muted',
    maxScale: 21,
  },
  resilience: {
    label: 'Resilience',
    icon: Shield,
    color: 'text-purple-400',
    maxScale: 100,
  },
};

export const CATEGORY_ORDER = [
  'sleep',
  'recovery',
  'readiness',
  'activity',
  'stress',
  'body_battery',
  'strain',
  'resilience',
];

// ---------------------------------------------------------------------------
// Provider configuration
// ---------------------------------------------------------------------------

const PROVIDER_CHART_COLORS: Record<string, string> = {
  garmin: '#60a5fa',
  oura: '#a78bfa',
  whoop: '#fbbf24',
  internal: '#34d399',
  fitbit: '#2dd4bf',
  apple: '#a1a1aa',
};

const PROVIDER_LABELS: Record<string, string> = {
  garmin: 'Garmin',
  oura: 'Oura',
  whoop: 'WHOOP',
  internal: 'OW',
  fitbit: 'Fitbit',
  apple: 'Apple',
};

export function getProviderColor(provider: string): string {
  return PROVIDER_CHART_COLORS[provider] || '#71717a';
}

export function getProviderLabel(provider: string): string {
  return PROVIDER_LABELS[provider] || provider;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function groupScoresByDate(
  scores: HealthScoreResponse[]
): Map<string, HealthScoreResponse[]> {
  const groups = new Map<string, HealthScoreResponse[]>();
  for (const score of scores) {
    const date = score.recorded_at.split('T')[0];
    if (!groups.has(date)) groups.set(date, []);
    groups.get(date)!.push(score);
  }
  return groups;
}

export function buildChartData(
  scores: HealthScoreResponse[],
  category: string
): Record<string, string | number>[] {
  const filtered = scores.filter((s) => s.category === category);
  const byDate = groupScoresByDate(filtered);

  return Array.from(byDate.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, dateScores]) => {
      const point: Record<string, string | number> = {
        date: format(new Date(date + 'T00:00:00'), 'MMM d'),
      };
      for (const score of dateScores) {
        if (score.value !== null && score.provider) {
          point[score.provider] =
            category === 'resilience'
              ? Number(score.value) * 100
              : Number(score.value);
        }
      }
      return point;
    });
}

export function formatScore(value: number | null, category?: string): string {
  if (value === null) return '-';
  const num = Number(value);
  if (category === 'resilience') {
    return (num * 100).toFixed(1) + '%';
  }
  return Number.isInteger(num) ? String(num) : num.toFixed(1);
}

export function formatComponentName(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
