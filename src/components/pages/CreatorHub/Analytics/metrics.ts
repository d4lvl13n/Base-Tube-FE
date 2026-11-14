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
//     badge / an em dash, rather than a confident zero;
//   * a period comparison is written out in words with its raw counts, and is
//     never put on an all-time figure without naming the period.

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

/** `part / whole` as a percentage, or null when `whole` is not a positive number. */
export const percentOf = (
  part: number | null | undefined,
  whole: number | null | undefined
): number | null => {
  const p = Number(part);
  const w = Number(whole);
  if (part === null || part === undefined || !Number.isFinite(p) || !Number.isFinite(w) || w <= 0) return null;
  return (p / w) * 100;
};

/** Renders a percentage, or an em dash when it could not be computed. */
export const formatPercent = (value: number | null | undefined, digits = 1): string =>
  value === null || value === undefined || !Number.isFinite(value)
    ? '—'
    : `${value.toFixed(digits)}%`;

// ---------------------------------------------------------------------------
// Interaction rate — ONE definition for the dashboard and every Analytics card
// ---------------------------------------------------------------------------

/**
 * Views needed in the period before a rate is shown. Below it, likes and
 * comments can outnumber views (25 interactions on 19 views is "131.6%"),
 * which reads as a bug; the two counts are shown on their own instead.
 */
export const MIN_VIEWS_FOR_RATE = 100;

export interface InteractionRateView {
  interactions: number;
  views: number;
  /** (likes + comments) ÷ views × 100, never capped; null below MIN_VIEWS_FOR_RATE views. */
  rate: number | null;
  /** "131.6%" — or "Too few views for a rate". */
  valueText: string;
  /** "25 likes + comments · 19 views" — always shown. */
  countsText: string;
  /** Why there is no rate, or null when there is one. */
  noRateNote: string | null;
}

const countText = (n: number) => n.toLocaleString('en-US');

/**
 * The interaction rate card: likes + countable comments and counted views
 * of the SAME window (the growth endpoint's `engagement.total` and
 * `views.total`). The real numbers are never capped or altered; the
 * percentage is only shown from MIN_VIEWS_FOR_RATE views.
 */
export const interactionRateView = (
  interactionsInput: number | null | undefined,
  viewsInput: number | null | undefined
): InteractionRateView => {
  const interactions = readCount(interactionsInput) ?? 0;
  const views = readCount(viewsInput) ?? 0;
  const enough = views >= MIN_VIEWS_FOR_RATE;
  const rate = enough ? (interactions / views) * 100 : null;
  return {
    interactions,
    views,
    rate,
    valueText: rate === null ? 'Too few views for a rate' : formatPercent(rate),
    countsText: `${countText(interactions)} likes + comments · ${countText(views)} ${views === 1 ? 'view' : 'views'}`,
    noRateNote: enough ? null : `A rate is shown from ${MIN_VIEWS_FOR_RATE} views in the period`
  };
};

/** Human label for the retention buckets emitted by the backend. */
export const DURATION_BUCKET_LABELS: Record<string, string> = {
  very_short: 'under 1 min',
  short: '1–5 min',
  medium: '5–20 min',
  long: 'over 20 min'
};

export const DURATION_BUCKET_ORDER = ['very_short', 'short', 'medium', 'long'] as const;

/**
 * One way to write a length of time, everywhere in analytics: "45 s",
 * "1 min 30 s", "2 h 5 min". Whole seconds only — the tabs used to print
 * "1.50m" next to "37.3333s". An em dash when there is nothing to show.
 */
export const formatDuration = (seconds: number | null | undefined): string => {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) return '—';
  const whole = Math.max(0, Math.round(seconds));
  if (whole < 60) return `${whole} s`;
  if (whole < 3600) {
    const m = Math.floor(whole / 60);
    const s = whole % 60;
    return s === 0 ? `${m} min` : `${m} min ${s} s`;
  }
  const totalMinutes = Math.round(whole / 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
};

