/**
 * How the business screens write numbers, money and states. Pure functions,
 * unit-tested.
 *
 * Money rules (same as the API): an amount is integer MINOR units of ONE
 * currency plus that currency's `decimals` (2 for EUR / USD, 6 for USDC).
 * Never divide by 100 blindly, never add two currencies together, and always
 * show the currency code.
 */
import type { PassWatchAggregate, PassWatchPeriod } from '../../../../api/creatorBusiness';
import type {
  AccessState,
  CustomerRow,
  DailyPoint,
  Definitions,
  EmailHiddenReason,
  Funnel,
  MoneyLine,
  PassRow,
} from '../../../../types/creatorBusiness';
import { formatDuration } from '../Analytics/metrics';
import type { PeriodPreset } from './businessPeriod';

/** Minor units to the currency's own unit: 12_500_000 USDC atoms → 12.5. */
export const toMajor = (minor: number, decimals: number): number => minor / Math.pow(10, Math.max(0, decimals));

export interface MoneyFormatOptions {
  locale?: string;
  /** "+EUR 3.00" / "-EUR 3.00" (zero stays unsigned). */
  signed?: boolean;
}

/** Keeps the code and the amount on one line. */
const NBSP = ' ';

/** The amount alone, with the locale's digits: at least 2 decimals, up to the currency's own. */
const amountText = (absMajor: number, decimals: number, locale?: string): string =>
  new Intl.NumberFormat(locale, {
    minimumFractionDigits: Math.min(2, Math.max(0, decimals)),
    maximumFractionDigits: Math.max(0, decimals),
  }).format(absMajor);

/**
 * ONE money format everywhere, for every currency: the code, a space, the
 * amount. "EUR 12.50", "USD 81.00", "USDC 202.50", "USDC 0.004" (at least 2
 * decimals, up to the currency's own, so a small crypto amount is never
 * rounded away). Never a symbol, never the code after the number, whatever
 * the viewer's language: only the digits follow the locale ("EUR 1.234,56").
 */
export function formatMinor(minor: number, currency: string, decimals: number, options: MoneyFormatOptions = {}): string {
  const code = (currency || '').toUpperCase();
  const value = toMajor(minor, decimals);
  const amount = amountText(Math.abs(value), decimals, options.locale);
  // Minor units are whole numbers shown in full: zero is exactly 0, and stays unsigned.
  const sign = minor === 0 ? '' : minor < 0 ? '-' : options.signed ? '+' : '';
  return `${sign}${code ? `${code}${NBSP}` : ''}${amount}`;
}

export interface MoneyParts {
  /** "EUR", "USDC". Always shown BEFORE the amount. */
  code: string;
  /** The number as the locale writes its digits ("1,234.50", "1.234,50"), with a leading "-" when negative. */
  amount: string;
}

/** `formatMinor` in two parts, so a hero number can show the code small and the amount large (code first). */
export function splitMoney(minor: number, currency: string, decimals: number, locale?: string): MoneyParts {
  const value = toMajor(minor, decimals);
  return { code: (currency || '').toUpperCase(), amount: `${value < 0 ? '-' : ''}${amountText(Math.abs(value), decimals, locale)}` };
}

export const formatCount = (n: number, locale?: string): string => new Intl.NumberFormat(locale).format(n);

/** "+3", "−2", "0". */
export const formatSignedCount = (n: number, locale?: string): string =>
  new Intl.NumberFormat(locale, { signDisplay: 'exceptZero' }).format(n);

/** 0.125 → "12.5%". */
export const formatRatio = (ratio: number, locale?: string): string =>
  new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(ratio);

/** part / whole, or null when there is no whole to compare with. */
export const stepConversion = (part: number, whole: number | null | undefined): number | null =>
  whole === null || whole === undefined || whole <= 0 ? null : part / whole;

/**
 * "+3 vs previous 30 days", "−2 (−40%) vs previous 30 days",
 * "Same as previous 30 days". No percentage when the previous value is 0.
 */
export function deltaText(current: number, previous: number, comparisonLabel: string, locale?: string): string {
  const diff = current - previous;
  if (diff === 0) return `Same as ${comparisonLabel}`;
  const pct =
    previous > 0
      ? ` (${new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0, signDisplay: 'exceptZero' }).format(diff / previous)})`
      : '';
  return `${formatSignedCount(diff, locale)}${pct} vs ${comparisonLabel}`;
}

