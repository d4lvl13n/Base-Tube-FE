import type { AxiosInstance } from 'axios';
import type { SuccessEnvelope } from '../types/common';
import type {
  CheckoutSessionResponse,
  DiscoverPassesParams,
  DiscoverPassesResponse,
  Pass,
  PassDetailsResponse,
  PlayTokenData,
  PurchaseStatus,
  SignedUrlResponse,
} from '../types/pass';

/**
 * Content passes: discovery, detail, owned, Stripe checkout, and gated playback
 * (signed URL for hosted tiers, play token for external). Brief §C.7.
 */
export function createPassesApi(http: AxiosInstance) {
  return {
    /** `GET /api/v1/passes/discover` (public) */
    async discover(params: DiscoverPassesParams = {}): Promise<DiscoverPassesResponse> {
      const { limit = 24, offset = 0, ...rest } = params;
      const res = await http.get<DiscoverPassesResponse>('/api/v1/passes/discover', {
        params: { limit, offset, ...rest },
      });
      return res.data;
    },

    /** `GET /api/v1/passes/:identifier` (optional auth) — accepts id or slug. */
    async getById(identifier: string): Promise<Pass> {
      const res = await http.get<PassDetailsResponse | Pass>(`/api/v1/passes/${identifier}`);
      const body = res.data as any;
      return (body?.data ?? body) as Pass;
    },

    /** `GET /api/v1/passes/me` (auth) — passes the user owns. */
    async owned(): Promise<Pass[]> {
      const res = await http.get<Pass[] | SuccessEnvelope<Pass[]>>('/api/v1/passes/me');
      const body = res.data as any;
      return (Array.isArray(body) ? body : body?.data ?? []) as Pass[];
    },

    /** `POST /api/v1/passes/:id/checkout` (auth) — creates a Stripe checkout session. */
    async checkout(passId: string): Promise<CheckoutSessionResponse> {
      const res = await http.post<CheckoutSessionResponse>(`/api/v1/passes/${passId}/checkout`, {});
      return res.data;
    },

    /** `GET /api/v1/passes/purchase/status/:sessionId` (public) */
    async checkoutStatus(sessionId: string): Promise<PurchaseStatus> {
      const res = await http.get<PurchaseStatus | SuccessEnvelope<PurchaseStatus>>(
        `/api/v1/passes/purchase/status/${sessionId}`
      );
      const body = res.data as any;
      return (body?.data ?? body) as PurchaseStatus;
    },

    /** `GET /api/v1/passes/videos/:videoId/signed-url` (auth) — hosted tiers. */
    async signedUrl(videoId: string): Promise<string> {
      const res = await http.get<SuccessEnvelope<SignedUrlResponse>>(
        `/api/v1/passes/videos/${videoId}/signed-url`
      );
      return res.data.data.signed_url;
    },

    /** `POST /api/v1/passes/videos/:videoId/play-token` (auth) — external tier. */
    async playToken(videoId: string): Promise<PlayTokenData> {
      const res = await http.post<SuccessEnvelope<PlayTokenData>>(
        `/api/v1/passes/videos/${videoId}/play-token`,
        {}
      );
      return res.data.data;
    },

    /**
     * Resolve a playable URL for a gated video by storage tier (mirrors web
     * getVideoPlaybackUrl): external → play-token; hosted tiers → signed-url,
     * falling back to play-token if the backend returns USE_PLAY_TOKEN.
     */
    async getVideoPlaybackUrl(videoId: string, storageTier: string = 'external'): Promise<PlayTokenData> {
      if (storageTier === 'external') {
        return this.playToken(videoId);
      }
      try {
        const signed = await this.signedUrl(videoId);
        return {
          video_id: videoId,
          playback_url: signed,
          embed_url: null,
          platform: 'hosted',
          token: '',
          expires_at: new Date(Date.now() + 3_600_000).toISOString(),
          expires_in_seconds: 3600,
        };
      } catch (err: any) {
        const code = err?.response?.data?.error?.code;
        if (code === 'USE_PLAY_TOKEN') return this.playToken(videoId);
        throw err;
      }
    },
  };
}

export type PassesApi = ReturnType<typeof createPassesApi>;
