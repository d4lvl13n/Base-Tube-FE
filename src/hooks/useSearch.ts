import { useInfiniteQuery } from '@tanstack/react-query';
import type { SearchResponse, SearchVideosOptions } from '@basetube/api';
import { searchApi } from '../api/search';

export const SEARCH_PAGE_SIZE = 20;

/**
 * Paged video search.
 *
 * An empty query is a legitimate request — the server answers with the newest
 * videos — so unlike the old hook this one is never disabled. That is what
 * makes the filter rail usable on its own.
 *
 * Facets, engine and timing are read off the first page; the later pages carry
 * the same values and re-reading them would make the header flicker.
 */
export function useVideoSearch(options: SearchVideosOptions) {
  const { page: _ignoredPage, limit = SEARCH_PAGE_SIZE, ...filters } = options;

  return useInfiniteQuery<SearchResponse>({
    queryKey: ['search', { ...filters, limit }],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      searchApi.search({ ...filters, limit, page: pageParam as number }, { signal }),
    getNextPageParam: (lastPage, _pages, lastPageParam) => {
      if (!lastPage.hasMore) return undefined;
      // The server says which page it just answered. Counting locally instead
      // would drift the moment a request is retried or answered out of order,
      // and the next page would either repeat or skip a slice of results.
      const answered = typeof lastPage.page === 'number' ? lastPage.page : (lastPageParam as number);
      return answered + 1;
    },
    gcTime: 5 * 60 * 1000,
    staleTime: 30 * 1000,
  });
}
