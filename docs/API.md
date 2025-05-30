# Base.Tube API Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Structure](#api-structure)
4. [Core Modules](#core-modules)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Examples](#examples)

## 🎯 Overview

The Base.Tube API layer provides a comprehensive interface for interacting with video content, user management, monetization features, and analytics. Built with TypeScript for type safety and axios for HTTP communication.

### Base Configuration
```typescript
// src/api/index.ts
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  timeout: 30000,
  withCredentials: true
});
```

## 🔐 Authentication

### Authentication Methods
- **Clerk Integration**: Traditional email/password authentication
- **Web3 Authentication**: Wallet-based authentication
- **Session Management**: Automatic token refresh and session handling

### Headers
```typescript
{
  'Authorization': 'Bearer <token>',
  'Content-Type': 'application/json',
  'X-User-ID': '<user-id>' // For some endpoints
}
```

## 🏗️ API Structure

### Module Organization
```
src/api/
├── index.ts           # Base API configuration
├── analytics.ts       # Analytics and metrics
├── auth.ts           # Authentication endpoints
├── batchupload.ts    # Batch video operations
├── channel.ts        # Channel management
├── comment.ts        # Comment system
├── discovery.ts      # Content discovery
├── embed.ts          # Video embedding
├── leaderboard.ts    # User rankings
├── monitoring.ts     # System health
├── onboarding.ts     # User onboarding
├── pass.ts           # Content passes
├── profile.ts        # User profiles
├── search.ts         # Search functionality
├── shareApi.ts       # Social sharing
├── thumbnail.ts      # Thumbnail management
├── userPoints.ts     # Points system
├── video.ts          # Video operations
├── web3authapi.ts    # Web3 authentication
├── youtube.ts        # YouTube integration
└── youtubeAuth.ts    # YouTube OAuth
```

## 🚀 Core Modules

### 1. Video Management (`video.ts`)

#### Upload Video
```typescript
const uploadVideo = async (formData: FormData): Promise<UploadResponse> => {
  return api.post('/api/v1/videos/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
```

#### Get All Videos
```typescript
const getAllVideos = (page: number = 1, limit: number = 10) =>
  api.get(`/api/v1/videos?page=${page}&limit=${limit}`);
```

#### Get Featured Videos
```typescript
const getFeaturedVideos = (limit: number = 2): Promise<Video[]> =>
  api.get(`/api/v1/videos/featured?limit=${limit}`);
```

### 2. Analytics (`analytics.ts`)

#### Creator Analytics
```typescript
// Get channel watch patterns
const getChannelWatchPatterns = async (channelId: string): Promise<ChannelWatchPatterns> => {
  const response = await api.get(`/api/v1/creators/channels/${channelId}/watch-patterns`);
  return response.data.data;
};

// Get channel watch hours
const getChannelWatchHours = async (
  channelId: string, 
  period?: '7d' | '30d'
): Promise<CreatorWatchHours> => {
  const endpoint = period 
    ? `/api/v1/analytics/channels/${channelId}/watch-hours?period=${period}`
    : `/api/v1/analytics/channels/${channelId}/watch-hours`;
  
  const response = await api.get(endpoint);
  return response.data.data;
};

// Get engagement trends
const getEngagementTrends = async (
  channelId: string,
  period?: '7d' | '30d' | 'all'
): Promise<EngagementTrends> => {
  return api.get(`/api/v1/creators/channels/${channelId}/engagement/trends`, {
    params: { period }
  });
};
```

#### Video Performance
```typescript
const getChannelVideosPerformance = async (
  channelId: string,
  options?: {
    page?: number;
    limit?: number;
    sort_by?: 'views' | 'likes' | 'comments' | 'createdAt';
    order?: 'asc' | 'desc';
    period?: 'all' | '7d' | '30d' | '90d';
  }
): Promise<VideoPerformanceResponse> => {
  return api.get(`/api/v1/creators/channels/${channelId}/videos/performance`, {
    params: options
  });
};
```

### 3. Channel Management (`channel.ts`)

#### Get User Channels
```typescript
const getMyChannels = async (
  options: ChannelQueryOptions = {}
): Promise<Channel[]> => {
  const { page = 1, limit = 10, sort = 'createdAt' } = options;
  
  const response = await api.get('/api/v1/channels/my', {
    params: { page, limit, sort, include: 'owner' }
  });
  return response.data.data;
};
```

#### Get Channel Details
```typescript
const getChannelDetails = async (identifier: number | string): Promise<ChannelResponse> => {
  const endpoint = typeof identifier === 'number' 
    ? `/api/v1/channels/${identifier}`
    : `/api/v1/channels/handle/${identifier}`;
  
  const response = await api.get(endpoint);
  return response.data;
};
```

### 4. Content Passes (`pass.ts`)

#### Create Pass
```typescript
const createPass = async (data: CreatePassRequest): Promise<Pass> => {
  const response = await api.post('/api/v1/passes', data);
  return response.data;
};
```

#### Discover Passes
```typescript
const discoverPasses = async (params: DiscoverPassesParams = {}): Promise<DiscoverPassesResponse> => {
  const queryParams = new URLSearchParams();
  
  // Add query parameters
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.search) queryParams.append('search', params.search);
  if (params.tier) queryParams.append('tier', params.tier);
  
  const url = `/api/v1/passes/discover?${queryParams.toString()}`;
  const response = await api.get(url);
  return response.data;
};
```

### 5. Thumbnail Management (`thumbnail.ts`)

#### Generate AI Thumbnail
```typescript
const generateThumbnailForVideo = async (
  videoId: number,
  options: ThumbnailGenerationOptions = {}
): Promise<ThumbnailGenerationResponse> => {
  return api.post(
    `/api/v1/thumbnails/videos/${videoId}/thumbnail/generate`,
    options,
    { headers: { 'Content-Type': 'application/json' } }
  );
};
```

#### Get Thumbnail Gallery
```typescript
const getThumbnailGallery = async (
  params: ThumbnailGalleryParams = {}
): Promise<ThumbnailGalleryResponse> => {
  const { search, videoId, used, limit = 30, offset = 0 } = params;
  
  const queryParams = new URLSearchParams();
  if (search) queryParams.append('search', search);
  if (videoId) queryParams.append('videoId', videoId.toString());
  
  return api.get(`/api/v1/thumbnails?${queryParams.toString()}`);
};
```

### 6. User Points System (`userPoints.ts`)

#### Fetch User Points
```typescript
const fetchUserPoints = async (userId: string): Promise<UserPointsData> => {
  const response = await api.get(`/api/v1/user/${userId}/points`);
  if (response.data.success) {
    return response.data.data;
  }
  throw new Error('Failed to fetch user points');
};
```

#### Fetch Points History
```typescript
const fetchUserPointsHistory = async (
  userId: string,
  period: '24h' | '7d' | '30d' = '24h'
): Promise<UserPointsHistoryData[]> => {
  return api.get(`/api/v1/user/${userId}/points/history`, {
    params: { period }
  });
};
```

### 7. Search (`search.ts`)

#### Search Videos
```typescript
const searchVideos = async (
  query: string,
  page: number = 1,
  limit: number = 24,
  sort: 'relevance' | 'date' | 'views' = 'relevance'
): Promise<SearchResponse> => {
  const { data } = await api.get(
    `/api/v1/search?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}&sort=${sort}`,
    { withCredentials: true }
  );
  return data;
};
```

