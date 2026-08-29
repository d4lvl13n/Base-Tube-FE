// Shared, testable math for the creator analytics tabs.
//
// Every helper here exists because a tab was doing the arithmetic inline and
// getting it wrong — see docs/ANALYTICS_REVIEW_2026-08-29.md (base-be repo),
// "Creator display" appendix. The rules:
//
//   * a series total is the SUM over the window, never the last data point;
//   * a percentage is a ratio of two numbers measured over the SAME window,
//     with an explicit zero guard — Infinity% and NaN% must never reach the DOM;
//   * when a metric cannot be computed honestly, return null and render no
//     badge / an em dash, rather than a confident zero.

export interface TrendPoint {
  date: string;
  count: number;
}

export interface RetentionBucket {
  durationCategory: string;
  retentionRate: number;
  viewCount: number;
}

/** Total over the whole window. Replaces the old `getLatestCount`. */
export const sumCounts = (series?: TrendPoint[] | null): number =>
  (series ?? []).reduce((total, point) => {
    const value = Number(point?.count);
    return total + (Number.isFinite(value) ? value : 0);
  }, 0);

/**
 * Average share of each video actually watched, weighted by how many views each
 * duration bucket carries.
 *
 * The tabs used to average the per-bucket rates with equal weight, so a single
 * view of one long video counted as much as a thousand views of the shorts.
 * Returns null when there is nothing to average.
 */
export const weightedPercentWatched = (
  buckets?: RetentionBucket[] | null
): number | null => {
  if (!buckets || buckets.length === 0) return null;

  let views = 0;
  let weighted = 0;
  for (const bucket of buckets) {
    const bucketViews = Number(bucket?.viewCount);
    const rate = Number(bucket?.retentionRate);
    if (!Number.isFinite(bucketViews) || bucketViews <= 0) continue;
    if (!Number.isFinite(rate)) continue;
    views += bucketViews;
    weighted += rate * bucketViews;
  }

  if (views <= 0) return null;
  return Math.min(100, Math.max(0, weighted / views));
};

/**
 * (likes + comments) / views over the same window, as a percentage.
 * Returns null when there were no views — that is an unknown rate, not 0%,
 * and definitely not Infinity%.
 */
export const interactionRate = (
  interactions: number | null | undefined,
  views: number | null | undefined
): number | null => {
  const i = Number(interactions);
  const v = Number(views);
  if (!Number.isFinite(i) || !Number.isFinite(v) || v <= 0) return null;
  return (i / v) * 100;
};

/** Renders a percentage, or an em dash when it could not be computed. */
export const formatPercent = (value: number | null | undefined, digits = 1): string =>
  value === null || value === undefined || !Number.isFinite(value)
    ? '—'
    : `${value.toFixed(digits)}%`;

/**
 * Normalises whatever a trend field holds into something StatsCard can render.
 * Anything non-finite (Infinity from a divide-by-zero, NaN from undefined
 * arithmetic) or zero becomes `undefined` => no badge at all.
 */
export const trendBadgeValue = (value: number | null | undefined): number | undefined => {
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  const rounded = Math.round(n);
  return rounded === 0 ? undefined : rounded;
};

/** Human label for the retention buckets emitted by the backend. */
export const DURATION_BUCKET_LABELS: Record<string, string> = {
  very_short: 'under 1 min',
  short: '1–5 min',
  medium: '5–20 min',
  long: 'over 20 min'
};

export const DURATION_BUCKET_ORDER = ['very_short', 'short', 'medium', 'long'] as const;
