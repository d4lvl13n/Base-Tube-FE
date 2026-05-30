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

    /**
     * `PUT /api/v1/profile/update` (auth, multipart) — edit profile fields
     * (name, description/bio, optional avatar). Accepts a fields map; builds
     * the multipart body. Returns the updated profile.
     */
    async updateProfile(fields: Record<string, unknown>): Promise<UserProfile> {
      const form = new FormData();
      Object.entries(fields).forEach(([k, v]) => {
        if (v !== undefined && v !== null) form.append(k, v as any);
      });
      const res = await http.put<SuccessEnvelope<UserProfile>>('/api/v1/profile/update', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.data;
    },
  };
}

export type ProfileApi = ReturnType<typeof createProfileApi>;