### 8. System Monitoring (`monitoring.ts`)

#### Health Checks
```typescript
const monitoringApi = {
  getStorageHealth: (): Promise<StorageHealth> => 
    api.get('/api/v1/monitoring/health/storage'),
  
  getVideoProcessingHealth: (): Promise<VideoProcessingHealth> => 
    api.get('/api/v1/monitoring/health/video-processing'),
  
  getQueueHealth: (): Promise<QueueHealth> => 
    api.get('/api/v1/monitoring/health/queue'),
  
  getAllHealthMetrics: async (): Promise<SystemHealthStatus> => {
    const [storage, videoProcessing, queue] = await Promise.all([
      this.getStorageHealth(),
      this.getVideoProcessingHealth(),
      this.getQueueHealth()
    ]);
    
    return { storage, videoProcessing, queue };
  }
};
```

## ⚠️ Error Handling

### Consistent Error Structure
```typescript
interface ApiError {
  success: false;
  message: string;
  code?: string;
  details?: any;
}
```

### Error Handling Pattern
```typescript
const handleApiError = (error: any, context: string) => {
  console.error(`Failed to fetch ${context}:`, error);
  
  if (error.response) {
    // Server responded with error status
    throw new Error(error.response.data.message || `Server error: ${error.response.status}`);
  } else if (error.request) {
    // Request made but no response
    throw new Error('Network error: No response from server');
  } else {
    // Something else happened
    throw new Error(`Request failed: ${error.message}`);
  }
};
```

