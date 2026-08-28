import type { Channel } from './channel';
import type { TimeFrame, VideoSort } from './video';

export interface DiscoveryVideo {
  id: number;
  user_id: string;
  views_count: number;
  channel_id: number;
  title: string;
  description: string | null;
  thumbnail_path: string;
  thumbnail_url: string;
  video_urls: Record<string, string | undefined> | null;
  is_public: boolean;
  is_featured: boolean;
  trending_score: number;
  duration: number;
  likes_count: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  engagement_score: number;
  time_category: 'today' | 'this_week' | 'this_month' | 'older';
  channel: Channel;
}

export interface DiscoveryResponse {
  success: boolean;
  data: DiscoveryVideo[];
  pagination: {
    total: number;
    hasMore: boolean;
    page: number;
    limit: number;
  };
  message?: string;
  error?: string;
}

export interface GetDiscoveryOptions {
  page?: number;
  limit?: number;
  timeFrame?: TimeFrame;
  sort?: VideoSort;
}

/**
 * Sort orders accepted by `GET /api/v1/search`.
 *
 * `date` is the legacy spelling the route still honours; `newest` is the name
 * it publishes, and `trending` is new. Existing callers keep compiling.
 */
export type SearchSort = 'relevance' | 'date' | 'views' | 'newest' | 'trending';

/** Which backend answered. `mysql` means the fallback ran. */
export type SearchEngine = 'meilisearch' | 'mysql';

/**
 * What scale `SearchResult.relevance` is on. Read this before interpreting it.
 *
 * `ranking` is Meilisearch's normalised [0, 1] score: comparable between
 * queries, safe to show as a percentage or threshold on. `fulltext` is MySQL's
 * unbounded MATCH … AGAINST score, which only orders the hits inside one
 * response — a percentage computed from it means nothing. A client that
 * ignores this field must treat `relevance` as ordering-only.
 */
export type SearchScoreKind = 'ranking' | 'fulltext';

/** The slice of a channel a search hit carries. */
export interface SearchResultChannel {
  id: number;
  name: string;
  handle: string;
  channel_image_url?: string | null;
  subscribers_count?: number;
}

/** A single search hit from `GET /api/v1/search`. */
export interface SearchResult {
  id: number;
  title: string;
  description?: string | null;
  search_text?: string;
  thumbnail_url: string;
  /** Absent on the Meilisearch route — read `thumbnail_url` instead. */
  thumbnail_path?: string;
  duration: number;
  views_count: number;
  /** Ordering-only unless the response says `score_kind: 'ranking'`. */
  relevance?: number;
  channel_id?: number;
  channel?: SearchResultChannel;
}

/**
 * Facet counts for the current result set, keyed by value.
 *
 * `null` when the MySQL fallback answered — it cannot count facets, and a
 * zeroed object would read as "no categories" rather than "not available".
 */
export interface SearchFacets {
  categories: Record<string, number>;
  channel_id: Record<string, number>;
}

/**
 * Marked-up title and description for one hit.
 *
 * The strings contain `<mark>` tags and nothing else, but they are still
 * server-supplied text: split on the tags and render the element yourself.
 * Never hand these to `dangerouslySetInnerHTML`.
 */
export interface SearchHighlight {
  title?: string;
  description?: string;
}

export interface SearchResponse {
  success: boolean;
  data: SearchResult[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  hasMore?: boolean;
  facets?: SearchFacets | null;
  engine?: SearchEngine;
  /** The scale `relevance` is on. Absent on responses from before it existed. */
  score_kind?: SearchScoreKind;
  /** Keyed by video id, as a string. */
  highlights?: Record<string, SearchHighlight>;
  processingTimeMs?: number;
}

/** Everything `GET /api/v1/search` accepts. An empty `query` browses newest. */
export interface SearchVideosOptions {
  query?: string;
  page?: number;
  /** Capped at 50 by the server. */
  limit?: number;
  channelId?: number;
  /** Repeated as `category=` once per value. */
  categories?: string[];
  minDuration?: number;
  maxDuration?: number;
  sort?: SearchSort;
}

export interface SearchSuggestChannel {
  id: number;
  name: string;
  /** Null when the indexed document has no handle; link by `id` in that case. */
  handle: string | null;
}

export interface SearchSuggestions {
  titles: string[];
  channels: SearchSuggestChannel[];
}

export interface SearchSuggestResponse {
  success: boolean;
  data: SearchSuggestions;
}
