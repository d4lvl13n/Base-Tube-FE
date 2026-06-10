// src/types/video.ts

import { Channel } from './channel';
import { User } from './user';

export interface Video {
  id: number;
  /** @deprecated Stripped by the backend in all responses — always undefined. */
  user_id?: number;
  channel_id: number;
  title: string;
  description: string;

  // Video paths and URLs
  /** @deprecated Internal storage path — stripped by the backend in all responses. */
  video_path?: string;
  video_url?: string;          // Full Storj URL
  video_urls?: {               // Different quality versions
    '240p'?: string;
    '360p'?: string;
    '480p'?: string;
    '720p'?: string;
    '1080p'?: string;
    '1440p'?: string;
    '2160p'?: string;
    'original'?: string;
  };
  /** @deprecated Internal storage paths — stripped by the backend in all responses. */
  processed_video_paths?: string[] | null;

  // Thumbnail paths and URLs
  /** @deprecated Internal storage path — stripped by the backend in all responses. */
  thumbnail_path?: string;
  thumbnail_url?: string;      // Full Storj URL
  thumbnail_urls?: {           // Different thumbnail sizes
    small?: string;
    medium?: string;
    large?: string;
    original?: string;
  };

  // Video metadata
  duration: number;
  views_count: number;  
  likes_count: number;
  likes: number;
  views: number;
  dislikes: number;
  is_public: boolean;
  is_featured: boolean;
  trending_score: number;
  is_nft_content: boolean;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  
  // Relations
  channel?: Channel & {
    user?: {
      username: string;
      profile_image_url: string | null;
    };
  };
  user?: User;
  
  // Counts
  comment_count: number;
  /** @deprecated The backend sends likes_count; this is only set by feed transforms. */
  like_count?: number;
  
  // Additional metadata
  engagement_score?: number;
  time_category: 'today' | 'this_week' | 'this_month' | 'older';
  tags?: string;
  status: VideoStatus;
  processing_progress?: {
    percent: number;
    currentQuality?: string;
    totalQualities?: number;
    currentQualityIndex?: number;
  };
}

// Matches GET /api/v1/videos/trending: videos array under `data`,
// pagination fields on the envelope itself.
export interface TrendingVideoResponse {
  success: boolean;
  data: Video[];
  total: number;
  hasMore: boolean;
}

export interface VideoResponse {
  success: boolean;
  data: Video;
}

export interface VideosResponse {
  success: boolean;
  data: {
    videos: Video[];
    total: number;
    hasMore: boolean;
  }
}

export interface ProgressResponse {
  success: boolean;
  data: {
    videoId: number;
    status: VideoStatus;
    progress?: {
      quality: string;
      percent: number;
      currentQuality: string;
      totalQualities: number;
      currentQualityIndex: number;
    };
    error?: {
      message: string;
      jobId?: string;
      timestamp?: string;
    };
  };
}

// 'processed' is the raw DB value the progress endpoint passes through;
// 'completed' is the normalized UI value. Handle both.
export type VideoStatus = 'pending' | 'processing' | 'processed' | 'completed' | 'failed';

export interface VideoProgress {
  videoId: number;
  percent: number;
  status: VideoStatus;
  currentQuality?: string;
  totalQualities?: number;
  currentQualityIndex?: number;
}

// Generic pagination response type
export interface PaginationResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// Updated Video interface for recommendations
export interface RecommendedVideo {
  id: number;
  title: string;
  description: string;
  thumbnail_url: string;
  duration: number;
  views_count: number;
  likes_count: number;
  channel: {
    id: number;
    name: string;
    handle: string;
    channel_image_url: string;
    owner: {
      username: string;
      profile_image_url: string | null;
    };
  };
  createdAt: string;
}

// Response type for recommended videos
export interface RecommendedVideosResponse {
  videos: RecommendedVideo[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}