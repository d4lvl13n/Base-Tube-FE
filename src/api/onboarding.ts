import { User } from '../types/user';
import api from './index';

export const onboardingApi = {
  /**
   * Updates the user's username during onboarding
   * @param username - The new username to set
   */
  updateUsername: async (username: string): Promise<{ message: string }> => {
    const { data } = await api.put(
      '/api/v1/web3auth/username',
      { username },
      { withCredentials: true }
    );
    return data;
  },

  /**
   * Marks the user's onboarding as complete
   * Updates onboarding_status from PENDING to COMPLETED
   */
  completeOnboarding: async (): Promise<{ user: User }> => {
    const { data } = await api.post(
      '/api/v1/web3auth/onboarding/complete',
      {},
      { withCredentials: true }
    );
    return data;
  },

  /**
   * Gets the current onboarding status for a user
   * Returns the full user object with onboarding_status
   */
  getOnboardingStatus: async (): Promise<{ user: User }> => {
    const { data } = await api.get(
      '/api/v1/web3auth/onboarding/status',
      { withCredentials: true }
    );
    return data;
  }
};