### Usage Example
```typescript
try {
  const data = await getChannelWatchHours(channelId, '7d');
  return data;
} catch (error) {
  return handleApiError(error, 'channel watch hours');
}
```

## 🚦 Rate Limiting

### Default Limits
- **General API**: 1000 requests per hour per user
- **Upload endpoints**: 10 requests per minute
- **Analytics endpoints**: 100 requests per hour

### Rate Limit Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## 📝 Examples

### Complete Video Upload Flow
```typescript
// 1. Upload video
const uploadVideo = async (file: File, metadata: VideoMetadata) => {
  const formData = new FormData();
  formData.append('video', file);
  formData.append('title', metadata.title);
  formData.append('description', metadata.description);
  
  const uploadResponse = await api.post('/api/v1/videos/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      const progress = (progressEvent.loaded / progressEvent.total) * 100;
      console.log(`Upload progress: ${progress}%`);
    }
  });
  
  return uploadResponse.data;
};

// 2. Generate thumbnail
const generateThumbnail = async (videoId: number) => {
  return await thumbnailApi.generateThumbnailForVideo(videoId, {
    prompt: 'Create an engaging thumbnail for this video'
  });
};

// 3. Create content pass
const createContentPass = async (videoId: number) => {
  return await passApi.createPass({
    title: 'Premium Content Access',
    price: 0.01, // ETH
    sourceUrls: [`/video/${videoId}`],
    tier: 'premium'
  });
};
```

### Analytics Dashboard Data Fetching
```typescript
const fetchDashboardData = async (channelId: string) => {
  const [
    watchHours,
    engagement,
    videoPerformance,
    demographics
  ] = await Promise.all([
    getChannelWatchHours(channelId, '30d'),
    getEngagementTrends(channelId, '30d'),
    getChannelVideosPerformance(channelId, { limit: 10, sort_by: 'views' }),
    getChannelDemographics(channelId)
  ]);
  
  return {
    watchHours,
    engagement,
    videoPerformance,
    demographics
  };
};
```

## 🐛 Issues & Improvements

### Current Issues:
• **Inconsistent Error Handling**: Some endpoints use different error response formats
• **Missing Request/Response Types**: Several endpoints lack proper TypeScript interfaces
• **Cache Management**: No systematic caching strategy for analytics data
• **Rate Limiting**: Client-side rate limiting not implemented
• **Request Cancellation**: No AbortController usage for long-running requests

### Potential Improvements:
• **Implement Request Interceptors**: Add global error handling and retry logic
• **Add Response Caching**: Implement intelligent caching for analytics and static data
• **Type Safety Enhancement**: Complete TypeScript coverage for all API responses
• **Request Optimization**: Add request deduplication and batching
• **Monitoring Integration**: Add client-side API performance monitoring
• **Offline Support**: Implement offline-first strategy for cached content
• **Real-time Updates**: Add WebSocket connections for live data updates 