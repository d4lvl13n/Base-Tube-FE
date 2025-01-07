import { Video } from '../../../../types/video';

export type VideoSortOption = 'newest' | 'oldest' | 'most_viewed' | 'most_liked';
export type VideoVisibilityOption = 'all' | 'public' | 'private' | 'unlisted';

export interface VideoFilters {
  search?: string;
  sortBy?: VideoSortOption;
  visibility?: VideoVisibilityOption;
}

export interface VideosManagementProps {
  selectedChannelId: string;
}

export interface VideoListProps {
  videos: Video[];
  isLoading: boolean;
  onLoadMore: () => void;
  hasMore: boolean;
  onVideoAction: (videoId: string, action: VideoAction) => void;
  selectedVideos: string[];
  onVideoSelect: (videoId: string) => void;
  onSelectAll: (videoIds: string[]) => void;
}

export type VideoAction = 'edit' | 'delete' | 'toggle_visibility';

export interface VideoActionsProps {
  selectedVideos: string[];
  onBulkAction: (action: VideoAction) => void;
}

export interface VideoFiltersProps {
  filters: VideoFilters;
  onFilterChange: (filters: VideoFilters) => void;
} 