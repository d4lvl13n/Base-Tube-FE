import api from './index';
import type {
  AccessState,
  CheckVideoResponse,
  CreatorBusinessErrorBody,
  CustomerDetailResponse,
  CustomerSort,
  CustomersResponse,
  OverviewResponse,
  PassDetailResponse,
  PassesResponse,
  PassSort,
  PassVideosResponse,
  PayoutsResponse,
  ReadinessResponse,
  RemoveVideoResponse,
  ReplaceVideoResponse,
  ReviewRequestResponse,
  SaleActionResponse,
  SourceKey,
  SourcesResponse,
} from '../types/creatorBusiness';

/**
 * The creator's own business numbers: /api/v1/creator/business.
 * Every call to these endpoints lives here. Response shapes are the backend's
 * own types (src/types/creatorBusiness.ts, copied unchanged).
 *
 * Envelope: { success: true, data } | { success: false, error: { code, message, field? } }.
 * A failure keeps the axios error, so `plainApiError` / `parseApiError` read
 * the server's sentence and code from it.
 */
const BASE = '/api/v1/creator/business';

/**
 * Days are UTC 'YYYY-MM-DD'. Either from / to (a custom range of at most
 * 3,660 days; none = the last 30 days) or range=all (from the first checkout
 * or payment to today, with no previous period). No channelId = all the
 * creator's channels.
 */
export interface BusinessScopeParams {
  range?: 'all';
  from?: string;
  to?: string;
  channelId?: number;
}

export interface PageParams {
  page?: number;
  pageSize?: number;
}

export interface PassesParams extends BusinessScopeParams, PageParams {
  sort?: PassSort;
  dir?: 'asc' | 'desc';
}

export interface CustomerFilterParams {
  search?: string;
  passId?: string;
  access?: AccessState;
  buyerType?: 'new' | 'returning';
  canContact?: boolean;
  opened?: 'opened' | 'never';
  source?: SourceKey;
}

export interface CustomersParams extends BusinessScopeParams, PageParams, CustomerFilterParams {
  sort?: CustomerSort;
  dir?: 'asc' | 'desc';
  sortCurrency?: string;
}

type Envelope<T> = { success: true; data: T } | { success: false; error: { code: string; message: string } };

/** Drop empty values so the URL only carries what was chosen. */
function query(params: object): Record<string, string> {
  const out: Record<string, string> = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    out[key] = String(value);
  });
  return out;
}

async function getData<T>(path: string, params: object): Promise<T> {
  const response = await api.get<Envelope<T>>(`${BASE}${path}`, { params: query(params) });
  const body = response.data;
  if (!body || body.success !== true) {
    const error = body && body.success === false ? body.error : null;
    throw Object.assign(new Error(error?.message || 'Your business numbers could not be loaded. Please try again.'), {
      response: { status: response.status, data: body },
    });
  }
  return body.data;
}

export const getBusinessOverview = (params: BusinessScopeParams) => getData<OverviewResponse>('/overview', params);

export const getBusinessPasses = (params: PassesParams) => getData<PassesResponse>('/passes', params);

export const getBusinessPass = (passId: string, params: BusinessScopeParams) =>
  getData<PassDetailResponse>(`/passes/${encodeURIComponent(passId)}`, params);

export const getBusinessCustomers = (params: CustomersParams) => getData<CustomersResponse>('/customers', params);

export const getBusinessCustomer = (customerId: string, params: BusinessScopeParams & PageParams) =>
  getData<CustomerDetailResponse>(`/customers/${encodeURIComponent(customerId)}`, params);

export const getBusinessSources = (params: BusinessScopeParams) => getData<SourcesResponse>('/sources', params);

/** No from/to (or range=all) = all time, the payouts default. */
export const getBusinessPayouts = (params: BusinessScopeParams) => getData<PayoutsResponse>('/payouts', params);

// --- Creator actions (same base path and envelope) -------------------------------------

async function postData<T>(path: string, body: object = {}): Promise<T> {
  const response = await api.post<Envelope<T>>(`${BASE}${path}`, body);
  const data = response.data;
  if (!data || data.success !== true) {
    const error = data && data.success === false ? data.error : null;
    throw Object.assign(new Error(error?.message || 'This could not be done. Please try again.'), {
      response: { status: response.status, data },
    });
  }
  return data.data;
}