/**
 * Watch time for a card. Hours to one decimal are right for a channel with an
 * audience and wrong for one without: the first week of a channel is
 * "1 min 19 s", not "0.0 hours". Seconds are preferred when the API sends them;
 * the rounded hours are the fallback for a response that predates the field.
 */
export const formatWatchTime = (seconds: number | null | undefined, hours: number): string => {
  if (typeof seconds === 'number' && Number.isFinite(seconds)) {
    const whole = Math.max(0, Math.round(seconds));
    if (whole < 3600) return formatDuration(whole);
    return `${(whole / 3600).toFixed(1)} hours`;
  }
  return `${(Number.isFinite(hours) ? hours : 0).toFixed(1)} hours`;
};

// ---------------------------------------------------------------------------
// Date keys
// ---------------------------------------------------------------------------
//
// The backend buckets every series by UTC calendar day ("2026-11-10"), week
// (the Monday that starts it) or month ("2026-11-01"). Those are CALENDAR
// keys, not instants: `new Date('2026-11-10')` is UTC midnight, and printing it
// in local time shows "Nov 9" to anyone west of UTC. Every chart that receives
// a key formats it through here, with no time-zone conversion at all.

export type SeriesGranularity = 'day' | 'week' | 'month';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DATE_KEY_RE = /^(\d{4})-(\d{2})(?:-(\d{2}))?/;
const DAY_MS = 86_400_000;

interface CalendarParts {
  y: number;
  m: number; // 1-12
  d: number; // 1-31
}

export const parseDateKey = (key: string | null | undefined): CalendarParts | null => {
  const match = DATE_KEY_RE.exec(String(key ?? ''));
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = match[3] ? Number(match[3]) : 1;
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return { y, m, d };
};

const partsToMs = ({ y, m, d }: CalendarParts) => Date.UTC(y, m - 1, d);
const msToKey = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** Normalises a key to YYYY-MM-DD (months to their 1st), or null. */
export const normaliseDateKey = (
  key: string | null | undefined,
  granularity: SeriesGranularity = 'day'
): string | null => {
  const parts = parseDateKey(key);
  if (!parts) return null;
  return msToKey(partsToMs(granularity === 'month' ? { ...parts, d: 1 } : parts));
};

/**
 * Calendar label for a date key: "Nov 10" (day), "Nov 10, 2026" (week) or
 * "Nov 2026" (month). Anything that is not a key comes back unchanged.
 */
export const formatDateKey = (
  key: string | null | undefined,
  granularity: SeriesGranularity = 'day'
): string => {
  const parts = parseDateKey(key);
  if (!parts) return String(key ?? '');
  const month = MONTHS[parts.m - 1];
  if (granularity === 'month') return `${month} ${parts.y}`;
  if (granularity === 'week') return `${month} ${parts.d}, ${parts.y}`;
  return `${month} ${parts.d}`;
};

/** "Nov 10, 2026" for a key or an ISO timestamp (its UTC calendar day). */
export const formatCalendarDate = (value: string | null | undefined): string | null => {
  const parts = parseDateKey(value);
  if (!parts) return null;
  return `${MONTHS[parts.m - 1]} ${parts.d}, ${parts.y}`;
};

const startOfBucketMs = (ms: number, granularity: SeriesGranularity): number => {
  const d = new Date(ms);
  if (granularity === 'month') return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
  const dayMs = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  if (granularity === 'week') {
    // Weeks start on Monday (MySQL WEEKDAY(): Monday = 0).
    const weekday = (new Date(dayMs).getUTCDay() + 6) % 7;
    return dayMs - weekday * DAY_MS;
  }
  return dayMs;
};

const nextBucketMs = (ms: number, granularity: SeriesGranularity): number => {
  if (granularity === 'day') return ms + DAY_MS;
  if (granularity === 'week') return ms + 7 * DAY_MS;
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
};

/** Guard against a malformed key turning one chart into a million points. */
const MAX_BUCKETS = 2000;

