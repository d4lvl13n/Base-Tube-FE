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
}

export interface SocialMetrics {
  interactions: {
    commentsGiven: number;
    commentsReceived: number;
    responseRate: number;
    averageResponseTime: number;
  };
  commentTrends: Array<{
    date: string;
    comments: number;
    replies: number;
    responseRate: number;
  }>;
  community: {
    mostInteractedChannels: Array<{
      id: string;
      name: string;
      interactionCount: number;
    }>;
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