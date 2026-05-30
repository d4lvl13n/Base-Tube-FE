import type { AxiosInstance } from 'axios';
import type { SuccessEnvelope } from '../types/common';
import type { UserProfile, UserWallet } from '../types/user';
import type { Video } from '../types/video';

export function createProfileApi(http: AxiosInstance) {
  return {
    /** `GET /api/v1/profile` (auth) — unwraps `{ success, data }`. */
    async me(): Promise<UserProfile> {
      const res = await http.get<SuccessEnvelope<UserProfile>>('/api/v1/profile');
      return res.data.data;
    },

    /** `GET /api/v1/profile/videos` (auth) — returns a raw array. */
    async myVideos(): Promise<Video[]> {
      const res = await http.get<Video[]>('/api/v1/profile/videos');
      return res.data;
    },

    /** `GET /api/v1/profile/wallet` (auth) — unwraps `{ success, data }`. */
    async myWallet(): Promise<UserWallet> {
      const res = await http.get<SuccessEnvelope<UserWallet>>('/api/v1/profile/wallet');
      return res.data.data;
    },
  };
}

export type ProfileApi = ReturnType<typeof createProfileApi>;
