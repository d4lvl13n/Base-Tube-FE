import axios from 'axios';
import api from './index';

/**
 * "Report this" — sends a video, an AI thumbnail or a comment to the
 * moderation queue (admin panel → Moderation).
 *
 *   POST /api/v1/reports/videos/:videoId          body { reason } (required)
 *   POST /api/v1/reports/thumbnails/:thumbnailId  body { reason } (required)
 *   POST /api/v1/comments/:commentId/report        body { reason } (optional) — see `api/comment.ts`
 *
 * All three need a signed-in account and share the interaction rate limit
 * (30 per minute). One open report per person and item: reporting again
 * returns the first report (`alreadyReported: true`) instead of failing.
 */

/** The backend stores at most this many characters (`content_reports.reason`). */
export const REPORT_REASON_MAX_LENGTH = 1000;

export interface ReportResult {
  /** True when this person already had an open report on the same item. */
  alreadyReported: boolean;
}

interface ContentReportResponse {
  success: boolean;
  message?: string;
  data?: { id?: number | string; status?: string; alreadyReported?: boolean };
}

const toResult = (body: ContentReportResponse | undefined): ReportResult => ({
  alreadyReported: body?.data?.alreadyReported === true,
});

export const reportVideo = async (videoId: string | number, reason: string): Promise<ReportResult> => {
  try {
    const response = await api.post<ContentReportResponse>(
      `/api/v1/reports/videos/${encodeURIComponent(String(videoId))}`,
      { reason },
    );
    return toResult(response.data);
  } catch (error) {
    console.error('Error reporting video:', error);
    throw error;
  }
};

/** `thumbnailId` is the numeric database id; the public share code is refused (400 INVALID_ID). */
export const reportThumbnail = async (thumbnailId: string | number, reason: string): Promise<ReportResult> => {
  try {
    const response = await api.post<ContentReportResponse>(
      `/api/v1/reports/thumbnails/${encodeURIComponent(String(thumbnailId))}`,
      { reason },
    );
    return toResult(response.data);
  } catch (error) {
    console.error('Error reporting thumbnail:', error);
    throw error;
  }
};

/** What went wrong with a report, as far as the person reporting needs to know. */
export type ReportFailure =
  /** 401: no valid session. */
  | 'sign_in_required'
  /** 403 ACCOUNT_SUSPENDED / ACCOUNT_BANNED — the app-wide notice explains it. */
  | 'account_blocked'
  /** 404: the item is gone or was taken down. */
  | 'not_found'
  /** 429: too many interactions in a short time. */
  | 'rate_limited'
  /** 400: the reason was refused (empty, too long, not text). */
  | 'invalid_reason'
  /** No answer at all: offline, timeout. */
  | 'network'
  | 'unknown';

const REASON_CODES = new Set<unknown>(['REASON_REQUIRED', 'REASON_TOO_LONG', 'INVALID_REASON']);

export function reportFailureOf(error: unknown): ReportFailure {
  if (!axios.isAxiosError(error)) return 'unknown';
  if (!error.response) return 'network';
  const { status, data } = error.response;
  const code = data?.error?.code ?? data?.code;
  if (status === 401) return 'sign_in_required';
  if (status === 403 && (code === 'ACCOUNT_SUSPENDED' || code === 'ACCOUNT_BANNED')) return 'account_blocked';
  if (status === 404) return 'not_found';
  if (status === 429) return 'rate_limited';
  if (status === 400 && REASON_CODES.has(code)) return 'invalid_reason';
  return 'unknown';
}
