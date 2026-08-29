import type { AxiosInstance } from 'axios';
import type { SuccessEnvelope } from '../types/common';
import type {
  Comment,
  CommentsResponse,
  LikeStatusResponse,
  LikeToggleResponse,
  RecordViewResponse,
  SharePlatform,
} from '../types/engagement';

/**
 * Video engagement: comments, likes, shares, and view tracking. Endpoints per
 * the Mobile Readiness Brief §C.6 / §C.5. Each preserves the backend's real
 * envelope rather than assuming a universal contract.
 */
export function createEngagementApi(http: AxiosInstance) {
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
     * Returns the new `viewId` (needed by `updateView`), or `null` when the
     * backend declined: view tracking is best-effort and must never block
     * playback.
     */
    async recordView(videoId: string | number, watchedDuration: number): Promise<string | null> {
      try {
        const res = await http.post<RecordViewResponse>(`/api/v1/videos/${videoId}/views`, {
          watchedDuration,
        });
        return res.data?.data?.viewId ?? null;
      } catch {
        return null;
      }
    },

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
