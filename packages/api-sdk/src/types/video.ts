import type { Channel } from './channel';
import type { PageMeta } from './common';

export type VideoStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type TimeFrame = 'today' | 'week' | 'month' | 'all';
export type VideoSort = 'trending' | 'latest' | 'popular' | 'random';

/** Mirrors `Videos` as exposed by public video endpoints. */
export interface Video {
  id: number;
  user_id: number | string;
  channel_id: number;
  title: string;
  description: string;
  thumbnail_path: string;
  thumbnail_url?: string;
  video_url?: string;
  video_urls?: Record<string, string | undefined> | null;
  duration: number;
  views_count: number;
  likes_count: number;
  is_public: boolean;
  is_featured: boolean;
  trending_score?: number;
  is_nft_content?: boolean;
  status: VideoStatus;
  createdAt: string;
  updatedAt: string;
  channel?: Channel & {
    user?: { username: string; profile_image_url: string | null };
  };
  comment_count?: number;
  time_category?: 'today' | 'this_week' | 'this_month' | 'older';
  tags?: string;
}

export interface TrendingVideoResponse {
  success: boolean;
  data: {
    videos: Video[];
    total: number;
    hasMore: boolean;
    timeFrame: TimeFrame;
    sort: VideoSort;
  };
}

export interface VideoResponse {
  success: boolean;
  data: Video;
}

/** Lighter shape returned by `/videos/featured`. */
export interface FeaturedVideo {
  id: number;
  title: string;
  description: string;
  duration: number;
  views_count: number;
  likes_count: number;
  thumbnail_url: string;
  created_at: string;
  channel: {
    id: number;
    name: string;
    handle: string;
    channel_image_url: string;
    owner: { username: string | null; profile_image_url: string | null };
  } | null;
}

export interface FeaturedVideoResponse {
  success: boolean;
  data: {
    videos: FeaturedVideo[];
    rotation: { period_hours: number; next_update: string };
    total: number;
  };
}

export interface RecommendedVideosResponse {
  success: boolean;
  data: Video[];
  pagination: PageMeta;
}

export interface TrendingParams {
  page?: number;
  limit?: number;
  timeFrame?: TimeFrame;
  sort?: VideoSort;
}
