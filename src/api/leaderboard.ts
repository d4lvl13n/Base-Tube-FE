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
  data: LeaderboardEntry[];
}

/**
 * Fetches the user leaderboard from the public API endpoint.
 * Returns an array of leaderboard entries on success.
 */
export const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  try {
    const response = await api.get<LeaderboardResponse>('/api/v1/leaderboard');
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error('Failed to fetch leaderboard: API returned unsuccessful response');
    }
  } catch (error: any) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }
};