/** Same as `deltaText`, for one currency: "+EUR 12.00 vs previous 30 days". */
export function moneyDeltaText(
  current: number,
  previous: number,
  currency: string,
  decimals: number,
  comparisonLabel: string,
  locale?: string,
): string {
  const diff = current - previous;
  if (diff === 0) return `Same as ${comparisonLabel}`;
  // No "−100%": when nothing is left, the amount says it plainly.
  const pct =
    previous > 0 && current > 0
      ? ` (${new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0, signDisplay: 'exceptZero' }).format(diff / previous)})`
      : '';
  return `${formatMinor(diff, currency, decimals, { locale, signed: true })}${pct} vs ${comparisonLabel}`;
}

export interface MoneyPair {
  currency: string;
  decimals: number;
  current: MoneyLine | null;
  previous: MoneyLine | null;
}

/**
 * A currency that has something in the selected period (a purchase, or an
 * amount): it gets its own number and chart. A currency seen only in the
 * previous period gets one quiet line instead (`idleCurrencyText`).
 */
export const isActivePair = (pair: MoneyPair): boolean =>
  pair.current !== null && (pair.current.purchases > 0 || pair.current.proceeds !== 0);

/** "No USD sales in this period (USD 32.40 in the previous 30 days)." Null when there is nothing to say. */
export function idleCurrencyText(pair: MoneyPair, comparisonLabel: string | null, locale?: string): string | null {
  if (isActivePair(pair)) return null;
  const before = pair.previous?.proceeds ?? 0;
  const head = `No ${pair.currency} sales in this period`;
  if (!comparisonLabel || !pair.previous || (before === 0 && pair.previous.purchases === 0)) return `${head}.`;
  return `${head} (${formatMinor(before, pair.currency, pair.decimals, { locale })} in the ${comparisonLabel}).`;
}

/** The currencies of this period and the previous one, side by side, sorted by code. */
export function pairMoneyLines(current: MoneyLine[], previous: MoneyLine[]): MoneyPair[] {
  const byCode = new Map<string, MoneyPair>();
  current.forEach((line) => {
    byCode.set(line.currency, { currency: line.currency, decimals: line.decimals, current: line, previous: null });
  });
  previous.forEach((line) => {
    const pair = byCode.get(line.currency);
    if (pair) pair.previous = line;
    else byCode.set(line.currency, { currency: line.currency, decimals: line.decimals, current: null, previous: line });
  });
  return Array.from(byCode.values()).sort((a, b) => a.currency.localeCompare(b.currency));
}

export interface ChartDay {
  /** First day of the point inside the period. */
  day: string;
  /** Last day of the point inside the period (= day for a daily point). */
  end: string;
  /** In the currency's own unit (12.5 = EUR 12.50), for the chart axis only. */
  proceeds: number;
  proceedsMinor: number;
  purchases: number;
}

export interface CurrencySeries {
  currency: string;
  decimals: number;
  days: ChartDay[];
}

/**
 * One series per currency, one entry per point of the API's series (a day, a
 * week or a month: the API sends every point of the period, empty ones
 * included), zero where nothing was paid in that currency.
 */
export function currencySeries(daily: DailyPoint[]): CurrencySeries[] {
  const currencies = new Map<string, number>();
  daily.forEach((point) => point.money.forEach((m) => currencies.set(m.currency, m.decimals)));
  return Array.from(currencies.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([currency, decimals]) => ({
      currency,
      decimals,
      days: daily.map((point) => {
        const entry = point.money.find((m) => m.currency === currency);
        const minor = entry?.proceeds ?? 0;
        return { day: point.day, end: point.end, proceeds: toMajor(minor, decimals), proceedsMinor: minor, purchases: entry?.purchases ?? 0 };
      }),
    }));
}

// --- Earnings: the one money number the screens show ------------------------------------

/** The name of the creator's money on every screen (the API calls it `proceeds` / "your share"). */
export const EARNINGS_LABEL = 'Your earnings';

/** The API's sentences still say "your share"; the screens say "your earnings". Nothing else is rewritten. */
export function earningsWording(sentence: string): string {
  return sentence
    .replace(/\bYour share is\b/g, 'Your earnings are')
    .replace(/\byour share is\b/g, 'your earnings are')
    .replace(/\bYour share\b/g, 'Your earnings')
    .replace(/\byour share\b/g, 'your earnings');
}

