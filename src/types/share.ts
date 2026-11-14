/**
 * Share recording: POST /api/v1/videos/:videoId/share (base-be
 * controllers/ShareController.ts, services/shareService.ts).
 */

/** Every platform the backend stores (SHARE_PLATFORMS). The web sends only these. */
export const SHARE_PLATFORMS = [
  'copy_link',
  'x',
  'facebook',
  'whatsapp',
  'telegram',
  'linkedin',
  'reddit',
  'email',
  'native',
  'embed',
  'other',
] as const;

export type SharePlatform = (typeof SHARE_PLATFORMS)[number];

/** 201 = written; 200 with `deduplicated: true` = same viewer, video and platform in the last 30 minutes. */
export interface ShareResponse {
  success: true;
  message: string;
  data: {
    id: number | null;
    videoId: number;
    platform: SharePlatform;
    createdAt: string | null;
    deduplicated: boolean;
  };
}
