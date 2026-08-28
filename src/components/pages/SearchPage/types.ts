/**
 * Search types live in `@basetube/api` so the web and the mobile app read the
 * same contract. This file stays as the import site the page components use.
 */
export type {
  SearchEngine,
  SearchFacets,
  SearchHighlight,
  SearchResponse,
  SearchResult,
  SearchSort,
  SearchSuggestions,
  SearchVideosOptions,
} from '@basetube/api';

export type { DurationBucketId, SearchFilters } from './searchParams';