/**
 * Every bucket key a chart should show, oldest first.
 *
 * With `days` (a rolling 7- or 30-day window, which the backend measures from
 * `now - N days` to `now` in UTC) that is the N+1 UTC calendar days the window
 * touches — the same keys the backend pads with. Without it (all time), it runs
 * from the earliest key in the data to the bucket that contains today.
 */
export const bucketKeys = (
  dataKeys: string[],
  granularity: SeriesGranularity,
  days?: number | null,
  nowMs: number = Date.now()
): string[] => {
  const end = startOfBucketMs(nowMs, granularity);
  let start: number;
  if (granularity === 'day' && typeof days === 'number' && days > 0) {
    start = end - days * DAY_MS;
  } else {
    const starts = dataKeys
      .map((key) => parseDateKey(key))
      .filter((p): p is CalendarParts => p !== null)
      .map((p) => startOfBucketMs(partsToMs(p), granularity));
    if (starts.length === 0) return [];
    start = Math.min(...starts);
  }

  const keys = new Set<string>();
  for (let ms = start; ms <= end && keys.size < MAX_BUCKETS; ms = nextBucketMs(ms, granularity)) {
    keys.add(msToKey(ms));
  }
  // A key past "today" (clock skew between browser and server) is still data.
  for (const key of dataKeys) {
    const normalised = normaliseDateKey(key, granularity);
    if (normalised) keys.add(normalised);
  }
  return Array.from(keys).sort();
};

/**
 * A count series with every missing bucket present as 0, oldest first.
 * Values for the same bucket are summed; rows without a usable key are dropped.
 */
export const fillSeries = (
  points: TrendPoint[] | null | undefined,
  granularity: SeriesGranularity,
  days?: number | null,
  nowMs: number = Date.now()
): TrendPoint[] => {
  const byKey = new Map<string, number>();
  for (const point of points ?? []) {
    const key = normaliseDateKey(point?.date, granularity);
    if (!key) continue;
    const value = Number(point?.count);
    byKey.set(key, (byKey.get(key) ?? 0) + (Number.isFinite(value) ? value : 0));
  }
  return bucketKeys(Array.from(byKey.keys()), granularity, days, nowMs).map((date) => ({
    date,
    count: byKey.get(date) ?? 0
  }));
};

/**
 * Bucket size of an engagement-trends response: the backend's `granularity`
 * when it sends one, otherwise what the endpoint has always done (days for
 * 7d / 30d, Monday-keyed weeks for all time).
 */
export const engagementGranularity = (
  declared: string | null | undefined,
  period: '7d' | '30d' | 'all'
): SeriesGranularity => {
  const value = String(declared ?? '').toLowerCase();
  if (value === 'day' || value === 'daily') return 'day';
  if (value === 'week' || value === 'weekly') return 'week';
  if (value === 'month' || value === 'monthly') return 'month';
  return period === 'all' ? 'week' : 'day';
};

// ---------------------------------------------------------------------------
// Growth series
// ---------------------------------------------------------------------------

export interface GrowthSeriesInput {
  data?: Array<{ date: string; value: number }> | null;
}

export interface GrowthMetricsInput {
  /** Additive backend field: how the series are bucketed. */
  granularity?: string | null;
  subscribers?: GrowthSeriesInput | null;
  views?: GrowthSeriesInput | null;
  engagement?: GrowthSeriesInput | null;
}

export interface GrowthRow {
  date: string;
  subscribers: number;
  views: number;
  interactions: number;
}

/**
 * The growth response's bucket size. Trusts the backend's `granularity` when
 * it sends one; otherwise all-time is monthly and 7d / 30d are daily, which is
 * what the endpoint has always returned.
 */
export const growthGranularity = (
  metrics: GrowthMetricsInput | null | undefined,
  period: '7d' | '30d' | 'all'
): 'day' | 'month' => {
  const declared = String(metrics?.granularity ?? '').toLowerCase();
  if (declared === 'month' || declared === 'monthly') return 'month';
  if (declared === 'day' || declared === 'daily') return 'day';
  return period === 'all' ? 'month' : 'day';
};

