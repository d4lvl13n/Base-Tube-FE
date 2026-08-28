import {
  buildSearchQuery,
  type SearchResponse,
  type SearchSort,
  type SearchSuggestResponse,
  type SearchVideosOptions,
} from '@basetube/api';
import api from './index';

/**
 * Query-string builder for `GET /api/v1/search`, shared with the mobile SDK.
 *
 * It is re-exported here so the web has one import site for the search layer,
 * and because the `category` repetition it handles is the sort of detail that
 * gets reinvented wrongly: axios's default array serialiser sends `category[]`,
 * which the server ignores without complaining.
 */
export { buildSearchQuery };

export const searchApi = {
  /**
   * Searches videos with the full filter surface.
   *
   * An empty `query` is a legitimate request: the server answers with the
   * newest videos, which is what the results page shows when someone is only
   * using the filters.
   */
  search: async (
    options: SearchVideosOptions = {},
    config: { signal?: AbortSignal } = {}
  ): Promise<SearchResponse> => {
    const { data } = await api.get(`/api/v1/search?${buildSearchQuery(options).toString()}`, {
      withCredentials: true,
      signal: config.signal,
    });
    return data;
  },

  /** Titles and channels for a partial query, for the header dropdown. */
  suggest: async (
    q: string,
    config: { signal?: AbortSignal } = {}
  ): Promise<SearchSuggestResponse> => {
    const { data } = await api.get('/api/v1/search/suggest', {
      params: { q },
      withCredentials: true,
      signal: config.signal,
    });
    return data;
  },

  /**
   * Positional form kept for callers that predate the filters.
   * @deprecated Use `searchApi.search`.
   */
  searchVideos: async (
    query: string,
    page: number = 1,
    limit: number = 24,
    sort: SearchSort = 'relevance'
  ): Promise<SearchResponse> => searchApi.search({ query, page, limit, sort }),
};
