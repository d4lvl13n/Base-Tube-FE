# Data Fetching Guidelines

## 🎯 Overview

This document outlines the standardized patterns for data fetching in Base.Tube using React Query. All data fetching should follow these guidelines to ensure consistency, performance, and maintainability.

## 📋 Table of Contents
1. [React Query Migration Standards](#react-query-migration-standards)
2. [Query Key Patterns](#query-key-patterns)
3. [Hook Naming Conventions](#hook-naming-conventions)
4. [Error Handling](#error-handling)
5. [Cache Configuration](#cache-configuration)
6. [Query Invalidation](#query-invalidation)
7. [Examples](#examples)

## 🚀 React Query Migration Standards

### ✅ **DO: Use React Query for Data Fetching**
```typescript
// ✅ Good: React Query pattern
export const useVideoFetch = (id: string) => {
  return useQuery({
    queryKey: queryKeys.video.byId(id),
    queryFn: async () => {
      const response = await getVideoById(id);
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
```

### ❌ **DON'T: Use useState for Data Fetching**
```typescript
// ❌ Avoid: Manual useState pattern
export const useVideoFetch = (id: string) => {
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Manual fetching logic
  }, [id]);

  return { video, loading, error };
};
```

## 🔑 Query Key Patterns

### Import Standardized Query Keys
```typescript
import { queryKeys } from '../utils/queryKeys';
```

### Hierarchical Key Structure
Follow the established hierarchy: `['entity', 'operation', ...params]`

```typescript
// User queries
queryKeys.user.all              // ['user']
queryKeys.user.profile(userId)  // ['user', 'profile', userId]
queryKeys.user.wallet()         // ['user', 'wallet']

// Video queries
queryKeys.video.byId(id)        // ['video', id]
queryKeys.videos.trending(timeFrame) // ['videos', 'trending', timeFrame]

// Channel queries
queryKeys.channel.byId(id)      // ['channel', id]
queryKeys.channel.analytics(id, period) // ['channel', 'analytics', id, period]
```

## 📝 Hook Naming Conventions

### Single Resource Hooks
- Pattern: `use{EntityName}` (e.g., `useVideo`, `useUser`)
- Returns: React Query result with `data`, `isLoading`, `error`

### List/Collection Hooks  
- Pattern: `use{EntityName}s` (e.g., `useVideos`, `useChannels`)
- For pagination: `use{EntityName}List` with infinite query

### Action Hooks
- Pattern: `use{Action}{EntityName}` (e.g., `useCreateVideo`, `useUpdateUser`)
- Use `useMutation` for data modifications

## 🛡️ Error Handling

### Consistent Retry Strategy
```typescript
retry: (failureCount, error: any) => {
  // Don't retry on 404 (not found)
  if (error?.status === 404 || error?.response?.status === 404) {
    return false;
  }
  
  // Don't retry on auth errors
  if (error?.status === 401 || error?.status === 403 || 
      error?.response?.status === 401 || error?.response?.status === 403) {
    return false;
  }
  
  return failureCount < 2; // Max 2 retries
},
```

### Error Logging
```typescript
// Log errors in retry function for debugging
retry: (failureCount, error: any) => {
  console.error(`Query failed (attempt ${failureCount + 1}):`, error);
  return shouldRetry(error, failureCount);
},
```

## ⚡ Cache Configuration

### Stale Time Guidelines
Choose appropriate stale times based on data volatility:

```typescript
// Static/rarely changing data: 10+ minutes
staleTime: 10 * 60 * 1000, // User profile, video metadata

// Semi-static data: 5 minutes  
staleTime: 5 * 60 * 1000,  // Video details, channel info

// Dynamic data: 2 minutes
staleTime: 2 * 60 * 1000,  // Trending videos, analytics

// Real-time data: 30 seconds
staleTime: 30 * 1000,      // Wallet balance, live metrics
```

### Garbage Collection Time
```typescript
// Standard: 5-10 minutes
gcTime: 5 * 60 * 1000,     // Most queries

// Financial data: Shorter cache
gcTime: 2 * 60 * 1000,     // Wallet, payment data

// Large datasets: Longer cache  
gcTime: 15 * 60 * 1000,    // Video lists, search results
```

## 🔄 Query Invalidation

### Use Invalidation Helpers
```typescript
import { invalidationHelpers } from '../utils/queryKeys';
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

// Invalidate user data after profile update
invalidationHelpers.invalidateUser(queryClient, userId);

// Invalidate video lists after upload
invalidationHelpers.invalidateVideoLists(queryClient);

// Invalidate specific channel data
invalidationHelpers.invalidateChannel(queryClient, channelId);
```

### Manual Invalidation
```typescript
// Invalidate specific query
queryClient.invalidateQueries({ 
  queryKey: queryKeys.video.byId(videoId) 
});

// Invalidate all queries of a type
queryClient.invalidateQueries({ 
  queryKey: queryKeys.videos.all 
});
```

## 📚 Examples

### Simple Data Fetching Hook
```typescript
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../utils/queryKeys';
import { getUserProfile } from '../api/user';

export const useUserProfile = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.user.profile(userId),
    queryFn: async () => {
      const response = await getUserProfile(userId);
      return response.data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.status === 404) return false;
      return failureCount < 2;
    },
  });
};
```

### Infinite Query for Pagination
```typescript
import { useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '../utils/queryKeys';

interface PageData {
  items: Video[];
  hasMore: boolean;
  total: number;
}

export const useVideoList = (params: GetVideosParams) => {
  const infiniteQuery = useInfiniteQuery<PageData>({
    queryKey: queryKeys.videos.byChannel(params.channelId, params),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await getVideos({ ...params, page: pageParam });
      return {
        items: response.data,
        hasMore: response.hasMore,
        total: response.total,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length + 1 : undefined;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Flatten paginated data
  const items = infiniteQuery.data?.pages.flatMap(page => page.items) || [];
  const total = infiniteQuery.data?.pages?.[0]?.total || 0;

  return {
    items,
    total,
    isLoading: infiniteQuery.isLoading,
    error: infiniteQuery.error,
    hasMore: infiniteQuery.hasNextPage,
    loadMore: infiniteQuery.fetchNextPage,
    refresh: infiniteQuery.refetch,
  };
};
```

### Mutation Hook
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, invalidationHelpers } from '../utils/queryKeys';

export const useCreateVideo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoData: CreateVideoData) => {
      const response = await createVideo(videoData);
      return response.data;
    },
    onSuccess: (newVideo, variables) => {
      // Invalidate relevant queries
      invalidationHelpers.invalidateVideoLists(queryClient);
      invalidationHelpers.invalidateChannel(queryClient, variables.channelId);
      
      // Optionally add to cache
      queryClient.setQueryData(
        queryKeys.video.byId(newVideo.id),
        newVideo
      );
    },
    onError: (error) => {
      console.error('Failed to create video:', error);
    },
  });
};
```

## 🔧 Migration Checklist

When migrating a hook from useState to React Query:

- [ ] Import `useQuery` or `useInfiniteQuery` from `@tanstack/react-query`
- [ ] Import `queryKeys` from `../utils/queryKeys`
- [ ] Replace useState/useEffect with appropriate React Query hook
- [ ] Use standardized query key from `queryKeys`
- [ ] Configure appropriate `staleTime` and `gcTime`
- [ ] Add error handling with retry logic
- [ ] Update consuming components for new interface
- [ ] Test error scenarios and loading states
- [ ] Verify cache invalidation works correctly

## 🎯 Performance Tips

1. **Use `enabled` option** for conditional queries
2. **Set appropriate stale times** to reduce unnecessary requests
3. **Implement proper error boundaries** for query failures
4. **Use React Query DevTools** for debugging
5. **Consider prefetching** for predictable user flows
6. **Implement proper loading states** for better UX

## 🚨 Common Pitfalls to Avoid

- ❌ Don't use React Query for non-server state (use useState/useReducer)
- ❌ Don't put functions or non-serializable data in query keys
- ❌ Don't ignore error handling
- ❌ Don't set stale time too low (causes excessive requests)
- ❌ Don't forget to invalidate related queries after mutations
- ❌ Don't use React Query for immediate/synchronous operations 