/**
 * Joins the three growth series ON THEIR DATE KEY.
 *
 * The chart used to pair them by array position. On "All time" each series
 * only lists the months that had activity, so month 3 of the subscriber
 * series sat next to month 3 of the views series whatever their dates were —
 * and a channel with no subscribers got an empty chart, because the subscriber
 * series drove the loop.
 */
export const mergeGrowthSeries = (
  metrics: GrowthMetricsInput | null | undefined,
  period: '7d' | '30d' | 'all',
  nowMs: number = Date.now()
): GrowthRow[] => {
  if (!metrics) return [];
  const granularity = growthGranularity(metrics, period);
  const days = period === '7d' ? 7 : period === '30d' ? 30 : null;
  const toPoints = (series?: GrowthSeriesInput | null): TrendPoint[] =>
    (series?.data ?? []).map((row) => ({ date: row?.date, count: Number(row?.value) }));

  const subscribers = toPoints(metrics.subscribers);
  const views = toPoints(metrics.views);
  const interactions = toPoints(metrics.engagement);

  // One shared axis: every key any series has, plus the gaps between them.
  const allKeys = [...subscribers, ...views, ...interactions].map((p) => p.date);
  const keys = bucketKeys(allKeys, granularity, days, nowMs);
  if (keys.length === 0) return [];

  const lookup = (series: TrendPoint[]) =>
    new Map(fillSeries(series, granularity, days, nowMs).map((p) => [p.date, p.count]));
  const s = lookup(subscribers);
  const v = lookup(views);
  const i = lookup(interactions);

  return keys.map((date) => ({
    date,
    subscribers: s.get(date) ?? 0,
    views: v.get(date) ?? 0,
    interactions: i.get(date) ?? 0
  }));
};

// ---------------------------------------------------------------------------
// Period comparisons ("+2 in the last 7 days (0 the week before)")
// ---------------------------------------------------------------------------

const formatCount = (n: number) => Math.round(n).toLocaleString('en-US');

/**
 * Words instead of a percentage badge.
 *
 * The old badge sat on an ALL-TIME number while comparing two 7-day windows,
 * and printed "↑100%" whenever the earlier window was empty. This says what
 * the comparison is, with the raw counts. `previous` is the backend's raw count
 * for the window before; without it there is no comparison at all (the old
 * rounded percentage cannot be turned back into a count honestly). No
 * percentage when the earlier window was 0.
 */
export const periodComparisonCaption = ({
  current,
  previous,
  days
}: {
  current: number | null | undefined;
  previous?: number | null;
  days: number;
}): string | null => {
  if (current === null || current === undefined || !Number.isFinite(current)) return null;
  const window = `the last ${days} days`;
  const before = days === 7 ? 'the week before' : `the ${days} days before`;
  const base = `${current > 0 ? '+' : ''}${formatCount(current)} in ${window}`;

  if (previous === null || previous === undefined || !Number.isFinite(previous)) return base;
  if (previous <= 0) return `${base} (0 ${before})`;

  const change = Math.round(((current - previous) / previous) * 100);
  const changeText = change === 0 ? 'no change' : `${change > 0 ? '+' : ''}${change}%`;
  return `${base} (${formatCount(previous)} ${before}, ${changeText})`;
};

/**
 * The earlier window on its own, for a card whose value is already the
 * current window ("New in the last 7 days"): "0 the week before" or
 * "95 the week before (+26%)". Null without the backend's raw count.
 */
export const previousWindowText = ({
  current,
  previous,
  days
}: {
  current: number | null | undefined;
  previous?: number | null;
  days: number;
}): string | null => {
  if (previous === null || previous === undefined || !Number.isFinite(previous)) return null;
  const before = days === 7 ? 'the week before' : `the ${days} days before`;
  if (previous <= 0) return `0 ${before}`;
  if (current === null || current === undefined || !Number.isFinite(current)) {
    return `${formatCount(previous)} ${before}`;
  }
  const change = Math.round(((current - previous) / previous) * 100);
  const changeText = change === 0 ? 'no change' : `${change > 0 ? '+' : ''}${change}%`;
  return `${formatCount(previous)} ${before} (${changeText})`;
};

