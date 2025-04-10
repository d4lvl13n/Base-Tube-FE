export interface WatchPatterns {
  timeFrames: {
    daily: {
      watchTimeHours: number;
      videosWatched: number;
      completionRate: number;
    };
    weekly: {
      watchTimeHours: number;
      videosWatched: number;
      completionRate: number;
    };
    monthly: {
      watchTimeHours: number;
      videosWatched: number;
      completionRate: number;
    };
  };
  peakHours: Array<{ hour: number; viewCount: number }>;
  completionRates: {
    overall: number;
    byDuration: {
      short: number;
      medium: number;
      long: number;
    };
  };
}

export interface CreatorWatchHours {
  totalWatchHours: number;
  formattedHours: string;
  trend?: number;
}

export interface SocialMetrics {
  interactions: {
    commentsReceived: number;
    responseRate: number;
    averageResponseTime: number;
    recentEngagement: {
      total: number;
      likes: number;
      comments: number;
    };
  };
  community: {
    subscriberCount: number;
    recentSubscribers: number;
  };
}

export interface GrowthMetrics {
  metrics: {
    subscribers: {
      total: number;
      trend: number;
      data: Array<{ date: string; value: number }>;
    };
    views: {
      total: number;
      trend: number;
      data: Array<{ date: string; value: number }>;
    };
    engagement: {
      total: number;
      trend: number;
      data: Array<{ date: string; value: number }>;
    };
  };
}

export interface BasicViewMetrics {
  totalViews: number;
  uniqueViewers: number;
  completedViews: number;
  averageWatchDuration: number;
}

export interface DetailedViewMetrics extends BasicViewMetrics {
  viewsByPeriod: {
    last24h: number;
    last7d: number;
    last30d: number;
  };
}

export interface ContentPerformance {
  topVideos: Array<{
    id: string;
    title: string;
    views: number;
    watchTimeHours: number;
    completionRate: number;
  }>;
}

export interface LikeGrowthTrends {
  trends: Array<{ date: string; likeCount: number }>;
  totalDays: number;
  averageLikesPerDay: number;
}

export interface TopLikedVideo {
  videoId: number;
  title: string;
  thumbnail: string;
  likeCount: number;
  viewCount: number;
  likeToViewRatio: string; 
}

export type TopLikedVideos = TopLikedVideo[];

export interface LikeViewRatio {
  videoId: number;
  likesCount: number;
  viewsCount: number;
  likeToViewRatio: string;
}

// Add these new types for channel watch patterns

export interface HourlyPattern {
  hour: number;
  viewCount: number;
  avgWatchSeconds: number;
}

export interface WeekdayPattern {
  dayOfWeek: number;
  viewCount: number;
}

export interface DurationStats {
  averageWatchDuration: number;
  maxWatchDuration: number;
  totalViews: number;
  uniqueViewers: number;
}

export interface RetentionByDuration {
  durationCategory: string;
  retentionRate: number;
  viewCount: number;
}

export interface RetainedVideo {
  videoId: number;
  title: string;
  videoLength: number;
  avgWatchDuration: number;
  retentionRate: number;
  viewCount: number;
}

export interface ChannelWatchPatterns {
  hourlyPatterns: HourlyPattern[];
  weekdayPatterns: WeekdayPattern[];
  durationStats: DurationStats;
  retentionByDuration: RetentionByDuration[];
  topRetainedVideos: RetainedVideo[];
}

// Audience Demographics types
export interface GeoDistribution {
  country: string;
  percentage: number;
  viewCount: number;
}

export interface DeviceUsage {
  type: string;
  percentage: number;
  viewCount: number;
}

export interface ChannelDemographics {
  geoDistribution: GeoDistribution[];
  deviceUsage: DeviceUsage[];
}

// src/types/analytics.ts

// Audience Demographics types
export interface GeoDistribution {
  country: string;
  percentage: number;
  viewCount: number;
}

export interface DeviceUsage {
  type: string;
  percentage: number;
  viewCount: number;
}

export interface ChannelDemographics {
  geoDistribution: GeoDistribution[];
  deviceUsage: DeviceUsage[];
}

// Period types
export type DemographicsPeriod = 'last7' | 'last30' | 'last90' | 'allTime';
export type EngagementPeriod = '7d' | '30d' | 'all';

// Engagement metrics trends
export interface EngagementMetric {
  date: string;
  count: number;
}

export interface EngagementTrends {
  likeGrowth: EngagementMetric[];
  commentGrowth: EngagementMetric[];
  shareGrowth: EngagementMetric[];
}

// Top liked content
export interface TopContentItem {
  id: string;
  title: string;
  thumbnail: string;
  likes: number;
  views: number;
  likeRate: number; // percentage
}

// Top shared content
export interface TopSharedItem {
  id: string;
  title: string;
  thumbnail: string;
  shares: number;
  views: number;
  shareRate: number; // percentage
}

// Top comments
export interface TopComment {
  id: number;
  username: string;
  avatar: string;
  comment: string;
  likes: number;
  videoTitle: string;
  videoId: string;
  date: string; // ISO format
}

// Watch patterns
export interface HourlyPattern {
  hour: number;
  viewCount: number;
  avgWatchSeconds: number;
}

export interface WeekdayPattern {
  dayOfWeek: number;
  viewCount: number;
}

export interface DurationStats {
  averageWatchDuration: number;
  maxWatchDuration: number;
  totalViews: number;
  uniqueViewers: number;
}

export interface RetentionByDuration {
  durationCategory: string;
  retentionRate: number;
  viewCount: number;
}

export interface RetainedVideo {
  videoId: number;
  title: string;
  videoLength: number;
  avgWatchDuration: number;
  retentionRate: number;
  viewCount: number;
}

export interface ChannelWatchPatterns {
  hourlyPatterns: HourlyPattern[];
  weekdayPatterns: WeekdayPattern[];
  durationStats: DurationStats;
  retentionByDuration: RetentionByDuration[];
  topRetainedVideos: RetainedVideo[];
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// === NEW TYPES FOR DETAILED VIDEO PERFORMANCE ===

// Video performance metrics for analytics
export interface VideoPerformanceItem {
  id: number;
  title: string;
  thumbnail_url: string;
  createdAt: string;
  duration: number;
  views: number;
  likes: number;
  comments: number;
  average_watch_duration_seconds: number;
  average_percentage_viewed: number;
}

export interface VideoPerformanceResponse {
  videos: VideoPerformanceItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
