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

export type SearchSort = 'relevance' | 'date' | 'views';

export interface SearchResponse {
  success: boolean;
  data: unknown;
}
