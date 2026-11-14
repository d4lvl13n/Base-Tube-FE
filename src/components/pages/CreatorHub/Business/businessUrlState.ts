/**
 * Every filter, period, tab, page and sort of the business screens lives in
 * the address, so a view can be shared and survives a reload. These pure
 * functions read the address (dropping anything malformed instead of sending
 * it to the API) and write it back. Unit-tested.
 *
 * Shared keys:  period (7d|30d|90d|12m|all|custom), from, to (custom only),
 *               channel (a channel id; absent = all my channels).
 * Customers:    q, pass, access, buyer (new|returning), contact (yes|no),
 *               opened (opened|never), source, sort, dir, cur, page, size.
 */
import type { CustomersParams } from '../../../../api/creatorBusiness';
import type { AccessState, CustomerSort, SourceKey } from '../../../../types/creatorBusiness';
import { DEFAULT_PRESET, isPreset, isValidDay, type PeriodPreset } from './businessPeriod';

export const SCOPE_KEYS = ['period', 'from', 'to', 'channel'] as const;

export interface ScopeState {
  preset: PeriodPreset;
  from: string | null;
  to: string | null;
  /** null = all my channels. */
  channelId: number | null;
}

const positiveInt = (raw: string | null, max = 1_000_000_000): number | null => {
  if (!raw || !/^\d{1,10}$/.test(raw)) return null;
  const n = Number(raw);
  return n >= 1 && n <= max ? n : null;
};

/** `fallback`: the period when the address names none (Payouts reads all time by default). */
export function parseScope(params: URLSearchParams, fallback: PeriodPreset = DEFAULT_PRESET): ScopeState {
  const rawPreset = params.get('period');
  const preset: PeriodPreset = isPreset(rawPreset) ? rawPreset : fallback;
  const from = params.get('from');
  const to = params.get('to');
  return {
    preset,
    from: preset === 'custom' && isValidDay(from) ? from : null,
    to: preset === 'custom' && isValidDay(to) ? to : null,
    channelId: positiveInt(params.get('channel')),
  };
}

/**
 * A copy of `params` with `patch` applied: a null / empty value removes the
 * key. `resetPage` drops `page` (a new filter starts on page 1).
 */
export function patchParams(
  params: URLSearchParams,
  patch: Record<string, string | number | null | undefined>,
  options: { resetPage?: boolean } = {},
): URLSearchParams {
  const next = new URLSearchParams(params);
  Object.entries(patch).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') next.delete(key);
    else next.set(key, String(value));
  });
  if (options.resetPage) next.delete('page');
  return next;
}

/** The period and channel only, for links between business screens ("?period=90d&channel=4"). */
export function scopeSearch(params: URLSearchParams, extra: Record<string, string | null | undefined> = {}): string {
  const next = new URLSearchParams();
  SCOPE_KEYS.forEach((key) => {
    const value = params.get(key);
    if (value) next.set(key, value);
  });
  Object.entries(extra).forEach(([key, value]) => {
    if (value) next.set(key, value);
  });
  const text = next.toString();
  return text ? `?${text}` : '';
}

// --- Customers --------------------------------------------------------------

export const ACCESS_VALUES: readonly AccessState[] = ['active', 'refunded', 'disputed', 'none'];
export const SOURCE_VALUES: readonly SourceKey[] = [
  'youtube',
  'x',
  'instagram',
  'tiktok',
  'facebook',
  'google',
  'newsletter',
  'direct',
  'other',
  'unknown',
];
export const CUSTOMER_SORTS: readonly CustomerSort[] = ['last_purchase', 'first_purchase', 'total_paid', 'purchases'];
export const PAGE_SIZES = [25, 50, 100] as const;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CURRENCY_RE = /^[A-Z]{3,5}$/;
/** The API refuses longer searches. */
export const MAX_SEARCH_LENGTH = 100;

export interface CustomerState {
  search: string;
  passId: string | null;
  access: AccessState | null;
  buyerType: 'new' | 'returning' | null;
  canContact: boolean | null;
  opened: 'opened' | 'never' | null;
  source: SourceKey | null;
  sort: CustomerSort;
  dir: 'asc' | 'desc';
  sortCurrency: string | null;
  page: number;
  pageSize: number;
}

function oneOf<T extends string>(raw: string | null, allowed: readonly T[]): T | null {
  return raw !== null && (allowed as readonly string[]).includes(raw) ? (raw as T) : null;
}

export function parseCustomerState(params: URLSearchParams): CustomerState {
  const size = positiveInt(params.get('size'));
  const contact = params.get('contact');
  const cur = (params.get('cur') || '').toUpperCase();
  const pass = params.get('pass');
  return {
    search: (params.get('q') || '').trim().slice(0, MAX_SEARCH_LENGTH),
    passId: pass && UUID_RE.test(pass) ? pass.toLowerCase() : null,
    access: oneOf(params.get('access'), ACCESS_VALUES),
    buyerType: oneOf(params.get('buyer'), ['new', 'returning'] as const),
    canContact: contact === 'yes' ? true : contact === 'no' ? false : null,
    opened: oneOf(params.get('opened'), ['opened', 'never'] as const),
    source: oneOf(params.get('source'), SOURCE_VALUES),
    sort: oneOf(params.get('sort'), CUSTOMER_SORTS) ?? 'last_purchase',
    dir: params.get('dir') === 'asc' ? 'asc' : 'desc',
    sortCurrency: CURRENCY_RE.test(cur) ? cur : null,
    page: positiveInt(params.get('page'), 100_000) ?? 1,
    pageSize: size !== null && (PAGE_SIZES as readonly number[]).includes(size) ? size : PAGE_SIZES[0],
  };
}

/** The API parameters for a customer state (filters, sort, page; scope added by the caller). */
export function customerApiParams(state: CustomerState): Omit<CustomersParams, 'from' | 'to' | 'channelId'> {
  return {
    search: state.search || undefined,
    passId: state.passId ?? undefined,
    access: state.access ?? undefined,
    buyerType: state.buyerType ?? undefined,
    canContact: state.canContact ?? undefined,
    opened: state.opened ?? undefined,
    source: state.source ?? undefined,
    sort: state.sort,
    dir: state.dir,
    sortCurrency: state.sortCurrency ?? undefined,
    page: state.page,
    pageSize: state.pageSize,
  };
}

/** How many filters (not search, sort or page) are on. */
export function activeFilterCount(state: CustomerState): number {
  return [state.passId, state.access, state.buyerType, state.canContact, state.opened, state.source].filter(
    (value) => value !== null,
  ).length;
}

/** The quick filter chips: each one is one address key with one value. */
export const QUICK_FILTERS = [
  { id: 'never_opened', label: 'Not opened yet', key: 'opened', value: 'never' },
  { id: 'returning', label: 'Returning', key: 'buyer', value: 'returning' },
  { id: 'refunded', label: 'Refunded', key: 'access', value: 'refunded' },
  { id: 'can_email', label: 'Can email', key: 'contact', value: 'yes' },
] as const;

/** Address keys every customer filter uses (cleared by "Clear filters"). */
export const CUSTOMER_FILTER_KEYS = ['q', 'pass', 'access', 'buyer', 'contact', 'opened', 'source'] as const;
