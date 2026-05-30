import type { AxiosInstance } from 'axios';
import type {
  DiscoveryResponse,
  GetDiscoveryOptions,
  SearchResponse,
  SearchSort,
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

export function createSearchApi(http: AxiosInstance) {
  return {
    /** `GET /api/v1/search` */
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
  };
}

export type DiscoveryApi = ReturnType<typeof createDiscoveryApi>;
export type SearchApi = ReturnType<typeof createSearchApi>;
