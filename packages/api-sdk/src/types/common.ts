/**
 * Shared response envelope and pagination shapes.
 *
 * The BaseTube backend does NOT use a single universal envelope: some routes
 * return raw arrays, some `{ success, data }`, some `{ error }`. These helpers
 * model the shapes that actually exist rather than forcing one contract.
 * See the Mobile Readiness Brief, sections C and F.3.
 */

/** Wrapped payload used by many (but not all) routes. */
export interface SuccessEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

/** Error envelope emitted by the central error handler and most controllers. */
export interface ErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

/** Page-based pagination metadata (`page`/`limit`). */
export interface PageMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore?: boolean;
}

/** Offset-based pagination metadata (`limit`/`offset`) used by pass routes. */
export interface OffsetMeta {
  total: number;
  limit: number;
  offset: number;
  hasMore?: boolean;
}

/** Generic page-based collection envelope. */
export interface PaginatedEnvelope<T> {
  success: boolean;
  data: T[];
  pagination: PageMeta;
}
