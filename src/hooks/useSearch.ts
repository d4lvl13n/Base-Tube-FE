import { useQuery } from '@tanstack/react-query';
import { searchApi } from '../api/search';
import { SearchResponse } from '../components/pages/SearchPage/types';

/**
 * useSearch - custom hook to search for videos.
 *
 * @param query - The search query string.
 * @param page - Page number (defaults to 1).
 * @param limit - Number of items per page (defaults to 24).
 * @param sort - Sorting method: 'relevance', 'date', or 'views' (defaults to 'relevance').
 *
 * @returns A query result containing the status, error, and data.
 */
export const useSearch = (
  query: string,
  page: number = 1,
  limit: number = 24,
  sort: 'relevance' | 'date' | 'views' = 'relevance'
) => {
  return useQuery<SearchResponse>({
    queryKey: ['search', query, page, limit, sort],
    queryFn: () => searchApi.searchVideos(query, page, limit, sort),
    enabled: Boolean(query),
    gcTime: 5 * 60 * 1000,
  });
};
