import type { AxiosInstance } from 'axios';
import { accountRestrictionOf } from '../auth/account-restriction';
import { NO_RATE_LIMIT_RETRY } from '../client';
import type {
  CommentReportResponse,
  ContentReportResponse,
  ContentReportResult,
  ReportFailure,
} from '../types/report';

/** The backend stores the reason in a VARCHAR(1000) and rejects anything longer. */
export const REPORT_REASON_MAX_LENGTH = 1000;

const REASON_ERROR_CODES = new Set(['REASON_REQUIRED', 'REASON_TOO_LONG', 'INVALID_REASON']);

/**
 * Builds the `reason` text: the picked label, then the optional detail
 * (`"Spam or misleading: <detail>"`), trimmed and cut to `max` characters so
 * the backend's length check can never refuse it. Never splits an emoji.
 */
export function composeReportReason(
  label: string,
  detail?: string | null,
  max: number = REPORT_REASON_MAX_LENGTH
): string {
  const head = label.trim();
  const extra = (detail ?? '').trim();
  let text = (extra ? (head ? `${head}: ${extra}` : extra) : head).trim();
  if (text.length > max) {
    text = text.slice(0, max);
    // A cut between the two halves of a surrogate pair leaves a broken character.
    const last = text.charCodeAt(text.length - 1);
    if (last >= 0xd800 && last <= 0xdbff) text = text.slice(0, -1);
    text = text.trimEnd();
  }
  return text;
}

/**
 * Sorts a failed report call into what the app should tell the person.
 * Unknown statuses and codes land in `'unknown'` (the generic message), so a
 * newer backend can add codes without breaking an older app.
 */
export function reportFailureOf(error: unknown): ReportFailure {
  if (accountRestrictionOf(error)) return 'account_restricted';

  const response = (error as { response?: { status?: unknown; data?: unknown } } | null)?.response;
  if (!response || typeof response.status !== 'number') return 'network';

  const body = response.data as { error?: { code?: unknown }; code?: unknown } | null | undefined;
  const code = body?.error?.code ?? body?.code;

  switch (response.status) {
    case 401:
      return 'sign_in_required';
    case 404:
      return 'not_found';
    case 429:
      return 'rate_limited';
    case 400:
      return typeof code === 'string' && REASON_ERROR_CODES.has(code) ? 'invalid_reason' : 'unknown';
    default:
      return 'unknown';
  }
}

/**
 * "Report this" for user-generated content. Every report lands in the admin
 * Moderation queue. All routes need a signed-in user and share the backend's
 * `interactionLimiter` (30 requests / minute / user in production) with likes
 * and comments. A 429 is NOT retried automatically here: the caller gets it at
 * once (`reportFailureOf` → `'rate_limited'`) and can say so.
 */
export function createReportsApi(http: AxiosInstance) {
  return {
    /**
     * `POST /api/v1/reports/videos/:videoId` (auth). `reason` is required, at
     * most 1000 characters (use `composeReportReason`). Reporting the same video
     * again while the first report is open is a success with
     * `alreadyReported: true` (HTTP 200 instead of 201).
     */
    async reportVideo(videoId: string | number, reason: string): Promise<ContentReportResult> {
      const res = await http.post<ContentReportResponse>(
        `/api/v1/reports/videos/${videoId}`,
        { reason },
        NO_RATE_LIMIT_RETRY
      );
      const data = res.data?.data;
      return {
        reportId: typeof data?.id === 'number' || typeof data?.id === 'string' ? data.id : null,
        status: typeof data?.status === 'string' ? data.status : null,
        alreadyReported: data?.alreadyReported === true,
      };
    },

    /**
     * `POST /api/v1/comments/:commentId/report` (auth). `reason` is optional
     * server-side (max 1000 characters). The route answers 200 for a first
     * report and a repeat alike and returns no report id, so
     * `alreadyReported` is always `false` and `reportId` `null` here.
     */
    async reportComment(commentId: string | number, reason?: string): Promise<ContentReportResult> {
      await http.post<CommentReportResponse>(
        `/api/v1/comments/${commentId}/report`,
        reason ? { reason } : {},
        NO_RATE_LIMIT_RETRY
      );
      return { reportId: null, status: null, alreadyReported: false };
    },
  };
}

export type ReportsApi = ReturnType<typeof createReportsApi>;
