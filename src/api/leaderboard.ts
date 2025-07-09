import api from './index';

export interface LeaderboardEntry {
  username: string;
  profile_image_url?: string | null;
  videoCount: number;
  commentCount: number;
  viewCount: number;
  likeCount: number;
  totalWatchTime: number;
  activityScore: number;
}

export interface LeaderboardResponse {
  success: boolean;
  data?: LeaderboardEntry[];
  error?: { code: string; message: string };
  message?: string;
}

/**
 * Fetches the user leaderboard from the public API endpoint.
 * Returns an array of leaderboard entries on success.
 */
export const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  try {
    const response = await api.get<LeaderboardResponse>('/api/v1/leaderboard');
    
    if (response.data.success) {
      return response.data.data!;
    } else {
      // Handle new error format
      const errorMessage = response.data.error?.message || 
                          response.data.message || 
                          'Failed to fetch leaderboard: API returned unsuccessful response';
      throw new Error(errorMessage);
    }
  } catch (error: any) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }
};