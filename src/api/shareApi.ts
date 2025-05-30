import api from './index';
import { 
  ShareRequest, 
  ShareResponse, 
  ShareStatsResponse, 
  SharePlatform 
} from '../types/share';
import { handleApiError, retryWithBackoff } from '../utils/errorHandler';
import { ErrorCode } from '../types/error';

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
  const executeShare = async () => {
    const payload: ShareRequest = { platform };
    const response = await api.post<ShareResponse>(`/api/v1/videos/${videoId}/share`, payload);
    console.log(`Share recorded for video ${videoId} on ${platform}`);
    return response.data;
  };

  try {
    return await retryWithBackoff(executeShare, 2, 1000);
  } catch (error) {
    const userError = handleApiError(error, {
      action: 'record video share',
      component: 'shareAPI',
      additionalData: { videoId, platform }
    });

    // For analytics tracking, log error but don't interrupt user experience
    console.warn('Failed to record share event (non-critical):', userError.message);
    
    // Return a fallback response instead of throwing
    return {
      success: false,
      message: 'Share tracking failed',
      data: {
        id: 0,
        videoId: parseInt(videoId) || 0,
        platform: platform,
        createdAt: new Date().toISOString()
      }
    };
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
  const fetchStats = async () => {
    const response = await api.get<ShareStatsResponse>(`/api/v1/videos/${videoId}/share/stats`);
    return response.data.data;
  };

  try {
    return await retryWithBackoff(fetchStats, 2, 1000);
  } catch (error) {
    const userError = handleApiError(error, {
      action: 'fetch share statistics',
      component: 'shareAPI',
      additionalData: { videoId }
    });

    // For analytics errors, return empty data structure instead of throwing
    if (userError.code === ErrorCode.ANALYTICS_UNAVAILABLE || 
        userError.code === ErrorCode.DATA_PROCESSING_ERROR ||
        userError.code === ErrorCode.NOT_FOUND) {
      console.warn('Share statistics unavailable, returning empty data:', userError.message);
      return {
        totalShares: 0,
        byPlatform: {}
      };
    }

    throw userError;
  }
}; 