/**
 * The one transparency sentence for "How this is counted", from the API's own
 * definitions: "Your earnings are what buyers paid minus BaseTube's 10% fee, …".
 * The percentage is only added when the API's fee sentence states one.
 */
export function earningsDefinition(definitions: Partial<Pick<Definitions, 'proceeds' | 'platformFee'>> | undefined): string | null {
  const proceeds = definitions?.proceeds;
  if (!proceeds) return null;
  const sentence = earningsWording(proceeds);
  const pct = definitions?.platformFee?.match(/(\d+(?:[.,]\d+)?)\s?%/);
  if (!pct || !sentence.includes("BaseTube's fee")) return sentence;
  return sentence.replace("BaseTube's fee", `BaseTube's ${pct[1]}% fee`);
}

/** Said when the API does not send its own sentence. */
export const EARNINGS_BEFORE_CARD_FEE_FALLBACK =
  'Earnings are shown before the card processing fee your payment provider takes on card sales.';

/**
 * The one line that says earnings are shown before the card processing fee:
 * the API's `earningsBeforeCardFee` sentence when it sends one, otherwise the
 * owner's sentence. No amount: the screens show no fee breakdown.
 */
export function earningsCardFeeLine(definitions: Partial<Pick<Definitions, 'earningsBeforeCardFee'>> | undefined): string {
  const fromApi = definitions?.earningsBeforeCardFee;
  return typeof fromApi === 'string' && fromApi.trim() ? earningsWording(fromApi.trim()) : EARNINGS_BEFORE_CARD_FEE_FALLBACK;
}

/** "3 older purchases have no recorded amount" (counted, never summed). */
export const amountUnknownText = (count: number, locale?: string): string =>
  `${formatCount(count, locale)} older ${count === 1 ? 'purchase has' : 'purchases have'} no recorded amount`;

/**
 * Why the earnings of one currency moved, in a few quiet lines: refunds,
 * small refunds that kept the access, bank disputes, and purchases with no
 * recorded amount. No fee, no gross: the creator reads earnings only.
 */
export function quietMoneyLines(line: MoneyLine, locale?: string): string[] {
  const money = (minor: number) => formatMinor(minor, line.currency, line.decimals, { locale });
  const out: string[] = [];
  const { refunds, disputes } = line;
  if (refunds.count > 0) {
    const amount =
      refunds.amountUnknownCount >= refunds.count
        ? 'amount not recorded'
        : `${money(refunds.amountReturned)} returned${
            refunds.amountUnknownCount > 0 ? ` (not recorded for ${formatCount(refunds.amountUnknownCount, locale)})` : ''
          }`;
    out.push(`${plural(refunds.count, 'refund', 'refunds', locale)} · ${amount}`);
  }
  if (refunds.keptAccessCount > 0) {
    out.push(`${plural(refunds.keptAccessCount, 'small refund', 'small refunds', locale)}, access kept · ${money(refunds.keptAccessAmount)}`);
  }
  if (disputes.count > 0) {
    const amount =
      disputes.amountUnknownCount >= disputes.count
        ? 'amount not recorded'
        : `${money(disputes.gross)}${disputes.amountUnknownCount > 0 ? ` (not recorded for ${formatCount(disputes.amountUnknownCount, locale)})` : ''}`;
    out.push(`${plural(disputes.count, 'purchase', 'purchases', locale)} disputed by the bank · ${amount}`);
  }
  if (line.amountUnknownPurchases > 0) out.push(amountUnknownText(line.amountUnknownPurchases, locale));
  return out;
}

// --- Funnel, as a picture ------------------------------------------------------------------

export type FunnelStepKey = 'visits' | 'uniqueVisitors' | 'checkoutsStarted' | 'paid';

export interface FunnelStepView {
  key: FunnelStepKey;
  label: string;
  /** null when visits were not counted. */
  value: number | null;
  /** Bar length, 0–100, proportional to the largest known step (2 at least when not zero). */
  width: number;
}

export interface FunnelView {
  steps: FunnelStepView[];
  /** Between unique visitors and checkouts: "12% started a checkout". */
  toCheckout: string | null;
  /** Between checkouts and paid, the API's own ratio: "50% of them paid". */
  toPaid: string | null;
  /** The whole funnel in one line, the API's own ratio: "3.2% of visitors paid". */
  headline: string | null;
  /** "3 abandoned (25%)" when a checkout was started. */
  abandoned: string | null;
}

