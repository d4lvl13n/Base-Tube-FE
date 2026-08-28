/**
 * Which file the player actually plays.
 *
 * The backend now publishes a browser-compatible original immediately, so most
 * videos arrive with `video_urls` empty and only `video_url` set — that file is
 * playable as-is and there is nothing to wait for. Sources the browser cannot
 * decode are transcoded instead, and their playable copies land in `video_urls`
 * as signed URLs keyed by quality.
 *
 * So: a rendition, when one exists, always beats the original — the original is
 * the very file the transcoder was invoked because the browser could not play.
 */

/** Renditions we will play, best first. Anything above 1080p is skipped. */
const RENDITION_PREFERENCE = ['1080p', '720p', '480p', '360p', '240p'] as const;

export interface PlaybackSourceInput {
  /** The published original (browser-compatible when it is the only source). */
  video_url?: string | null;
  /** Transcoded copies, keyed by quality. Empty or absent when none exist. */
  video_urls?: Record<string, string | null | undefined> | null;
  /** Last-resort URL the caller already had in hand. */
  src?: string | null;
}

function usable(url: unknown): url is string {
  return typeof url === 'string' && url.trim().length > 0;
}

/**
 * Pick the single source to hand to the player.
 *
 * Highest rendition at or below 1080p if `video_urls` has one, else the
 * original `video_url`, else `src`. Returns `''` when there is nothing to play,
 * which the player treats the same way it treated a missing `src` before.
 */
export function selectPlaybackSource({
  video_url,
  video_urls,
  src,
}: PlaybackSourceInput): string {
  if (video_urls) {
    for (const quality of RENDITION_PREFERENCE) {
      const url = video_urls[quality];
      if (usable(url)) return url;
    }
  }
  if (usable(video_url)) return video_url;
  if (usable(src)) return src;
  return '';
}

export default selectPlaybackSource;
