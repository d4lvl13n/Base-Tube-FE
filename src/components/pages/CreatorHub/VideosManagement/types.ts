import { ProcessingVideo } from '../../../../hooks/useVideoProcessing';
import { Video } from '../../../../types/video';

/** The four orders the server knows how to sort a channel's videos by. */
export type VideoSortOption = 'newest' | 'oldest' | 'most_viewed' | 'most_liked';

/**
 * The single chip group above the list.
 *
 * There is no "unlisted": the model has one boolean, `is_public`. `processing`
 * is a status rather than a visibility, but it belongs in the same group
 * because a creator picks exactly one of these four at a time — the toolbar
 * splits it back out into the right query parameter.
 */
export type VideoVisibilityFilter = 'all' | 'public' | 'private' | 'processing';

/** Everything the toolbar owns, and everything that lives in the URL. */
export interface VideoFilters {
  q: string;
  visibility: VideoVisibilityFilter;
  sort: VideoSortOption;
}

export const DEFAULT_FILTERS: VideoFilters = { q: '', visibility: 'all', sort: 'newest' };

/** True when the list the creator is looking at is a filtered one. */
export function hasActiveFilters(filters: VideoFilters): boolean {
  return filters.q.trim() !== '' || filters.visibility !== 'all';
}

/** The stat columns that double as sort shortcuts. */
export type SortField = 'date' | 'views' | 'likes';

/** What a row's controls ask the page to do. */
export type VideoAction = 'edit' | 'delete' | 'toggle_visibility';

/** What a bulk action asks the page to do to every selected row. */
export type BulkAction = 'make_public' | 'make_private' | 'delete';

export interface VideoListProps {
  videos: Video[];
  isLoading: boolean;
  onLoadMore: () => void;
  hasMore: boolean;
  processingVideos?: Record<number, ProcessingVideo>;
}