const passPath = (passId: string) => `/passes/${encodeURIComponent(passId)}`;

/** Pause new sales of your pass. Buyers keep their access; paid checkouts still go through. */
export const pausePassSale = (passId: string) => postData<SaleActionResponse>(`${passPath(passId)}/sale/pause`);

/** Resume your own pause. Refused (409 SALE_CANNOT_RESUME, with `blockers`) while something else blocks a sale. */
export const resumePassSale = (passId: string) => postData<SaleActionResponse>(`${passPath(passId)}/sale/resume`);

/** The videos of your pass, each with why it cannot be sold (if so) and whether it can be removed. */
export const getCreatorPassVideos = (passId: string) => getData<PassVideosResponse>(`${passPath(passId)}/videos`, {});

/**
 * Take a video out of the pass (it is kept for history, nobody can play it any more).
 * When people have access to the pass, `confirmBuyersWithAccess` must be the number they were shown.
 */
export const removeCreatorPassVideo = (passId: string, videoId: string, confirmBuyersWithAccess?: number) =>
  postData<RemoveVideoResponse>(
    `${passPath(passId)}/videos/${encodeURIComponent(videoId)}/remove`,
    confirmBuyersWithAccess === undefined ? {} : { confirmBuyersWithAccess },
  );

/** Put a working YouTube video in the place of this one (same position). */
export const replaceCreatorPassVideo = (passId: string, videoId: string, srcUrl: string, title?: string) =>
  postData<ReplaceVideoResponse>(`${passPath(passId)}/videos/${encodeURIComponent(videoId)}/replace`, title ? { srcUrl, title } : { srcUrl });

/** Ask YouTube again about one video of the pass. */
export const checkCreatorPassVideo = (passId: string, videoId: string) =>
  postData<CheckVideoResponse>(`${passPath(passId)}/videos/${encodeURIComponent(videoId)}/check`);

/** What each of your channels needs before its passes can be sold. No channelId = every channel. */
export const getSellingReadiness = (channelId?: number | null) =>
  getData<ReadinessResponse>('/readiness', channelId ? { channelId } : {});

/** Ask BaseTube to look again at a channel whose pass sales it stopped (once a week). */
export const requestPassSalesReview = (channelId: number, message?: string) =>
  postData<ReviewRequestResponse>(`/readiness/${encodeURIComponent(String(channelId))}/review-request`, message ? { message } : {});

/** The error body of a failed creator business call (code, message and the extra fields), when it has one. */
export function businessErrorBody(error: unknown): CreatorBusinessErrorBody | null {
  const data = (error as { response?: { data?: unknown } })?.response?.data as { error?: unknown } | undefined;
  const body = data && typeof data === 'object' ? data.error : null;
  if (!body || typeof body !== 'object') return null;
  const b = body as Partial<CreatorBusinessErrorBody>;
  return typeof b.code === 'string' && typeof b.message === 'string' ? (b as CreatorBusinessErrorBody) : null;
}

/**
 * The CSV and what the server says about it. The API exposes these headers to
 * the browser (CORS `exposedHeaders`): Content-Disposition, X-Total-Count,
 * X-Export-Row-Count, X-Export-Truncated.
 */
export interface CustomersExport {
  blob: Blob;
  /** The server's file name, e.g. basetube-customers-2026-10-14-to-2026-11-12.csv. */
  filename: string;
  /** People matching the filters (X-Total-Count). */
  total: number | null;
  /** Rows written in the file (X-Export-Row-Count). */
  rows: number | null;
  /** The file stopped at the export cap (X-Export-Truncated: true). */
  truncated: boolean;
}

const headerNumber = (value: unknown): number | null => {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
  return Number.isFinite(n) ? n : null;
};

/** Only used if a proxy strips Content-Disposition; the server always sends it. */
const EXPORT_FILENAME = 'basetube-customers.csv';

