import api from './index';
import { 
  ShareRequest, 
  ShareResponse, 
  ShareStatsResponse, 
  SharePlatform 
} from '../types/share';

/**
 * Records a video share event
 * @param videoId The ID of the video being shared
 * @param platform The platform where the video was shared
 * @returns Promise that resolves when the share is recorded
 */
export const recordVideoShare = async (
  videoId: string, 
  platform: SharePlatform = 'unknown'
): Promise<ShareResponse> => {
  try {
    const payload: ShareRequest = { platform };
    const response = await api.post<ShareResponse>(`/api/v1/videos/${videoId}/share`, payload);
    console.log(`Share recorded for video ${videoId} on ${platform}`);
    return response.data;
  } catch (error) {
    console.error('Failed to record share:', error);
    // Non-blocking - we don't want to interrupt the user's sharing experience
    // with errors from the analytics tracking
    throw error;
  }
};

/**
 * Gets share statistics for a video (for creator analytics)
 * @param videoId The ID of the video
 * @returns Promise that resolves to share statistics
 */
export const getVideoShareStats = async (videoId: string): Promise<{
  totalShares: number;
  byPlatform: Record<string, number>;
}> => {
  try {
    const response = await api.get<ShareStatsResponse>(`/api/v1/videos/${videoId}/share/stats`);
    return response.data.data;
  } catch (error) {
    console.error('Failed to get share statistics:', error);
    return {
      totalShares: 0,
      byPlatform: {}
    };
  }
}; 