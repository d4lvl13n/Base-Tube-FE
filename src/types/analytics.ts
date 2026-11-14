// Response shapes of the creator analytics endpoints, checked against the
// backend (base-be: services/analyticsService.ts, services/creatorAnalyticsService.ts,
// services/AudienceDemographicsService.ts, controllers/analyticsController.ts,
// controllers/CreatorAnalyticsController.ts, controllers/channelController.ts).
// Dates: 'YYYY-MM-DD' keys are UTC calendar days; moments are ISO UTC.

import type { ViewCountingRules } from './config';

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

/** GET /analytics/channels/:id/watch-hours (`data`). */
export interface CreatorWatchHours {
  channelId: string;
  /** Rounded to one decimal. */
  totalWatchHours: number;
  /** Exact seconds — see formatWatchTime. */
  totalWatchSeconds: number;
  /** '7d' | '30d' | 'all'. */
  period: string;
  formattedHours: string;
  /** UTC day ('YYYY-MM-DD') from which played time is measured accurately. */
  watchTimeAccurateFrom: string;
}

/** GET /analytics/channels/:id/social-metrics (`data`). Every number covers the last `windowDays` days. */
export interface SocialMetrics {
  interactions: {
    /** Same number as `comments`. */
    commentsReceived: number;
    /** Countable comments in the window, the creator's own and replies included. */
    comments: number;
    /** The part of `comments` written by someone other than the creator. */
    commentsFromOthers: number;
    /** Comments from others that got a reply from the creator. */
    commentsAnswered: number;
    /** commentsAnswered / commentsFromOthers × 100, one decimal; 0 with no comments from others. */
    responseRate: number;
    /** Hours to the creator's first reply, averaged over answered comments; 0 when none. */
    averageResponseTime: number;
    windowDays: number;
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

export interface GrowthSeries {
  /** UTC keys: a day per point (7d / 30d), the month's first day per point (all). Zero-padded. */
  data: Array<{ date: string; value: number }>;
  /** Sum over the current window (lifetime for 'all'). */
  total: number;
  /** % change vs the previous equal window; null when that window is 0 or for 'all'. */
  trend: number | null;
  /** Count in the previous equal-length window; null for 'all'. */
  previousTotal: number | null;
  /** Length of each comparison window in days; null for 'all'. */
  windowDays: number | null;
}

/** GET /analytics/channels/:id/growth (`data`). */
export interface GrowthMetrics {
  period: '7d' | '30d' | 'all';
  /** 'day' for 7d / 30d, 'month' for all. */
  granularity: 'day' | 'month';
  timezone: 'UTC';
  metrics: {
    granularity: 'day' | 'month';
    subscribers: GrowthSeries;
    views: GrowthSeries;
    engagement: GrowthSeries;
  };
  timestamp: string;
}

/** GET /analytics/channels/:id/views (`data`). Lifetime counted views. */
export interface BasicViewMetrics {
  totalViews: number;
  /** signedInViewers + signedOutNetworks (see uniqueViewersRule). */
  uniqueViewers: number;
  /** Distinct signed-in accounts with a counted view. */
  signedInViewers: number;
  /** Distinct network addresses among signed-out counted views (an estimate of people). */
  signedOutNetworks: number;
  /** How uniqueViewers is counted, in words. */
  uniqueViewersRule: string;
  completedViews: number;
  /** Seconds. */
  averageWatchDuration: number;
  watchTimeAccurateFrom: string;
}

export interface DetailedViewMetrics extends BasicViewMetrics {
  viewsByPeriod: {
    last24h: number;
    last7d: number;
    last30d: number;
  };
}

// Channel watch patterns

export interface HourlyPattern {
  /** UTC hour, 0–23. */
  hour: number;
  viewCount: number;
  avgWatchSeconds: number;
}

export interface WeekdayPattern {
  /** MySQL DAYOFWEEK, UTC: 1 = Sunday … 7 = Saturday. */
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

/** GET /creators/channels/:id/watch-patterns (`data`). */
export interface ChannelWatchPatterns {
  hourlyPatterns: HourlyPattern[];
  weekdayPatterns: WeekdayPattern[];
  durationStats: DurationStats;
  retentionByDuration: RetentionByDuration[];
  topRetainedVideos: RetainedVideo[];
  /** Hours and weekdays are UTC. */
  timezone: 'UTC';
  /** How durationStats.uniqueViewers is counted, in words. */
  uniqueViewersRule: string;
  watchTimeAccurateFrom: string;
}

// Audience demographics

export interface GeoDistribution {
  /** English country name; 'Unknown' for countryCode 'ZZ'. */
  country: string;
  /** ISO 3166-1 alpha-2, or 'ZZ' when the country could not be resolved. */
  countryCode: string;
  /** Share of `totalViews` (all countries), whole percent. */
  percentage: number;
  viewCount: number;
}

export interface DeviceUsage {
  type: string;
  percentage: number;
  viewCount: number;
}

export type DemographicsPeriod = 'last7' | 'last30' | 'last90' | 'allTime';

/** GET /creators/channels/:id/demographics (`data`). */
export interface ChannelDemographics {
  /** Top 5 countries. */
  geoDistribution: GeoDistribution[];
  deviceUsage: DeviceUsage[];
  /** The period actually applied. */
  period: DemographicsPeriod;
  /** Counted views in the period with a recorded country (all countries, not only the top 5). */
  totalViews: number;
  /** When daily counting started (ISO, UTC), or null if nothing was recorded yet. */
  measuredSince: string | null;
}

export type EngagementPeriod = '7d' | '30d' | 'all';

// Engagement trends

export interface EngagementMetric {
  /** UTC day, or the Monday that starts the UTC week (all time). */
  date: string;
  count: number;
}

/** GET /creators/channels/:id/engagement/trends (`data`). Zero-padded, all three series on the same keys. */
export interface EngagementTrends {
  likeGrowth: EngagementMetric[];
  commentGrowth: EngagementMetric[];
  shareGrowth: EngagementMetric[];
  /** 'day' for 7d / 30d, 'week' for all. */
  granularity: 'day' | 'week';
  period: EngagementPeriod;
  timezone: 'UTC';
}

/** A ranked list plus the period the backend computed it over (envelope field `period`). */
export interface RankedList<T> {
  items: T[];
  appliedPeriod: '7d' | '30d' | '90d' | 'all';
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

// Top comments (removed / hidden comments are never returned by the backend)
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

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Detailed video performance: GET /creators/channels/:id/videos/performance

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
  /** Σ seconds watched over the period's counted views (weight for page averages). */
  watch_seconds_total: number;
  /** Σ per-view % watched (weight for page averages). */
  percent_watched_sum: number;
  completed_views: number;
}

export interface VideoPerformanceResponse {
  videos: VideoPerformanceItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  /** `catalogue` = pagination.total (private and unlisted included); `public` = what the public channel page counts. */
  videoCounts: { catalogue: number; public: number };
  /** The period actually applied. */
  period: '7d' | '30d' | '90d' | 'all';
  watchTimeAccurateFrom: string;
  countingRules: ViewCountingRules;
}