/** Visit → unique visitor → checkout → paid, with bar lengths and the conversion between steps. */
export function funnelView(funnel: Funnel, locale?: string): FunnelView {
  const raw: Array<[FunnelStepKey, string, number | null]> = [
    ['visits', 'Visits', funnel.visits],
    ['uniqueVisitors', 'Unique visitors', funnel.uniqueVisitors],
    ['checkoutsStarted', 'Checkouts started', funnel.checkoutsStarted],
    ['paid', 'Paid', funnel.paid],
  ];
  const max = Math.max(0, ...raw.map(([, , value]) => value ?? 0));
  const steps = raw.map(([key, label, value]) => ({
    key,
    label,
    value,
    width: value && value > 0 && max > 0 ? Math.max(2, Math.round((value / max) * 1000) / 10) : 0,
  }));

  const checkoutRatio = stepConversion(funnel.checkoutsStarted, funnel.uniqueVisitors);
  const toCheckout =
    checkoutRatio === null
      ? null
      : checkoutRatio > 1
        ? 'More checkouts than counted visitors'
        : `${formatRatio(checkoutRatio, locale)} started a checkout`;
  const toPaid = funnel.checkoutConversion === null ? null : `${formatRatio(funnel.checkoutConversion, locale)} of them paid`;
  const headline =
    funnel.visitConversion === null
      ? null
      : funnel.visitConversion > 1
        ? 'More buyers than counted visitors'
        : `${formatRatio(funnel.visitConversion, locale)} of visitors paid`;
  const abandoned =
    funnel.checkoutsStarted > 0
      ? `${formatCount(funnel.abandoned, locale)} abandoned (${formatRatio(funnel.abandoned / funnel.checkoutsStarted, locale)})`
      : null;
  return { steps, toCheckout, toPaid, headline, abandoned };
}

export const ACCESS_LABELS: Record<AccessState, string> = {
  active: 'Has access',
  refunded: 'Refunded',
  disputed: 'Disputed',
  none: 'No access',
};

export interface HoldingText {
  /** What they can open now: "2 passes", "No pass now". */
  main: string;
  /** Only when it differs from what they bought: "1 refunded or disputed", "Refunded", "No longer has access". */
  note: string | null;
}

/**
 * What a customer HAS, in a creator's words. A pass they bought and no longer
 * hold had every purchase of it refunded or disputed (any other paid purchase
 * still gives access).
 */
export function holdingText(row: Pick<CustomerRow, 'passesBought' | 'passesHeld' | 'accessState'>, locale?: string): HoldingText {
  if (row.passesHeld <= 0) {
    const note =
      row.accessState === 'refunded' ? 'Refunded' : row.accessState === 'disputed' ? 'Disputed by their bank' : 'No longer has access';
    return { main: 'No pass now', note };
  }
  const lost = row.passesBought - row.passesHeld;
  return {
    main: plural(row.passesHeld, 'pass', 'passes', locale),
    note: lost > 0 ? `${formatCount(lost, locale)} more refunded or disputed` : null,
  };
}

/** Why a buyer's email is not on screen, in plain words. */
export function emailHiddenText(reason: EmailHiddenReason | null): string {
  if (reason === 'bought_before_disclosure') return 'Email hidden: bought before buyers were told their email is shared with you';
  if (reason === 'no_real_address') return 'No email: this buyer signed in without a real email address';
  return 'Email not shared';
}

/** "Opened 3 of 5 videos" / "Not opened yet". */
export function videosOpenedText(opened: number, total: number): string {
  if (opened <= 0) return 'Not opened yet';
  return `Opened ${opened} of ${total} ${total === 1 ? 'video' : 'videos'}`;
}

export type NextStep =
  | { kind: 'no_pass' }
  | { kind: 'draft'; passId: string; title: string; status: PassRow['status'] }
  | { kind: 'share'; passId: string; title: string; publicUrl: string }
  /** Passes exist, none can be bought and none is in draft (paused, sold out, sales switched off, or blocked). */
  | { kind: 'not_selling' };

const UNPUBLISHED: ReadonlyArray<PassRow['status']> = ['draft', 'publishing', 'publish_failed'];

/**
 * What a creator with no sales should do next: create a pass, share the one
 * on sale, or finish the one in draft (rows are newest first).
 */
