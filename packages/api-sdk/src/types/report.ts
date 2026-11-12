/** Content reports ("report this video / comment"). */

/** `POST /api/v1/reports/videos/:videoId` — 201 new report, 200 already reported. */
export interface ContentReportResponse {
  success: boolean;
  message?: string;
  data?: {
    id?: number | string;
    status?: string;
    alreadyReported?: boolean;
  };
}

/** `POST /api/v1/comments/:commentId/report` — no report data in the body. */
export interface CommentReportResponse {
  success: boolean;
  message?: string;
}

export interface ContentReportResult {
  /** The report's id, when the route returns one. */
  reportId: number | string | null;
  /** The report's moderation status (`'open'` for a fresh report), when returned. */
  status: string | null;
  /** True when this person already had an open report on the same item. */
  alreadyReported: boolean;
}

/** What went wrong with a report call, as far as the app needs to know. */
export type ReportFailure =
  /** The account is suspended or banned (403 ACCOUNT_SUSPENDED / ACCOUNT_BANNED). */
  | 'account_restricted'
  /** 401: no valid session. */
  | 'sign_in_required'
  /** 404: the item is gone or was taken down. */
  | 'not_found'
  /** 429: too many interactions in a short time. */
  | 'rate_limited'
  /** 400 with a reason code: empty, too long, or not text. */
  | 'invalid_reason'
  /** No response at all (offline, timeout, DNS). */
  | 'network'
  /** Anything else, including codes this SDK version does not know. */
  | 'unknown';
