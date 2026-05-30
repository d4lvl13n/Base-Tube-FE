import type { AxiosInstance } from 'axios';
import type { SuccessEnvelope } from '../types/common';
import type {
  Comment,
  CommentsResponse,
  LikeStatusResponse,
  LikeToggleResponse,
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

    /** `POST /api/v1/videos/:videoId/views` (records a view; returns viewId envelope). */
    async trackView(videoId: string | number): Promise<void> {
      try {
        await http.post(`/api/v1/videos/${videoId}/views`, {});
      } catch {
        // View tracking is best-effort — never block playback on it.
      }
    },
  };
}

export type EngagementApi = ReturnType<typeof createEngagementApi>;