/** Reads an additive raw count from a response without trusting its type. */
export const readCount = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '' || typeof value === 'boolean') {
    return null;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

// ---------------------------------------------------------------------------
// Video Performance page averages
// ---------------------------------------------------------------------------

export interface PerformanceRowInput {
  views?: number | null;
  average_watch_duration_seconds?: number | null;
  average_percentage_viewed?: number | null;
  /** Additive backend fields: the sums behind the two per-row averages. */
  watch_seconds_total?: number | null;
  percent_watched_sum?: number | null;
}

export interface PageWatchAverages {
  avgWatchSeconds: number | null;
  avgPercentWatched: number | null;
  /** Total weight the averages were taken over (0 = nothing to average). */
  views: number;
}

/**
 * Average watch time and share watched across the rows on screen, weighted by
 * views. The old plain mean of per-video averages counted an unwatched video
 * as a 0 % view: 60 % on 100 views next to a video with no views read 30 %.
 *
 * Uses the backend's per-row sums (`watch_seconds_total`,
 * `percent_watched_sum`) when it sends them — Σ sum / Σ views is exact — and
 * average × views otherwise. Rows with no views carry no weight; null when no
 * row has any.
 */
export const pageWatchAverages = (
  rows: PerformanceRowInput[] | null | undefined
): PageWatchAverages => {
  let weightTotal = 0;
  let seconds = 0;
  let percent = 0;
  for (const row of rows ?? []) {
    const views = Number(row?.views);
    if (!Number.isFinite(views) || views <= 0) continue;
    const secondsSum = readCount(row?.watch_seconds_total);
    const percentSum = readCount(row?.percent_watched_sum);
    const avgSeconds = Number(row?.average_watch_duration_seconds);
    const avgPercent = Number(row?.average_percentage_viewed);
    weightTotal += views;
    seconds += secondsSum !== null
      ? Math.max(0, secondsSum)
      : (Number.isFinite(avgSeconds) ? Math.max(0, avgSeconds) : 0) * views;
    percent += percentSum !== null
      ? Math.max(0, percentSum)
      : (Number.isFinite(avgPercent) ? Math.min(100, Math.max(0, avgPercent)) : 0) * views;
  }
  if (weightTotal <= 0) return { avgWatchSeconds: null, avgPercentWatched: null, views: 0 };
  return {
    avgWatchSeconds: seconds / weightTotal,
    avgPercentWatched: Math.min(100, percent / weightTotal),
    views: weightTotal
  };
};

// ---------------------------------------------------------------------------
// Lists
// ---------------------------------------------------------------------------

const HIDDEN_COMMENT_STATUSES = new Set(['hidden', 'removed', 'deleted']);

/**
 * False for a comment the API marks deleted or hidden. "Top Comments" must
 * never put a removed comment back on screen.
 */
export const isVisibleComment = (comment: unknown): boolean => {
  if (!comment || typeof comment !== 'object') return false;
  const c = comment as Record<string, unknown>;
  if (c.deletedAt || c.deleted_at) return false;
  if (c.isDeleted === true || c.is_deleted === true || c.deleted === true) return false;
  if (c.hidden === true || c.isHidden === true) return false;
  const status = String(c.status ?? '').toLowerCase();
  return !HIDDEN_COMMENT_STATUSES.has(status);
};

/** Label for the period a list was actually computed over. */
export const appliedPeriodLabel = (applied: '7d' | '30d' | '90d' | 'all'): string => {
  if (applied === '7d') return 'Last 7 days';
  if (applied === '30d') return 'Last 30 days';
  if (applied === '90d') return 'Last 90 days';
  return 'All time';
};

// ---------------------------------------------------------------------------
// Caption copy shared by every card that shows these numbers
// ---------------------------------------------------------------------------

/**
 * "How views are counted": the server's own sentence (`countingRules.summary`
 * from GET /config/view-config), or — while that has not arrived — the same
 * rule without the numbers. Stated once per screen, never per card.
 */
export const viewCountingText = (
  rules: { summary?: string | null; creatorViewsCountLikeAnyViewer?: boolean } | null | undefined
): string => {
  const summary = typeof rules?.summary === 'string' ? rules.summary.trim() : '';
  if (summary) {
    return /own views/i.test(summary) ? summary : `${summary} Your own views count like any viewer's.`;
  }
  return "A view counts once enough of the video has been played, and each viewer counts a limited number of times per video in 24 hours. Your own views count like any viewer's.";
};

/** Where pass-video plays are, since they are not in the channel's views. */
export const PASS_PLAYS_NOTE =
  'Plays of pass videos are not in these view counts. Each pass shows them per video ("Started by" and "Finished by") in its Performance section:';

/** MySQL DAYOFWEEK (1 = Sunday … 7 = Saturday) as a day name. */
export const weekdayLabel = (dayOfWeek: number): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const index = Math.round(Number(dayOfWeek)) - 1;
  return index >= 0 && index < 7 ? days[index] : 'Unknown day';
};

