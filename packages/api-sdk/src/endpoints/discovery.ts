import type { AxiosInstance } from 'axios';
import type {
  DiscoveryResponse,
  GetDiscoveryOptions,
  SearchResponse,
  SearchSort,
  SearchSuggestResponse,
  SearchVideosOptions,
} from '../types/discovery';

export function createDiscoveryApi(http: AxiosInstance) {
  return {
    /** `GET /api/v1/discovery` */
    async getFeed(options: GetDiscoveryOptions = {}): Promise<DiscoveryResponse> {
      const { page = 1, limit = 24, timeFrame = 'all', sort = 'trending' } = options;
      const res = await http.get<DiscoveryResponse>('/api/v1/discovery', {
        params: { page, limit, timeFrame, sort },
      });
      return res.data;
    },
  };
}

/**
 * Builds the query string for `GET /api/v1/search`.
 *
 * `category` repeats once per value, which is what the server reads; axios's
 * default array serialiser would send `category[]` and the filter would be
 * silently ignored. Empty values are dropped so an empty query browses newest
 * rather than searching for `""`.
 */
export function buildSearchQuery(options: SearchVideosOptions): URLSearchParams {
  const params = new URLSearchParams();
  params.set('query', options.query ?? '');
  if (options.page && options.page > 1) params.set('page', String(options.page));
  if (options.limit) params.set('limit', String(options.limit));
  if (options.channelId != null) params.set('channelId', String(options.channelId));
  for (const category of options.categories ?? []) {
    if (category) params.append('category', category);
  }
  if (options.minDuration != null) params.set('minDuration', String(options.minDuration));
  if (options.maxDuration != null) params.set('maxDuration', String(options.maxDuration));
  if (options.sort) params.set('sort', options.sort);
  return params;
}

export function createSearchApi(http: AxiosInstance) {
  return {
    /** `GET /api/v1/search` — positional form kept for existing callers. */
    async videos(
      query: string,
      page = 1,
      limit = 24,
      sort: SearchSort = 'relevance'
    ): Promise<SearchResponse> {
      const res = await http.get<SearchResponse>('/api/v1/search', {
        params: { query, page, limit, sort },
      });
      return res.data;
    },

    /**
     * `GET /api/v1/search` with the full filter surface: facets, highlights and
     * the engine that answered come back on the same response.
     */
    async query(
      options: SearchVideosOptions = {},
      config: { signal?: AbortSignal } = {}
    ): Promise<SearchResponse> {
      const res = await http.get<SearchResponse>(
        `/api/v1/search?${buildSearchQuery(options).toString()}`,
        { signal: config.signal }
      );
      return res.data;
    },

    /** `GET /api/v1/search/suggest` — titles and channels for a partial query. */
    async suggest(
      q: string,
      config: { signal?: AbortSignal } = {}
    ): Promise<SearchSuggestResponse> {
      const res = await http.get<SearchSuggestResponse>('/api/v1/search/suggest', {
        params: { q },
        signal: config.signal,
      });
      return res.data;
    },
  };
}

export type DiscoveryApi = ReturnType<typeof createDiscoveryApi>;
export type SearchApi = ReturnType<typeof createSearchApi>;
