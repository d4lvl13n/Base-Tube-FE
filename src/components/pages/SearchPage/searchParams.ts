import type { SearchSort, SearchVideosOptions } from '@basetube/api';

/**
 * Duration buckets, in seconds.
 *
 * Three buckets, because the useful question is "a clip, an episode, or a
 * long one" — a slider would ask people to guess at a number they do not have.
 */
export const DURATION_BUCKETS = [
  { id: 'short', label: 'Under 4 minutes', maxDuration: 240 },
  { id: 'medium', label: '4 to 20 minutes', minDuration: 240, maxDuration: 1200 },
  { id: 'long', label: 'Over 20 minutes', minDuration: 1200 },
] as const;

export type DurationBucketId = (typeof DURATION_BUCKETS)[number]['id'];

export const SORT_OPTIONS: { id: SearchSort; label: string }[] = [
  { id: 'relevance', label: 'Relevance' },
  { id: 'newest', label: 'Newest' },
  { id: 'views', label: 'Most viewed' },
  { id: 'trending', label: 'Trending' },
];

const SORT_IDS = SORT_OPTIONS.map((option) => option.id);

export interface SearchFilters {
  query: string;
  sort: SearchSort;
  categories: string[];
  duration: DurationBucketId | null;
  channelId: number | null;
}

export const DEFAULT_FILTERS: SearchFilters = {
  query: '',
  sort: 'relevance',
  categories: [],
  duration: null,
  channelId: null,
};

const isDurationBucket = (value: string): value is DurationBucketId =>
  DURATION_BUCKETS.some((bucket) => bucket.id === value);

/**
 * Reads the filter state out of the URL.
 *
 * The URL is the only source of truth for filters, so a result page can be
 * pasted to someone else and land them on the same results. `sort=date` is the
 * spelling the old page wrote; it still means newest.
 */
export function readFilters(params: URLSearchParams): SearchFilters {
  const rawSort = params.get('sort');
  const sort: SearchSort =
    rawSort === 'date' ? 'newest' : SORT_IDS.includes(rawSort as SearchSort) ? (rawSort as SearchSort) : 'relevance';

  const rawDuration = params.get('duration') ?? '';
  const rawChannel = Number(params.get('channelId'));

  return {
    query: params.get('query') ?? '',
    sort,
    categories: params.getAll('category').filter(Boolean),
    duration: isDurationBucket(rawDuration) ? rawDuration : null,
    channelId: Number.isFinite(rawChannel) && rawChannel > 0 ? rawChannel : null,
  };
}

/** Writes filter state back to the URL, leaving defaults out. */
export function writeFilters(filters: SearchFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.query) params.set('query', filters.query);
  if (filters.sort !== 'relevance') params.set('sort', filters.sort);
  filters.categories.forEach((category) => params.append('category', category));
  if (filters.duration) params.set('duration', filters.duration);
  if (filters.channelId) params.set('channelId', String(filters.channelId));
  return params;
}

/** Turns filter state into the request the search endpoint expects. */
export function toSearchOptions(
  filters: SearchFilters,
  page: number,
  limit: number
): SearchVideosOptions {
  const bucket = DURATION_BUCKETS.find((entry) => entry.id === filters.duration);
  return {
    query: filters.query,
    page,
    limit,
    sort: filters.sort,
    categories: filters.categories,
    channelId: filters.channelId ?? undefined,
    minDuration: bucket && 'minDuration' in bucket ? bucket.minDuration : undefined,
    maxDuration: bucket && 'maxDuration' in bucket ? bucket.maxDuration : undefined,
  };
}

/** True when anything narrows the result set beyond the query itself. */
export function hasActiveFilters(filters: SearchFilters): boolean {
  return filters.categories.length > 0 || filters.duration !== null || filters.channelId !== null;
}

/** Toggles one category on or off, preserving the order they were added in. */
export function toggleCategory(categories: string[], category: string): string[] {
  return categories.includes(category)
    ? categories.filter((entry) => entry !== category)
    : [...categories, category];
}
