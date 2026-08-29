/*
 * Presentation helpers for the Insights tab.
 *
 * Everything here turns a number the backend measured into the shortest true
 * sentence about it. Nothing here invents a value: `factValue` reads
 * `fact.value`, `factLabel` only ever REMOVES the leading quantity from
 * `fact.text` so the number is not printed twice beside its own big figure.
 */

import type { ChannelInsightsV2, InsightFact } from '../../../../../types/insights';

/** "2 h watched" / "45 min watched" — the wording the coverage line has always used. */
export function formatWatch(seconds: number): string {
  if (seconds >= 3600) return `${Math.round((seconds / 3600) * 10) / 10} h watched`;
  if (seconds >= 60) return `${Math.round(seconds / 60)} min watched`;
  return `${Math.round(seconds)} s watched`;
}

/** 79 → "1m 19s". A duration read as a bare "79" is a duration nobody reads. */
export function formatSeconds(seconds: number): string {
  const total = Math.round(seconds);
  if (total < 60) return `${total}s`;
  if (total < 3600) {
    const minutes = Math.floor(total / 60);
    const rest = total % 60;
    return rest === 0 ? `${minutes}m` : `${minutes}m ${rest}s`;
  }
  const hours = Math.floor(total / 3600);
  const minutes = Math.round((total % 3600) / 60);
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

const round1 = (value: number) => Math.round(value * 10) / 10;

/** The big figure on a stat tile, formatted by the unit the backend declared. */
export function factValue(fact: InsightFact): string {
  const { value, unit } = fact;
  switch (unit) {
    case 'seconds':
      return formatSeconds(value);
    case 'percent':
      return `${Math.round(value)}%`;
    case 'hours':
      return `${round1(value)} h`;
    case 'per_week':
      return `${round1(value)}/wk`;
    case 'characters':
      return `${Math.round(value)} chars`;
    default:
      return (Number.isInteger(value) ? value : round1(value)).toLocaleString();
  }
}

/**
 * The small line under the figure.
 *
 * KEYED ON `metric`, NOT PARSED OUT OF `text`. The backend writes facts in two
 * shapes — "1,204 counted views in the last 7 days." and "Median title length:
 * 41 characters." — so no amount of prefix-stripping produces a readable label
 * for both. `metric` is the stable machine key the contract promises, and these
 * labels only ever NAME the number; they never restate or reinterpret it.
 *
 * The full measured sentence is not lost: the tile renders it for screen
 * readers and as its tooltip, so the backend's exact wording is always one
 * hover (or one assistive read) away.
 */
const FACT_LABELS: Record<string, string> = {
  views: 'counted views in the period',
  watch_hours: 'of watch time in the period',
  watch_seconds: 'of watch time in the period',
  videos_total: 'videos in the catalogue',
  videos_with_views: 'videos watched at least once',
  median_views_per_watched_video: 'median views per watched video',
  top_video_views: 'views on your most-watched video',
  avg_percent_watched: 'of an average video actually watched',
  likes: 'likes in the period',
  comments: 'comments in the period',
  subscribers: 'subscribers',
  uploads_per_week: 'uploads per week',
  median_title_length: 'median title length',
  busiest_hour_utc: 'the hour most views land (UTC)',
  busiest_weekday_views: 'views on your busiest weekday',
};

export function factLabel(fact: InsightFact): string {
  return FACT_LABELS[fact.metric] ?? fact.metric.replace(/_/g, ' ');
}

/** `views` → "views", `avg_percent_watched` → "% watched". Never a causal claim. */
const BASED_ON_LABELS: Record<string, string> = {
  views: 'views',
  watch_seconds: 'watch time',
  avg_percent_watched: '% watched',
  median_views_per_video: 'median views per video',
  videos: 'videos',
};

export function basedOnLabels(keys: string[]): string[] {
  return keys
    // A bare id is a pointer to a row, not something a creator can read.
    .filter((key) => !/^\d+$/.test(key))
    .map((key) => BASED_ON_LABELS[key] ?? key.replace(/_/g, ' '));
}

/** `this_year` → "this year". */
export function windowLabel(window: string): string {
  return window.replace(/_/g, ' ');
}

/** "in the last 7 days" / "so far" (the 'all' window is the channel's lifetime). */
function windowPhrase(days: number | null): string {
  return days === null ? 'so far' : `in the last ${days} days`;
}

/** The coverage numbers, in the order the card has always listed them. */
export function coverageParts(insights: ChannelInsightsV2): string[] {
  const { coverage } = insights;
  return [
    `${coverage.views.toLocaleString()} views`,
    `${coverage.videos.toLocaleString()} videos`,
    formatWatch(coverage.watchSeconds),
    coverage.days === null ? 'all time' : `${coverage.days} days`,
  ];
}

/**
 * One human sentence under the title.
 *
 * It is still the coverage strip — the same four numbers, in the same order —
 * only wrapped in the tone the data mode has earned. A creator with two views
 * is greeted rather than warned; the two views are still printed.
 */
export function headlineSentence(insights: ChannelInsightsV2): string {
  const parts = coverageParts(insights).join(' · ');
  if (insights.dataMode === 'insufficient') {
    const { coverage } = insights;
    return (
      `You're just getting started — ${coverage.views.toLocaleString()} views across ` +
      `${coverage.videos.toLocaleString()} videos ${windowPhrase(coverage.days)}. ` +
      "Here's what we can already say."
    );
  }
  if (insights.dataMode === 'thin') return `Early signals from ${parts}.`;
  return `Based on ${parts}.`;
}
