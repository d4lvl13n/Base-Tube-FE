import { Video } from '../../../../types/video';

export interface VideoFilters {
  search?: string;
  sortBy?: 'newest' | 'oldest' | 'most_viewed' | 'most_liked';
  visibility?: 'public' | 'private' | 'unlisted';
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

export type VideoAction = 
  | 'edit'
  | 'delete'
  | 'toggle_visibility'
  | 'share';

export interface VideoActionsProps {
  selectedVideos: string[];
  onBulkAction: (action: VideoAction) => void;
}

export interface VideoFiltersProps {
  filters: VideoFilters;
  onFilterChange: (filters: VideoFilters) => void;
} 