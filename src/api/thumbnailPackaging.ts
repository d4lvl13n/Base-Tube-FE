import api from './index';

export interface SavedThumbnailStyle { id: number; name: string; imageUrl: string; }
const path = '/api/v1/ctr/styles';
export const thumbnailPackagingApi = {
  list: async (): Promise<SavedThumbnailStyle[]> => (await api.get(path)).data.data,
  save: async (imageUrl: string, name: string): Promise<SavedThumbnailStyle> => (await api.post(path, { imageUrl, name })).data.data,
  remove: async (id: number): Promise<void> => { await api.delete(`${path}/${id}`); },
};
