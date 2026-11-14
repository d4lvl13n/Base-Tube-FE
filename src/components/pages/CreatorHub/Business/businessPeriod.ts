/**
 * Period maths for the business screens. Pure functions, unit-tested.
 *
 * Every period is a run of UTC calendar days 'YYYY-MM-DD', both ends
 * included, exactly as the API counts them. "Today" is today in UTC, not in
 * the viewer's time zone: the screens say so once.
 */

export type PeriodPreset = '7d' | '30d' | '90d' | '12m' | 'all' | 'custom';

/**
 * Longest CUSTOM range the API accepts: 3,660 days (10 years), both ends
 * included. "All time" is not a range of days: it is sent as range=all and has
 * no limit.
 */
export const MAX_RANGE_DAYS = 3660;

export const DEFAULT_PRESET: PeriodPreset = '30d';

export const PRESETS: ReadonlyArray<{ value: Exclude<PeriodPreset, 'custom'>; label: string; short: string; days: number | null }> = [
  { value: '7d', label: 'Last 7 days', short: '7 days', days: 7 },
  { value: '30d', label: 'Last 30 days', short: '30 days', days: 30 },
  { value: '90d', label: 'Last 90 days', short: '90 days', days: 90 },
  { value: '12m', label: 'Last 12 months', short: '12 months', days: 365 },
  // True all time: the API starts it on the first checkout or payment (range=all).
  { value: 'all', label: 'All time', short: 'All time', days: null },
];

const DAY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

export const isPreset = (value: unknown): value is PeriodPreset =>
  value === 'custom' || PRESETS.some((preset) => preset.value === value);

/** A real calendar day written YYYY-MM-DD (2026-02-30 is not one). */
export function isValidDay(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const match = DAY_RE.exec(value);
  if (!match) return false;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

const dayToMs = (day: string): number => {
  const [y, m, d] = day.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

const msToDay = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

/** Today as a UTC day. */
export const utcToday = (now: Date = new Date()): string => msToDay(now.getTime());

export const addDays = (day: string, days: number): string => msToDay(dayToMs(day) + days * DAY_MS);

/** Days from `from` to `to`, both included (1 for the same day). */
export const daysInclusive = (from: string, to: string): number => Math.round((dayToMs(to) - dayToMs(from)) / DAY_MS) + 1;

export interface ResolvedPeriod {
  preset: PeriodPreset;
  /**
   * UTC days of the period. null for all time: the API decides where all time
   * starts (the first checkout or payment) and returns it as `range.from`.
   */
  from: string | null;
  to: string | null;
  days: number | null;
  /** "previous 30 days"… null when a comparison would mean nothing (all time). */
  comparisonLabel: string | null;
  /** Why the custom range in the address could not be used (the default is shown instead). */
  error: string | null;
}

export interface PeriodInput {
  preset?: PeriodPreset | null;
  from?: string | null;
  to?: string | null;
}

/** Why a custom range cannot be used, or null when it can. */
export function customRangeError(from: string | null | undefined, to: string | null | undefined, today: string): string | null {
  if (!isValidDay(from) || !isValidDay(to)) return 'Pick a start day and an end day.';
  if (from > to) return 'The start day is after the end day.';
  const latest = addDays(today, 1);
  if (to > latest) return 'The end day is in the future.';
  const days = daysInclusive(from, to);
  if (days > MAX_RANGE_DAYS) {
    return `That is ${days.toLocaleString('en')} days. The longest custom range is ${MAX_RANGE_DAYS.toLocaleString('en')} days (10 years); for everything, choose All time.`;
  }
  return null;
}

/** The days a preset (or a custom range) covers, as of `now`. */
export function resolvePeriod(input: PeriodInput, now: Date = new Date()): ResolvedPeriod {
  const today = utcToday(now);
  if (input.preset === 'custom') {
    const error = customRangeError(input.from, input.to, today);
    if (!error) {
      const from = input.from as string;
      const to = input.to as string;
      const days = daysInclusive(from, to);
      return { preset: 'custom', from, to, days, comparisonLabel: `previous ${days} ${days === 1 ? 'day' : 'days'}`, error: null };
    }
    return { ...resolvePeriod({ preset: DEFAULT_PRESET }, now), error };
  }
  const preset = PRESETS.find((p) => p.value === input.preset) ?? PRESETS.find((p) => p.value === DEFAULT_PRESET)!;
  if (preset.days === null) {
    return { preset: preset.value, from: null, to: null, days: null, comparisonLabel: null, error: null };
  }
  return {
    preset: preset.value,
    from: addDays(today, -(preset.days - 1)),
    to: today,
    days: preset.days,
    comparisonLabel: `previous ${preset.short}`,
    error: null,
  };
}

/** A UTC day for display, never shifted by the viewer's time zone: "12 Nov 2026". */
export function formatDay(day: string, locale?: string, withYear = true): string {
  if (!isValidDay(day)) return day;
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
    timeZone: 'UTC',
  }).format(new Date(dayToMs(day)));
}

/**
 * What the period control shows: "Last 30 days", "3 Nov 2026 – 12 Nov 2026",
 * "All time (since 12 Nov 2024)". All time names its first day only once the
 * API has answered (`allTimeFrom` = the response's `range.from`).
 */
export function periodLabel(period: ResolvedPeriod, locale?: string, allTimeFrom?: string | null): string {
  if (period.preset === 'all') return allTimeFrom ? `All time (since ${formatDay(allTimeFrom, locale)})` : 'All time';
  if (period.preset === 'custom' && period.from && period.to) {
    return period.from === period.to
      ? formatDay(period.from, locale)
      : `${formatDay(period.from, locale)} – ${formatDay(period.to, locale)}`;
  }
  const preset = PRESETS.find((p) => p.value === period.preset);
  return preset ? preset.label : `${period.days} days`;
}

/** Size of one chart point, as the API chooses it: a day up to 92 days, a week (Monday to Sunday) up to 731, a month beyond. */
export type PointSize = 'day' | 'week' | 'month';

const monthName = (day: string, locale: string | undefined, month: 'short' | 'long'): string =>
  new Intl.DateTimeFormat(locale, { month, year: 'numeric', timeZone: 'UTC' }).format(new Date(dayToMs(day)));

/** The short label under a chart point: "12 Nov", "Week of 10 Nov", "Nov 2026". */
export function pointTick(day: string, size: PointSize, locale?: string): string {
  if (!isValidDay(day)) return day;
  if (size === 'month') return monthName(day, locale, 'short');
  if (size === 'week') return `Week of ${formatDay(day, locale, false)}`;
  return formatDay(day, locale, false);
}

/**
 * The full name of one chart point, from its first to its last day inside
 * the period: "12 Nov 2026", "Week of 10 Nov 2026 (10 Nov – 16 Nov)",
 * "November 2026 (1 Nov – 30 Nov)". A week or month cut by the start or the
 * end of the period shows only the days it counts.
 */
export function pointName(day: string, end: string, size: PointSize, locale?: string): string {
  if (!isValidDay(day)) return day;
  if (size === 'day') return formatDay(day, locale);
  const last = isValidDay(end) ? end : day;
  const span = `${formatDay(day, locale, false)} – ${formatDay(last, locale, false)}`;
  if (size === 'month') return `${monthName(day, locale, 'long')} (${span})`;
  return `Week of ${formatDay(day, locale)} (${span})`;
}

/** "per day" / "per week" / "per month". */
export const perPointLabel = (size: PointSize): string => `per ${size}`;
