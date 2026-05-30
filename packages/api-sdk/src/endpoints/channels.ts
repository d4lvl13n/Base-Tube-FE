import type { AxiosInstance } from 'axios';
import type {
  Channel,
  ChannelResponse,
  GetChannelsOptions,
  GetChannelsResponse,
  PopularChannelsResponse,
} from '../types/channel';
import type { PaginatedEnvelope } from '../types/common';
import type { Video } from '../types/video';

export function createChannelsApi(http: AxiosInstance) {
  return {
    /** `GET /api/v1/channels` — note: list lives under `channels`, not `data`. */
    async list(options: GetChannelsOptions = {}): Promise<GetChannelsResponse> {
      const res = await http.get<GetChannelsResponse>('/api/v1/channels', { params: options });
      return res.data;
    },

    /** `GET /api/v1/channels/popular` — list lives under `data`. */
    async popular(page = 1, limit = 12): Promise<PopularChannelsResponse> {
      const res = await http.get<PopularChannelsResponse>('/api/v1/channels/popular', {
        params: { page, limit },
      });
      return res.data;
    },

    /** `GET /api/v1/channels/handle/:handle` */
    async getByHandle(handle: string): Promise<Channel> {
      const res = await http.get<ChannelResponse>(`/api/v1/channels/handle/${handle}`);
      return res.data.channel;
    },

    /** `GET /api/v1/channels/:channelId/videos` */
    async getVideos(channelId: string | number, page = 1, limit = 12): Promise<PaginatedEnvelope<Video>> {
      const res = await http.get<PaginatedEnvelope<Video>>(
        `/api/v1/channels/${channelId}/videos`,
        { params: { page, limit } }
      );
      return res.data;
    },

    /** `GET /api/v1/channels/subscribed` (auth) — the signed-in user's subscriptions. */
    async subscribed(page = 1, limit = 24): Promise<GetChannelsResponse> {
      const res = await http.get<GetChannelsResponse>('/api/v1/channels/subscribed', {
        params: { page, limit },
      });
      return res.data;
    },

    /** `POST /api/v1/channels/:identifier/subscribe` (auth) */
    async subscribe(identifier: string | number): Promise<void> {
      await http.post(`/api/v1/channels/${identifier}/subscribe`, {});
    },

    /** `POST /api/v1/channels/:identifier/unsubscribe` (auth) */
    async unsubscribe(identifier: string | number): Promise<void> {
      await http.post(`/api/v1/channels/${identifier}/unsubscribe`, {});
    },
  };
}

export type ChannelsApi = ReturnType<typeof createChannelsApi>;