/** Country name for a demographics row: 'ZZ' (not resolved) is "Unknown". */
export const countryLabel = (row: { country?: string | null; countryCode?: string | null }): string => {
  if (!row.countryCode || row.countryCode.toUpperCase() === 'ZZ') return 'Unknown';
  return row.country?.trim() || row.countryCode.toUpperCase();
};

/**
 * "Comments answered" from the social metrics (reply-based): the value and
 * its caption. No percentage when nobody else commented.
 */
export const commentsAnsweredView = (interactions: {
  commentsFromOthers: number;
  commentsAnswered: number;
  responseRate: number;
  averageResponseTime: number;
  windowDays: number;
}): { valueText: string; caption: string; note: string | null } => {
  const others = readCount(interactions.commentsFromOthers) ?? 0;
  const answered = readCount(interactions.commentsAnswered) ?? 0;
  const days = readCount(interactions.windowDays) ?? 30;
  if (others <= 0) {
    return {
      valueText: '—',
      caption: `No comments from others in the last ${days} days`,
      note: null
    };
  }
  const hours = readCount(interactions.averageResponseTime);
  return {
    valueText: formatPercent(readCount(interactions.responseRate)),
    caption: `You replied to ${countText(answered)} of ${countText(others)} comments from others, last ${days} days`,
    note: answered > 0 && hours !== null ? `Average time to your first reply: ${formatHours(hours)}` : null
  };
};

/** Hours (decimal) as "45 min", "2.5 h". */
const formatHours = (hours: number): string =>
  hours < 1 ? formatDuration(hours * 3600) : `${(Math.round(hours * 10) / 10).toLocaleString('en-US')} h`;

/** Owner decision: the creator's own replies count as comments. */
export const OWN_REPLIES_NOTE = 'Includes your own replies.';

/** What "Avg. % watched" is an average of. */
export const COUNTED_VIEWS_NOTE =
  'Averaged over counted views (views that passed the view threshold), weighted by views.';

/** "Measured accurately since Nov 10, 2026", or null without the backend field. */
export const accurateSinceNote = (since: string | null | undefined): string | null => {
  const date = formatCalendarDate(since);
  return date ? `Watch time measured accurately since ${date}.` : null;
};

/** Joins optional caption sentences into one note, each ending with a full stop. */
export const joinNotes = (...parts: Array<string | null | undefined | false>): string | undefined => {
  const kept = parts
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .map((part) => (/[.!?]$/.test(part.trim()) ? part.trim() : `${part.trim()}.`));
  return kept.length ? kept.join(' ') : undefined;
};

/** "the last 7 days" / "the last 30 days" / "all time", for captions. */
export const periodPhrase = (period: '7d' | '30d' | 'all'): string =>
  period === '7d' ? 'the last 7 days' : period === '30d' ? 'the last 30 days' : 'all time';
