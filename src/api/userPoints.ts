import api from './index';
import { UserPointsData, UserPointsHistoryData } from '../types/userPoints';

/**
 * Fetches the current persistent points for the given user.
 * The response now also includes dynamic rank information.
 *
 * GET /user/{userId}/points
 */
export const fetchUserPoints = async (
  userId: string
): Promise<UserPointsData> => {
  try {
    const response = await api.get<{ 
      success: boolean; 
      data?: UserPointsData;
      error?: { code: string; message: string };
      message?: string;
    }>(`/api/v1/user/${userId}/points`);
    if (response.data.success) {
      return response.data.data!;
    }
    // Handle new error format
    const errorMessage = response.data.error?.message || response.data.message || 'Failed to fetch user points';
    throw new Error(errorMessage);
  } catch (error) {
    console.error('Error in fetchUserPoints:', error);
    throw error;
  }
};

/**
 * Fetches the user points history for the given user and period.
 *
 * GET /user/{userId}/points/history?period=24h|7d|30d
 *
 * @param userId The user's id.
 * @param period The period over which to retrieve history (default is '24h').
 */
export const fetchUserPointsHistory = async (
  userId: string,
  period: '24h' | '7d' | '30d' = '24h'
): Promise<UserPointsHistoryData[]> => {
  try {
    const response = await api.get<{ 
      success: boolean; 
      data?: UserPointsHistoryData[];
      error?: { code: string; message: string };
      message?: string;
    }>(`/api/v1/user/${userId}/points/history`, {
      params: { period }
    });
    if (response.data.success) {
      return response.data.data!;
    }
    // Handle new error format
    const errorMessage = response.data.error?.message || response.data.message || 'Failed to fetch user points history';
    throw new Error(errorMessage);
  } catch (error) {
    console.error('Error in fetchUserPointsHistory:', error);
    throw error;
  }
};