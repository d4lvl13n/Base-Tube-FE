// src/types/channel.ts
import { Video } from "./video";
import { WatchPatterns, SocialMetrics, GrowthMetrics, CreatorWatchHours } from "./analytics";

export interface Channel {
  id: number;
  name: string;
  handle: string;
  description?: string;
  unique_id: string;
  channel_image_path?: string;
  facebook_link?: string;
  instagram_link?: string;
  twitter_link?: string;
  subscribers_count: number;
  videos_count: number;
  isOwner: boolean;
  isSubscribed: boolean;
  ownerUsername: string;
  createdAt: string;
  updatedAt: string;
  ownerProfileImage?: string | null;
  last_video_at?: string;
  hasNewContent?: boolean;
}

// Response Types
export interface ChannelResponse {
  success: boolean;
  channel: Channel;
  message?: string;
}

// Base response interface
export interface BaseChannelsResponse {
  success: boolean;
  total: number;
  totalPages?: number;
  hasMore?: boolean;    
  currentPage?: number;
  itemsPerPage?: number;
}

// Specific response for getChannels endpoint
export interface GetChannelsResponse extends BaseChannelsResponse {
  channels: Channel[];
}

// Keep existing interface for backward compatibility
export interface ChannelsResponse extends BaseChannelsResponse {
  data: Channel[];
}

export interface ChannelDetailsResponse {
  success: boolean;
  channel: Channel;
}

export interface ChannelVideosResponse {
  success: boolean;
  data: Video[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ChannelAnalyticsResponse {
  success: boolean;
  data: {
    watchPatterns: WatchPatterns;
    socialMetrics: SocialMetrics;
    growthMetrics: GrowthMetrics;
    creatorWatchHours: CreatorWatchHours;
  };
}

// Query Types
export interface ChannelQueryOptions {
  page?: number;
  limit?: number;
  sort?: string;
}

// Form Data Types
export interface CreateChannelData {
  name: string;
  handle?: string;
  description: string;
  channel_image?: File;
  cover_image?: File;
  facebook_link?: string;
  instagram_link?: string;
  twitter_link?: string;
}

export interface UpdateChannelData extends Partial<Omit<Channel, 'id' | 'user_id' | 'unique_id'>> {
  handle?: string;
  channel_image?: File;
  cover_image?: File;
}

// Helper type for form data conversion
export interface ChannelFormData extends FormData {
  append(name: keyof CreateChannelData | keyof UpdateChannelData, value: string | Blob): void;
}

// Handle validation utilities
export const handleValidation = {
  minLength: 3,
  maxLength: 29,
  pattern: /^[a-zA-Z0-9][a-zA-Z0-9_]{2,28}$/,
  reservedHandles: ['admin', 'base', 'help', 'support']
};

export const isValidHandle = (handle: string): boolean => {
  return (
    handle.length >= handleValidation.minLength &&
    handle.length <= handleValidation.maxLength &&
    handleValidation.pattern.test(handle) &&
    !handleValidation.reservedHandles.includes(handle.toLowerCase())
  );
};

// Add options interface to match backend
export type ChannelSortOption = 'subscribers_count' | 'updatedAt' | 'createdAt';

export interface GetChannelsOptions {
  page?: number;
  limit?: number;
  sort?: ChannelSortOption;
  minSubscribers?: number;
  search?: string;
}

export interface SubscribedChannelResponse {
  success: boolean;
  data: Channel[];
  pagination: {
    total: number;
    hasMore: boolean;
    currentPage: number;
    itemsPerPage: number;
  };
}

export interface GetSubscribedChannelsOptions {
  page?: number;
  limit?: number;
  sort?: string;
}

export interface SubscribedChannel {
  id: number;
  user_id: string;
  name: string;
  description: string;
  unique_id: string;
  channel_image_path: string;
  facebook_link: string | null;
  instagram_link: string | null;
  twitter_link: string | null;
  subscribers_count: number;
  isApproved: boolean;
  status: number;
  handle: string;
  createdAt: string;
  updatedAt: string;
  user: {
    username: string;
    profile_image_url: string | null;
  };
  isSubscribed: boolean;
  isOwner: boolean;
  ownerUsername: string | null;
  ownerProfileImage: string | null;
  newVideos?: number;
}