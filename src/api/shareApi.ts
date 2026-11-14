import api from './index';
import { SHARE_PLATFORMS, type SharePlatform, type ShareResponse } from '../types/share';

/** Where a share actually went: one of the platforms the backend stores. */
export type ShareActionPlatform = SharePlatform;

/**
 * What happened to one share action:
 * - 'recorded'     201, a share was written;
 * - 'deduplicated' 200, the same viewer already shared this video on this
 *                  platform in the last 30 minutes (not counted again);
 * - 'rate_limited' 429 SHARE_RATE_LIMIT_EXCEEDED (20 per 10 minutes per viewer);
 * - 'failed'       anything else (network, 400 for a bad video id, 5xx).
 */
export type ShareOutcome = 'recorded' | 'deduplicated' | 'rate_limited' | 'failed';

const isSharePlatform = (value: unknown): value is SharePlatform =>
  (SHARE_PLATFORMS as readonly string[]).includes(value as string);

/**
 * Records ONE completed share action — call it after the copy succeeded, the
 * social window was opened, or the native share sheet resolved; never on a
 * mere click of "Share".
 *
 * Fire-and-forget: never awaited by the UI, never throws, never shows an
 * error. Never retried: a replayed POST is either deduplicated or spends the
 * viewer's rate-limit budget, and tracking must not affect the share itself.
 */
export const recordShareAction = async (
  videoId: string | number | null | undefined,
  platform: ShareActionPlatform
): Promise<ShareOutcome | null> => {
  const id = String(videoId ?? '').trim();
  if (!id) return null;
  try {
    const response = await api.post<ShareResponse>(`/api/v1/videos/${encodeURIComponent(id)}/share`, {
      platform: isSharePlatform(platform) ? platform : 'other',
    });
    return response.data?.data?.deduplicated ? 'deduplicated' : 'recorded';
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    return status === 429 ? 'rate_limited' : 'failed';
  }
};
