import type { AxiosInstance } from 'axios';
import type { SuccessEnvelope } from '../types/common';
import type {
  Comment,
  CommentsResponse,
  LikeStatusResponse,
  LikeToggleResponse,
  RecordViewResponse,
  SharePlatform,
  ViewConfigResponse,
  ViewTrackingConfig,
} from '../types/engagement';

/**
 * The documented view rules, mirrored from the backend's `view_threshold_*`
 * configuration. A client that cannot reach `/config/view-config` must fall
 * back to these and keep tracking — never to "track nothing", which is what a
 * hardcoded copy plus a swallowed error quietly produces.
 */
export const DEFAULT_VIEW_TRACKING_CONFIG: ViewTrackingConfig = {
  thresholds: { percentage: 30, seconds: 30 },
  updateInterval: 30_000,
};

const isViewTrackingConfig = (value: unknown): value is ViewTrackingConfig => {
  const candidate = value as ViewTrackingConfig | undefined;
  return (
    !!candidate &&
    typeof candidate.updateInterval === 'number' &&
    !!candidate.thresholds &&
    typeof candidate.thresholds.percentage === 'number' &&
    typeof candidate.thresholds.seconds === 'number'
  );
};

/** Outcome of a view-creation attempt; see `recordViewResult`. */
export interface RecordViewOutcome {
  viewId: string | null;
  /** False when the backend gave a verdict, true when the attempt just failed. */
  retryable: boolean;
}

/**
 * Video engagement: comments, likes, shares, and view tracking. Endpoints per
 * the Mobile Readiness Brief §C.6 / §C.5. Each preserves the backend's real
 * envelope rather than assuming a universal contract.
 */
export function createEngagementApi(http: AxiosInstance) {
  /**
   * One view-creation attempt.
   *
   * View tracking is best-effort and must never block playback, so this does
   * not throw — but it does tell the caller WHETHER RETRYING IS WORTH IT,
   * because "the backend refused this view" and "the network was down for a
   * second" deserve very different responses. Collapsing both to `null` is how
   * a single transient failure used to kill tracking for a whole session.
   */
  const recordViewResult = async (
    videoId: string | number,
    watchedDuration: number
  ): Promise<RecordViewOutcome> => {
    try {
      const res = await http.post<RecordViewResponse>(`/api/v1/videos/${videoId}/views`, {
        watchedDuration,
      });
      return { viewId: res.data?.data?.viewId ?? null, retryable: false };
    } catch (error) {
      // A 4xx is a verdict — the view was rejected on its merits (threshold,
      // daily cap, fraud guard) and asking again changes nothing. Anything else
      // (offline, 5xx, timeout) is worth another go.
      const status = (error as { response?: { status?: number } })?.response?.status;
      const isVerdict = typeof status === 'number' && status >= 400 && status < 500;
      return { viewId: null, retryable: !isVerdict };
    }
  };

  return {
    /** `GET /api/v1/comments/video/:videoId` (public) */
    async listComments(videoId: string | number, page = 1, limit = 20): Promise<CommentsResponse> {
      const res = await http.get<CommentsResponse>(`/api/v1/comments/video/${videoId}`, {
        params: { page, limit },
      });
      return res.data;
    },

    /** `POST /api/v1/comments` (auth) */
    async addComment(videoId: string | number, content: string, parentId?: number): Promise<Comment> {
      const res = await http.post<SuccessEnvelope<Comment>>('/api/v1/comments', {
        video_id: videoId,
        content,
        ...(parentId ? { parent_id: parentId } : {}),
      });
      return res.data.data;
    },

    /** `PUT /api/v1/comments/:commentId` (auth, owner) */
    async updateComment(commentId: string | number, content: string): Promise<Comment> {
      const res = await http.put<SuccessEnvelope<Comment>>(`/api/v1/comments/${commentId}`, { content });
      return res.data.data;
    },

    /** `DELETE /api/v1/comments/:commentId` (auth, owner) */
    async deleteComment(commentId: string | number): Promise<void> {
      await http.delete(`/api/v1/comments/${commentId}`);
    },

    /** `POST /api/v1/likes/videos/:videoId/toggle` (auth) */
    async toggleLike(videoId: string | number): Promise<LikeToggleResponse> {
      const res = await http.post<LikeToggleResponse>(`/api/v1/likes/videos/${videoId}/toggle`, {});
      return res.data;
    },

    /** `GET /api/v1/likes/videos/:videoId/status` (auth) */
    async likeStatus(videoId: string | number): Promise<boolean> {
      const res = await http.get<LikeStatusResponse>(`/api/v1/likes/videos/${videoId}/status`);
      return Boolean(res.data?.data?.isLiked);
    },

    /** `POST /api/v1/videos/:videoId/share` (public) */
    async share(videoId: string | number, platform: SharePlatform = 'other'): Promise<void> {
      await http.post(`/api/v1/videos/${videoId}/share`, { platform });
    },

    /**
     * `GET /api/v1/config/view-config` — the thresholds the backend enforces.
     *
     * Never throws and never returns a partial shape: an unreachable or
     * malformed config yields `DEFAULT_VIEW_TRACKING_CONFIG`, so the caller
     * always has usable rules. Each client hardcoding its own copy instead
     * means one server-side change silently desynchronises every app.
     */
    async viewConfig(): Promise<ViewTrackingConfig> {
      try {
        const res = await http.get<ViewConfigResponse>('/api/v1/config/view-config');
        const data = res.data?.data;
        return isViewTrackingConfig(data) ? data : DEFAULT_VIEW_TRACKING_CONFIG;
      } catch {
        return DEFAULT_VIEW_TRACKING_CONFIG;
      }
    },

    /**
     * `POST /api/v1/videos/:videoId/views` — open a view row.
     *
     * `watchedDuration` is TIME ACTUALLY PLAYED, in seconds, and it is
     * REQUIRED: the endpoint's validator rejects a request without it. This
     * used to post `{}`, so every mobile view was a swallowed 400 and mobile
     * contributed exactly zero views.
     *
     * The caller should only reach here once the same threshold the web uses is
     * crossed — `min(30 % of the video, 30 s)` of real playback — because the
     * backend rejects anything below it.
     *
     * Returns the new `viewId`, or `null` when the attempt produced none. Use
     * `recordViewResult` when you intend to retry — it says whether retrying
     * can possibly help.
     */
    async recordView(videoId: string | number, watchedDuration: number): Promise<string | null> {
      return (await recordViewResult(videoId, watchedDuration)).viewId;
    },

    /** As `recordView`, but reports whether a failed attempt is worth repeating. */
    recordViewResult,

    /**
     * `PATCH /api/v1/videos/:videoId/views/:viewId` — heartbeat for an open
     * view row. Send the running played time; the server derives completion
     * from it and clamps it to wall-clock elapsed time. Best-effort.
     */
    async updateView(
      videoId: string | number,
      viewId: string,
      watchedDuration: number
    ): Promise<void> {
      try {
        await http.patch(`/api/v1/videos/${videoId}/views/${viewId}`, { watchedDuration });
      } catch {
        // Best-effort — never block playback on it.
      }
    },

    /**
     * @deprecated Kept so nothing breaks mid-release; it posts a body the
     * backend accepts now. Prefer `recordView` / `updateView`.
     */
    async trackView(videoId: string | number, watchedDuration = 30): Promise<void> {
      try {
        await http.post(`/api/v1/videos/${videoId}/views`, { watchedDuration });
      } catch {
        // View tracking is best-effort — never block playback on it.
      }
    },
  };
}

export type EngagementApi = ReturnType<typeof createEngagementApi>;
