import type { AxiosInstance } from 'axios';
import type {
  FeaturedVideo,
  FeaturedVideoResponse,
  RecommendedVideosResponse,
  TrendingParams,
  TrendingVideoResponse,
  Video,
  VideoResponse,
} from '../types/video';
import type { PaginatedEnvelope } from '../types/common';

export function createVideosApi(http: AxiosInstance) {
  return {
    /**
     * `GET /api/v1/videos/trending` — normalises the response: the backend may
     * return `data` as a flat array OR as `{ videos: [...] }`. Always resolves
     * to `{ success, data: { videos, ... } }`.
     */
    async getTrending(params: TrendingParams = {}): Promise<TrendingVideoResponse> {
      const { page = 1, limit = 10, timeFrame = 'week', sort = 'trending' } = params;
      const res = await http.get<any>('/api/v1/videos/trending', {
        params: { page, limit, timeFrame, sort },
      });
      const body = res.data ?? {};
      const d = body.data;
      const videos = Array.isArray(d) ? d : d?.videos ?? [];
      const inner = Array.isArray(d) ? {} : d ?? {};
      return {
        success: body.success ?? true,
        data: {
          videos,
          total: inner.total ?? body.total ?? videos.length,
          hasMore: inner.hasMore ?? body.hasMore ?? false,
          timeFrame: inner.timeFrame ?? timeFrame,
          sort: inner.sort ?? sort,
        },
      };
    },

    /** `GET /api/v1/videos/featured` — returns the videos array directly. */
    async getFeatured(limit = 2): Promise<FeaturedVideo[]> {
      const res = await http.get<FeaturedVideoResponse>('/api/v1/videos/featured', {
        params: { limit },
      });
      return res.data.data.videos;
    },

    /** `GET /api/v1/videos/recommended` */
    async getRecommended(page = 1, limit = 10): Promise<RecommendedVideosResponse> {
      const res = await http.get<RecommendedVideosResponse>('/api/v1/videos/recommended', {
        params: { page, limit },
      });
      return res.data;
    },

    /** `GET /api/v1/videos/:id` — unwraps `{ success, data }`. */
    async getById(id: string | number): Promise<Video> {
      const res = await http.get<VideoResponse>(`/api/v1/videos/${id}`);
      return res.data.data;
    },

    /** `GET /api/v1/videos/channel/:channelId/videos` */
    async listByChannel(channelId: string | number, page = 1, limit = 12): Promise<PaginatedEnvelope<Video>> {
      const res = await http.get<PaginatedEnvelope<Video>>(
        `/api/v1/videos/channel/${channelId}/videos`,
        { params: { page, limit } }
      );
      return res.data;
    },
  };
}

export type VideosApi = ReturnType<typeof createVideosApi>;
