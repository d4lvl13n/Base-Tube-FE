/**
 * Types for the Share feature
 */

// Database model representation
export interface ShareModel {
  id: number;
  user_id: number | null;
  video_id: number;
  share_platform: string;
  createdAt: Date;
  updatedAt: Date;
}

// Share platform options
export type SharePlatform = 'facebook' | 'twitter' | 'whatsapp' | 'telegram' | 
                            'linkedin' | 'email' | 'copy_link' | 'embed' | 'unknown';

// Request/response types for API
export interface ShareRequest {
  platform: string;
}

export interface ShareResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    videoId: number;
    platform: string;
    createdAt: string;
  };
}

export interface ShareStatsRequest {
  videoId: number;
}

export interface ShareStatsResponse {
  success: boolean;
  data: {
    totalShares: number;
    byPlatform: Record<string, number>;
  };
}

// Analytics types
export interface ShareAnalytics {
  videoId: number;
  totalShares: number;
  shareRate: number; // shares per view
  byPlatform: Record<SharePlatform, number>;
  trend: ShareTrend[];
}

export interface ShareTrend {
  date: string;
  count: number;
} 