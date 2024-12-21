// src/types/discovery.ts

import { Channel } from '../../../types/channel'; // Assuming you have a Channel type defined
// If you don't, create one or adjust imports accordingly.

export type TimeFrame = 'today' | 'week' | 'month' | 'all';
export type SortOption = 'trending' | 'latest' | 'popular' | 'random';

export interface DiscoveryVideo {
  id: number;
  user_id: string;
  views_count: number;
  channel_id: number;
  title: string;
  description: string | null;
  processed_video_paths?: string[] | null;
  thumbnail_path: string;
  thumbnail_url: string;
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
  video_urls: {
    '480p'?: string;
    '720p'?: string;
    '1080p'?: string;
  } | null;
}

export interface DiscoveryPagination {
  total: number;
  hasMore: boolean;
  page: number;
  limit: number;
}

export interface DiscoveryResponse {
  success: boolean;
  data: DiscoveryVideo[];
  pagination: DiscoveryPagination;
  message?: string;
  error?: string;
}

export interface GetDiscoveryOptions {
  page?: number;
  limit?: number;
  timeFrame?: TimeFrame;
  sort?: SortOption;
}