export function nextStep(passes: PassRow[]): NextStep {
  if (!passes.length) return { kind: 'no_pass' };
  const onSale = passes.find((p) => p.status === 'on_sale');
  if (onSale) return { kind: 'share', passId: onSale.passId, title: onSale.title, publicUrl: onSale.publicUrl };
  const draft = passes.find((p) => UNPUBLISHED.includes(p.status));
  if (draft) return { kind: 'draft', passId: draft.passId, title: draft.title, status: draft.status };
  return { kind: 'not_selling' };
}

/** A campaign name as a tag: "Spring launch!" → "spring-launch". */
export const campaignSlug = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

/** The pass link with UTM tags added (existing query kept, utm_* replaced). */
export function taggedLink(url: string, tags: { source: string; medium: string; campaign?: string }): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  parsed.searchParams.set('utm_source', tags.source);
  parsed.searchParams.set('utm_medium', tags.medium);
  const campaign = tags.campaign ? campaignSlug(tags.campaign) : '';
  if (campaign) parsed.searchParams.set('utm_campaign', campaign);
  else parsed.searchParams.delete('utm_campaign');
  return parsed.toString();
}

/** A moment (ISO, UTC) in the viewer's own time zone: "12 Nov 2026". */
export function formatMomentDate(iso: string | null | undefined, locale?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

/** A moment (ISO, UTC) in the viewer's own time zone, with the time: "12 Nov 2026, 14:05". */
export function formatMoment(iso: string | null | undefined, locale?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/** "1 purchase" / "3 purchases". */
export const plural = (n: number, one: string, many: string, locale?: string): string =>
  `${formatCount(n, locale)} ${n === 1 ? one : many}`;

// --- Can this pass be bought? ---------------------------------------------------------

/** Where BaseTube answers creators (the address the account notices use). */
export const BASETUBE_CONTACT_EMAIL = 'hello@base.tube';

export type SaleTone = 'on_sale' | 'draft' | 'publishing' | 'failed' | 'stopped' | 'blocked';

/**
 * What fixes a blocked pass:
 *   link   an app page (internal) or a mailto: to BaseTube (external) when only BaseTube can fix it;
 *   resume the creator's own pause: "Resume sales" runs right there.
 */
export type SaleFix =
  | { kind: 'link'; label: string; href: string; external: boolean }
  | { kind: 'resume'; label: string; passId: string };

export interface SaleState {
  /** The API's own words for the state ("On sale", "Sales paused", "Cannot be bought yet"…). */
  label: string;
  onSale: boolean;
  tone: SaleTone;
  /** Why nobody can buy it, in the API's plain words; null when it is on sale. */
  reason: string | null;
  /** BaseTube's own reason when BaseTube paused the sales and wrote one. */
  basetubeReason: string | null;
  /** What fixes it, when there is something to do; null otherwise. */
  fix: SaleFix | null;
}

const contact = (label: string, subject: string): SaleFix => ({
  kind: 'link',
  label,
  href: `mailto:${BASETUBE_CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`,
  external: true,
});

const TONES: Record<PassRow['status'], SaleTone> = {
  on_sale: 'on_sale',
  draft: 'draft',
  publishing: 'publishing',
  publish_failed: 'failed',
  paused: 'stopped',
  paused_by_basetube: 'blocked',
  sold_out: 'stopped',
  sales_off: 'blocked',
  not_available: 'blocked',
};

/** The Selling readiness panel (Business overview) for one channel. */
export const readinessHref = (channelId: number | null | undefined): string =>
  `/creator-hub/business${channelId ? `?channel=${channelId}` : ''}#selling-readiness`;

/**
 * The real state of a pass from the business API: "On sale" only when
 * someone can buy it right now (`purchaseBlock.canPurchase`), else the API's
 * reason and the action that fixes it. A contact link to BaseTube is left
 * only for what truly needs BaseTube (its own pause, an unfinished payment
 * set-up); everything else has a real action.
 */
export function saleState(
  pass: Pick<PassRow, 'passId' | 'title' | 'status' | 'statusLabel' | 'purchaseBlock'> &
    Partial<Pick<PassRow, 'channelId' | 'salePause'>>,
  options: { videoCount?: number } = {},
): SaleState {
  const block = pass.purchaseBlock;
  const onSale = block.canPurchase && pass.status === 'on_sale';
  const title = pass.title || 'my pass';
  let fix: SaleFix | null = null;
  if (!onSale) {
    if (pass.status === 'publishing') {
      // Being published right now: nothing to do but wait.
      fix = null;
    } else if (pass.status === 'draft' || pass.status === 'publish_failed' || block.code === 'PASS_NOT_PUBLISHED') {
      fix = { kind: 'link', label: 'Finish publishing', href: `/creator-hub/create-content-pass?draft=${encodeURIComponent(pass.passId)}`, external: false };
    } else if (block.code === 'PASS_CONTENT_INVALID') {
      fix = {
        kind: 'link',
        label: options.videoCount === 0 ? 'Add a YouTube video' : 'Fix the videos',
        href: `/creator-hub/passes/${encodeURIComponent(pass.passId)}#pass-videos`,
        external: false,
      };
    } else if (block.code === 'PASS_SALE_INACTIVE') {
      fix = { kind: 'resume', label: 'Resume sales', passId: pass.passId };
    } else if (block.code === 'PASS_SALE_PAUSED_BY_BASETUBE') {
      fix = contact('Contact BaseTube', `Paused pass: ${title}`);
    } else if (block.code === 'PASS_CHANNEL_NOT_APPROVED') {
      fix = { kind: 'link', label: 'See what is missing', href: readinessHref(pass.channelId), external: false };
    } else if (block.code === 'PASS_NOT_ONCHAIN') {
      fix = contact('Contact BaseTube', `Payment set-up: ${title}`);
    }
  }
  return {
    // Never "On sale" when nobody can buy it.
    label: !onSale && pass.status === 'on_sale' ? 'Cannot be bought right now' : pass.statusLabel,
    onSale,
    tone: onSale ? 'on_sale' : TONES[pass.status] === 'on_sale' ? 'blocked' : TONES[pass.status] ?? 'blocked',
    reason: onSale ? null : block.reason,
    basetubeReason: pass.salePause?.by === 'basetube' ? pass.salePause.reason : null,
    fix,
  };
}

// --- Pass-video plays ------------------------------------------------------------------

export interface WatchPeriodChoice {
  period: PassWatchPeriod;
  /** False when the business period has no equivalent: the plays then cover all time. */
  exact: boolean;
}

/** The plays endpoint knows 7, 30 and 90 days and all time; the last 12 months and custom ranges read all time. */
export function watchPeriodFor(preset: PeriodPreset): WatchPeriodChoice {
  if (preset === '7d' || preset === '30d' || preset === '90d' || preset === 'all') return { period: preset, exact: true };
  return { period: 'all', exact: false };
}

/** "Started by 3 of 8 buyers" (buyers with access now); "Started by 3 buyers" when more started than hold it now. */
export function startedText(started: number, buyersWithAccess: number, locale?: string): string {
  if (buyersWithAccess > 0 && started <= buyersWithAccess) {
    return `Started by ${formatCount(started, locale)} of ${plural(buyersWithAccess, 'buyer', 'buyers', locale)}`;
  }
  return `Started by ${plural(started, 'buyer', 'buyers', locale)}`;
}

/** The average and the watch time, or why they are not shown. */
export function averageWatchedText(row: PassWatchAggregate, minBuyers: number, locale?: string): string {
  if (row.averagesWithheld) {
    return `Average and watch time shown once at least ${formatCount(minBuyers, locale)} buyers have watched (to protect each buyer's privacy)`;
  }
  const parts: string[] = [];
  parts.push(
    row.averagePercentWatched === null
      ? 'Average watched not known (no video length)'
      : `Average watched ${formatRatio(row.averagePercentWatched / 100, locale)}`,
  );
  if (row.watchSeconds !== null) parts.push(`${formatDuration(row.watchSeconds)} watched in total`);
  return parts.join(' · ');
}

/** "Started by 3 of 8 buyers · Finished by 1". */
export function playsText(row: PassWatchAggregate, buyersWithAccess: number, locale?: string): string {
  return `${startedText(row.buyersStarted, buyersWithAccess, locale)} · Finished by ${formatCount(row.buyersCompleted, locale)}`;
}

/** The creator's own previews of it: "2 plays, 3 min 10 s" (never counted as buyers); null when none. */
export function previewText(row: PassWatchAggregate, locale?: string): string | null {
  const { sessions, watchSeconds } = row.creatorPreview;
  if (sessions <= 0 && watchSeconds <= 0) return null;
  return `${plural(sessions, 'play', 'plays', locale)}, ${formatDuration(watchSeconds)}`;
}