/** The file name in `Content-Disposition` (RFC 6266 `filename*=UTF-8''…` first, then `filename="…"`). */
export const filenameFromDisposition = (disposition: unknown): string | null => {
  if (typeof disposition !== 'string') return null;
  const star = disposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (star) {
    try {
      return decodeURIComponent(star[1].trim());
    } catch {
      // Malformed encoding: read the plain form below.
    }
  }
  const plain = disposition.match(/filename\s*=\s*"([^"]+)"|filename\s*=\s*([^;]+)/i);
  const name = plain ? (plain[1] ?? plain[2]).trim() : '';
  return name || null;
};

/**
 * The CSV of the filtered customer list. The body is a Blob; on failure the
 * server's JSON error arrives as a Blob too, so it is read back and rethrown
 * with the server's sentence.
 */
export async function exportBusinessCustomers(params: Omit<CustomersParams, 'page' | 'pageSize'>): Promise<CustomersExport> {
  try {
    const response = await api.get<Blob>(`${BASE}/customers/export`, {
      params: query(params),
      responseType: 'blob',
    });
    const headers = (response.headers ?? {}) as Record<string, unknown>;
    return {
      blob: response.data,
      filename: filenameFromDisposition(headers['content-disposition']) ?? EXPORT_FILENAME,
      total: headerNumber(headers['x-total-count']),
      rows: headerNumber(headers['x-export-row-count']),
      truncated: headers['x-export-truncated'] === 'true',
    };
  } catch (error) {
    const data = (error as { response?: { data?: unknown } })?.response?.data;
    if (typeof Blob !== 'undefined' && data instanceof Blob) {
      try {
        const parsed = JSON.parse(await data.text());
        (error as { response: { data: unknown } }).response.data = parsed;
      } catch {
        // Not JSON: keep the original error.
      }
    }
    throw error;
  }
}

// --- Pass-video plays (creator aggregates) ------------------------------------------
//
// GET /api/v1/creators/channels/:channelId/pass-videos/watch?period=7d|30d|90d|all&passId=<uuid>
// (creator analytics routes, envelope { success, data }). Aggregates only, never a
// per-buyer row. Shapes copied from base-be src/modules/passVideoWatch/passVideoWatchService.ts.

export type PassWatchPeriod = '7d' | '30d' | '90d' | 'all';

export interface PassWatchCreatorPreview {
  /** Times the creator started this content themselves. */
  sessions: number;
  watchSeconds: number;
}

export interface PassWatchAggregate {
  /** Distinct buyers who started at least once in the period. */
  buyersStarted: number;
  /** Distinct buyers who finished (per video) / finished at least one video (per pass). */
  buyersCompleted: number;
  /** Mean share watched per buyer (capped at 100 %), one decimal; null when withheld or no duration known. */
  averagePercentWatched: number | null;
  /** Total buyer watch time in seconds; null when withheld. */
  watchSeconds: number | null;
  /** True when fewer than `minBuyersForAverages` buyers started. */
  averagesWithheld: boolean;
  creatorPreview: PassWatchCreatorPreview;
}

export interface PassVideoWatchRow extends PassWatchAggregate {
  passVideoId: string;
  passId: string;
  title: string | null;
  durationSeconds: number | null;
}

export interface PassWatchRow extends PassWatchAggregate {
  passId: string;
  title: string;
  /** Distinct buyers with an access-granting purchase (on-chain-only holders are not in it). */
  buyersWithAccess: number;
  /** Buyer × video completions. */
  completions: number;
}

export interface PassWatchAggregates {
  period: PassWatchPeriod;
  /** When recording started (ISO, UTC); nothing before it exists. */
  measuredSince: string | null;
  minBuyersForAverages: number;
  passes: PassWatchRow[];
  videos: PassVideoWatchRow[];
}

export async function getPassVideoWatch(channelId: number, params: { period: PassWatchPeriod; passId?: string }): Promise<PassWatchAggregates> {
  const response = await api.get<{ success: boolean; data?: PassWatchAggregates; message?: string }>(
    `/api/v1/creators/channels/${encodeURIComponent(String(channelId))}/pass-videos/watch`,
    { params: query(params) },
  );
  const body = response.data;
  if (!body || body.success !== true || !body.data) {
    throw Object.assign(new Error(body?.message || 'The plays of your pass videos could not be loaded.'), {
      response: { status: response.status, data: body },
    });
  }
  return body.data;
}
