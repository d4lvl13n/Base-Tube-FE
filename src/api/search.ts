import api from './index';

export const searchApi = {
  /**
   * Searches videos based on the given query and options.
   * @param query - The search query string.
   * @param page - The page number (defaults to 1).
   * @param limit - The number of items per page (defaults to 24).
   * @param sort - Sort order: 'relevance', 'date', or 'views' (defaults to 'relevance').
   * @returns A promise that resolves with the search results.
   */
  searchVideos: async (
    query: string,
    page: number = 1,
    limit: number = 24,
    sort: 'relevance' | 'date' | 'views' = 'relevance'
  ): Promise<{ success: boolean; data: any }> => {
    const { data } = await api.get(
      `/api/v1/search?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}&sort=${sort}`,
      { withCredentials: true }
    );
    return data;
  }
};