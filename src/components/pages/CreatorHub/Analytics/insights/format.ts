/*
 * Presentation helpers for the Insights tab.
 *
 * WHAT SURVIVED THE v3 CUT. v2's helpers existed to turn `facts[]` into a grid of stat
 * tiles — `factValue`, `factLabel`, `formatWatch`, `formatSeconds`, `coverageParts`,
 * `headlineSentence`. That grid is gone: it restated numbers the Overview tab already
 * shows, and restating the analytics was half of why the tab read as a paraphrase. The
 * facts are still in the payload (they are what the backend's number guard checks the
 * model's prose against) and one COVERAGE SENTENCE still says what the report was
 * computed from — that sentence is all this file is for now, plus the "based on" labels.
 *
 * Nothing here invents a value.
 */

import type { ChannelInsightsV3, InsightsPeriod } from '../../../../../types/insights';

/** `views` → "views". Never a causal claim. */
const BASED_ON_LABELS: Record<string, string> = {
  views: 'views',
  watch_seconds: 'watch time',
  watch_hours: 'watch time',
  avg_percent_watched: '% watched',
  median_views_per_watched_video: 'median views per watched video',
  median_title_length: 'median title length',
  videos_total: 'videos',
  videos_with_views: 'videos watched',
  uploads_per_week: 'uploads per week',
};

export function basedOnLabels(keys: string[]): string[] {
  return keys
    // A bare id is a pointer to a row, not something a creator can read.
    .filter((key) => !/^\d+$/.test(key))
    .map((key) => BASED_ON_LABELS[key] ?? key.replace(/_/g, ' '));
}

/** "this week" / "in the last 30 days" / "so far". */
export function periodPhrase(period: InsightsPeriod): string {
  switch (period) {
    case '7d':
      return 'this week';
    case '30d':
      return 'in the last 30 days';
    case '90d':
      return 'in the last 90 days';
    default:
      return 'so far';
  }
}

const plural = (count: number, one: string, many: string) => (count === 1 ? one : many);

/**
 * The ONE coverage sentence under the title — "Based on 8 videos · 2 views this week".
 *
 * CODE-GENERATED FROM `coverage`, never model text and never a paraphrase of one. It is
 * the whole of what v2 spent a stat grid saying, and it is deliberately the least
 * interesting thing on the page: it exists so the creator knows what the report looked
 * at before they read what it concluded.
 */
export function coverageSentence(insights: ChannelInsightsV3): string {
  const { coverage } = insights;
  const videos = `${coverage.videos.toLocaleString()} ${plural(coverage.videos, 'video', 'videos')}`;
  const views = `${coverage.views.toLocaleString()} ${plural(coverage.views, 'view', 'views')}`;
  return `Based on ${videos} · ${views} ${periodPhrase(insights.period)}`;
}
