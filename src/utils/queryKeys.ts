/**
 * Centralized Query Keys for React Query
 * 
 * This file provides a standardized approach to query key management,
 * ensuring consistency across the application and making cache invalidation easier.
 * 
 * Key Principles:
 * 1. Hierarchical structure: ['entity', 'operation', ...params]
 * 2. Consistent naming patterns
 * 3. Type safety with TypeScript
 * 4. Easy invalidation by entity or operation level
 */

import { GetDiscoveryOptions } from '../types/discovery';

export const queryKeys = {
  // User-related queries
  user: {
    // User root key - invalidates all user queries
    all: ['user'] as const,
    
    // Profile queries
    profile: (userId?: string) => [...queryKeys.user.all, 'profile', userId] as const,
    
    // Wallet queries  
    wallet: () => [...queryKeys.user.all, 'wallet'] as const,
  },

  // Video-related queries
  video: {
    // Video root key - invalidates all video queries
    all: ['video'] as const,
    
    // Single video by ID
    byId: (id: string) => [...queryKeys.video.all, id] as const,
    
    // Video progress tracking
    progress: (videoId: string) => [...queryKeys.video.all, 'progress', videoId] as const,
  },

  // Videos (plural) - for lists and collections
  videos: {
    // Videos root key - invalidates all video list queries
    all: ['videos'] as const,
    
    // Trending videos with parameters
    trending: (timeFrame?: string, params?: GetDiscoveryOptions) => 
      [...queryKeys.videos.all, 'trending', timeFrame, params] as const,
    
    // Channel videos
    byChannel: (channelId: string, params?: any) => 
      [...queryKeys.videos.all, 'channel', channelId, params] as const,
    
    // Search results
    search: (query: string, filters?: any) => 
      [...queryKeys.videos.all, 'search', query, filters] as const,
  },

  // Channel-related queries
  channel: {
    // Channel root key
    all: ['channel'] as const,
    
    // Single channel by ID or identifier
    byId: (identifier: string) => [...queryKeys.channel.all, identifier] as const,
    
    // Channel subscribers
    subscribers: (channelId: string) => [...queryKeys.channel.all, 'subscribers', channelId] as const,
    
    // Channel analytics
    analytics: (channelId: string, period?: string) => 
      [...queryKeys.channel.all, 'analytics', channelId, period] as const,
  },

  // Analytics-related queries
  analytics: {
    // Analytics root key
    all: ['analytics'] as const,
    
    // Channel analytics
    channel: (channelId: string, period: string) => 
      [...queryKeys.analytics.all, 'channel', channelId, period] as const,
    
    // Video analytics
    video: (videoId: string, period: string) => 
      [...queryKeys.analytics.all, 'video', videoId, period] as const,
    
    // Dashboard analytics
    dashboard: (timeRange: string) => 
      [...queryKeys.analytics.all, 'dashboard', timeRange] as const,
  },

  // Content Pass related queries
  passes: {
    // Passes root key
    all: ['passes'] as const,
    
    // Single pass by ID
    byId: (passId: string) => [...queryKeys.passes.all, passId] as const,
    
    // User's passes
    byUser: (userId?: string) => [...queryKeys.passes.all, 'user', userId] as const,
    
    // Channel passes
    byChannel: (channelId: string) => [...queryKeys.passes.all, 'channel', channelId] as const,
  },

  // Comments
  comments: {
    // Comments root key
    all: ['comments'] as const,
    
    // Comments for a video
    byVideo: (videoId: string) => [...queryKeys.comments.all, 'video', videoId] as const,
  },

  // Search and discovery
  discovery: {
    // Discovery root key
    all: ['discovery'] as const,
    
    // Trending content
    trending: (params?: GetDiscoveryOptions) => [...queryKeys.discovery.all, 'trending', params] as const,
    
    // Featured content
    featured: () => [...queryKeys.discovery.all, 'featured'] as const,
  },
} as const;

/**
 * Utility functions for cache invalidation
 */
export const invalidationHelpers = {
  // Invalidate all user-related data
  invalidateUser: (queryClient: any, userId?: string) => {
    if (userId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile(userId) });
    } else {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
    }
  },

  // Invalidate video data
  invalidateVideo: (queryClient: any, videoId?: string) => {
    if (videoId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.video.byId(videoId) });
    } else {
      queryClient.invalidateQueries({ queryKey: queryKeys.video.all });
    }
  },

  // Invalidate video lists (trending, search, etc.)
  invalidateVideoLists: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.videos.all });
  },

  // Invalidate channel data
  invalidateChannel: (queryClient: any, channelId?: string) => {
    if (channelId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.channel.byId(channelId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.channel.analytics(channelId) });
    } else {
      queryClient.invalidateQueries({ queryKey: queryKeys.channel.all });
    }
  },

  // Invalidate analytics data
  invalidateAnalytics: (queryClient: any, scope?: 'channel' | 'video', id?: string) => {
    if (scope && id) {
      if (scope === 'channel') {
        queryClient.invalidateQueries({ queryKey: queryKeys.analytics.channel(id, '') });
      } else {
        queryClient.invalidateQueries({ queryKey: queryKeys.analytics.video(id, '') });
      }
    } else {
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    }
  },
}; 