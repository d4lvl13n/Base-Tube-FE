# Base.Tube Hooks Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Data Fetching Hooks](#data-fetching-hooks)
3. [Authentication Hooks](#authentication-hooks)
4. [Media & Content Hooks](#media--content-hooks)
5. [Analytics Hooks](#analytics-hooks)
6. [Utility Hooks](#utility-hooks)
7. [Best Practices](#best-practices)
8. [Common Patterns](#common-patterns)

## 🎯 Overview

Base.Tube uses a comprehensive set of custom React hooks built on top of React Query for efficient data management, authentication, and application state. All hooks follow consistent patterns for caching, error handling, and loading states.

### Core Libraries
- **React Query**: Data fetching, caching, and synchronization
- **Clerk**: Traditional authentication
- **Wagmi**: Web3/wallet integration
- **React**: Core hooks (useState, useEffect, useCallback, useMemo)

## 📊 Data Fetching Hooks

### 1. Search Hooks (`useSearch.ts`)

#### `useSearch`
Search for videos with caching and pagination support.

```typescript
export const useSearch = (
  query: string,
  page: number = 1,
  limit: number = 24,
  sort: 'relevance' | 'date' | 'views' = 'relevance'
) => {
  return useQuery<SearchResponse>({
    queryKey: ['search', query, page, limit, sort],
    queryFn: () => searchApi.searchVideos(query, page, limit, sort),
    enabled: Boolean(query),
    gcTime: 5 * 60 * 1000, // 5 minutes cache
  });
};
```

**Usage:**
```typescript
const { data, isLoading, error } = useSearch('blockchain videos', 1, 12, 'relevance');
```

### 2. Video Hooks (`useVideoFetch.ts`, `useVideoProgress.ts`)

#### `useVideoFetch`
Fetch individual video details.

```typescript
export const useVideoFetch = (id: string) => {
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Fetch video logic
  }, [id]);

  return { video, loading, error };
};
```

#### `useVideoProgress`
Track video processing progress with real-time polling.

```typescript
export const useVideoProgress = (videoId: number | string) => {
  const { data, isLoading } = useQuery({
    queryKey: ['videoProgress', videoId],
    queryFn: () => getVideoProgress(Number(videoId)),
    refetchInterval: (query) => {
      const status = query.state.data?.data?.status;
      return status === 'processing' ? 2000 : false; // Poll every 2s when processing
    },
    enabled: Boolean(videoId),
  });

  return {
    progress: data?.data || defaultProgress,
    isProcessing: data?.data?.status === 'processing',
    isLoading,
  };
};
```

### 3. Channel Hooks (`useChannelData.ts`, `useChannels.ts`)

#### `useChannelData`
Fetch channel information with subscription management.

```typescript
export const useChannelData = (identifier?: number | string | null) => {
  const queryClient = useQueryClient();
  
  const query = useQuery<Channel>({
    queryKey: ['channel', identifier],
    queryFn: async () => {
      if (typeof identifier === 'string') {
        return getChannelByHandle(identifier);
      }
      return getChannelById(identifier as number);
    },
    enabled: identifier !== null && identifier !== undefined,
  });

  const updateSubscriptionStatus = (newStatus: boolean) => {
    queryClient.setQueryData(['channel', identifier], (oldData: Channel) => ({
      ...oldData,
      isSubscribed: newStatus,
      subscribers_count: newStatus 
        ? (oldData.subscribers_count || 0) + 1 
        : (oldData.subscribers_count || 1) - 1,
    }));
  };

  return { channel: query.data, updateSubscriptionStatus, ...query };
};
```

## 🔐 Authentication Hooks

### 1. Current User (`useCurrentUser.ts`)

#### `useCurrentUser`
Get current authenticated user with profile data.

```typescript
export const useCurrentUser = () => {
  const { user, isSignedIn, isLoaded } = useUser(); // Clerk
  const { session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (isSignedIn) {
      getMyProfile()
        .then(setProfile)
        .catch(console.error);
    }
  }, [isSignedIn]);

  return { user, isSignedIn, isLoaded, profile, session };
};
```

### 2. Web3 Authentication (`useWeb3Auth.ts`)

#### `useWeb3Auth`
Handle Web3 wallet authentication and connection.

```typescript
// Comprehensive Web3 authentication hook with wallet management
export const useWeb3Auth = () => {
  const { isConnected, address } = useAccount();
  const [user, setUser] = useState<Web3User | null>(null);
  
  return {
    isAuthenticated: isConnected && !!user,
    user,
    address,
    login: connectWallet,
    logout: disconnectWallet,
  };
};
```

### 3. Wallet Linking (`useLinkWallet.ts`)

#### `useLinkWallet`
Link traditional accounts with Web3 wallets.

```typescript
export const useLinkWallet = () => {
  const [modalState, setModalState] = useState<ModalState>({
    type: null,
    message: null
  });
  
  const linkWallet = useCallback(async (address: string) => {
    try {
      await web3AuthApi.linkWallet(address);
      setModalState({
        type: 'success',
        message: 'Wallet linked successfully!'
      });
    } catch (error) {
      setModalState({
        type: 'error',
        message: 'Failed to link wallet'
      });
    }
  }, []);

  return { linkWallet, modalState, setModalState };
};
```

## 🎬 Media & Content Hooks

### 1. Content Passes (`usePass.ts`)

#### `usePassDetails`
Fetch pass details with caching.

```typescript
export const usePassDetails = (
  identifier?: string | null,
  options: { enabled?: boolean } = {}
) => {
  return useQuery<Pass, Error>({
    queryKey: ['pass', identifier],
    queryFn: () => passApi.getPassDetails(identifier!),
    enabled: options.enabled && Boolean(identifier),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
```

#### `useCheckout`
Handle checkout process for content passes.

```typescript
export const useCheckout = () => {
  const queryClient = useQueryClient();
  
  return useMutation<CheckoutSessionResponse, Error, string>({
    mutationFn: (passId: string) => passApi.createCheckoutSession(passId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pass'] });
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });
};
```

#### `useCheckoutStatus`
Poll checkout session status with automatic polling.

```typescript
export const useCheckoutStatus = (
  sessionId?: string | null,
  options: {
    pollingInterval?: number;
    maxAttempts?: number;
  } = {}
) => {
  const { pollingInterval = 2000, maxAttempts = 30 } = options;
  
  return useQuery<PurchaseStatus, Error>({
    queryKey: ['checkout-status', sessionId],
    queryFn: () => passApi.getCheckoutStatus(sessionId!),
    enabled: Boolean(sessionId),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && ['completed', 'expired'].includes(data.status)) {
        return false; // Stop polling
      }
      return pollingInterval;
    },
    retry: maxAttempts,
    staleTime: 0,
  });
};
```

### 2. Comments (`useComments.ts`)

#### `useComments`
Manage video comments with real-time updates.

```typescript
export const useComments = ({ 
  videoId, 
  initialLimit = 30, 
  sortBy = 'latest' 
}: UseCommentsProps) => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  
  const { data, isLoading, error } = useQuery<CommentsResponse>({
    queryKey: ['comments', videoId, sortBy],
    queryFn: async () => {
      const response = await commentsApi.getVideoComments(videoId, 1, initialLimit, sortBy);
      return {
        ...response,
        comments: structureComments(response.comments)
      };
    },
    staleTime: 1000 * 60, // 1 minute
    enabled: !!videoId,
  });

  const canModifyComment = useCallback((comment: Comment) => 
    user?.id === comment.commenter?.id, [user]);

  return {
    comments: data?.comments || [],
    isLoading,
    error,
    canModifyComment,
  };
};
```

### 3. AI Thumbnails (`useAIthumbnail.ts`)

#### `useAIthumbnail`
Generate AI-powered thumbnails with multiple options.

```typescript
export const useAIthumbnail = () => {
  const queryClient = useQueryClient();
  
  const videoMutation = useMutation({
    mutationFn: ({ videoId, options }: { 
      videoId: number, 
      options?: ThumbnailGenerationOptions 
    }) => thumbnailApi.generateThumbnailForVideo(videoId, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video'] });
      queryClient.invalidateQueries({ queryKey: ['thumbnailGallery'] });
    },
  });
  
  const promptMutation = useMutation({
    mutationFn: (options: CustomThumbnailGenerationOptions) => 
      thumbnailApi.generateThumbnailFromPrompt(options),
  });

  return {
    generateForVideo: (videoId: number, options?: ThumbnailGenerationOptions) =>
      videoMutation.mutateAsync({ videoId, options }),
    generateFromPrompt: promptMutation.mutateAsync,
    isGeneratingForVideo: videoMutation.isPending,
    isGeneratingFromPrompt: promptMutation.isPending,
  };
};
```

## 📈 Analytics Hooks

### 1. Analytics Data (`useAnalyticsData.ts`)

#### `useAnalyticsContext`
Comprehensive analytics data management.

```typescript
export const useAnalyticsContext = () => {
  const [timeframe, setTimeframe] = useState<'7d' | '30d'>('7d');
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  
  // Pre-fetch analytics data
  const prefetchCreatorAnalytics = useCallback(async (period: '7d' | '30d') => {
    if (!selectedChannelId) return;
    
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: ['channelWatchHours', selectedChannelId, period],
        queryFn: () => getChannelWatchHours(selectedChannelId, period),
      }),
      queryClient.prefetchQuery({
        queryKey: ['engagementTrends', selectedChannelId, period],
        queryFn: () => getEngagementTrends(selectedChannelId, period),
      }),
    ]);
  }, [selectedChannelId, queryClient]);

  return {
    timeframe,
    setTimeframe,
    selectedChannelId,
    setSelectedChannelId,
    prefetchCreatorAnalytics,
  };
};
```

### 2. User Points (`useUserPoints.ts`)

#### `useUserPoints`
Track user points and ranking with real-time updates.

```typescript
export const useUserPoints = () => {
  const { user: clerkUser } = useUser();
  const { user: web3User, isAuthenticated } = useAuth();
  
  const userId = isAuthenticated ? web3User?.id : clerkUser?.id;

  return useQuery<UserPointsData>({
    queryKey: ['userPoints', userId],
    queryFn: () => fetchUserPoints(userId!),
    enabled: !!userId,
    refetchInterval: 60000, // Refresh every minute
    select: (data) => ({
      ...data,
      progressToNextRank: data.rank.nextRankPoints 
        ? Math.min(
            ((data.totalPoints - data.rank.minPoints) /
            (data.rank.nextRankPoints - data.rank.minPoints)) * 100,
            100
          )
        : 100,
    }),
  });
};
```

## 🛠️ Utility Hooks

### 1. Local Storage (`useLocalStorage.ts`)

#### `useLocalStorage`
Persistent state management with localStorage.

```typescript
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}
```

**Usage:**
```typescript
const [theme, setTheme] = useLocalStorage('theme', 'dark');
const [preferences, setPreferences] = useLocalStorage('userPrefs', {
  notifications: true,
  autoplay: false
});
```

### 2. Window Size (`useWindowSize.ts`)

#### `useWindowSize`
Responsive design hook for window dimensions.

```typescript
export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial size
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};
```

### 3. Generic Data Fetching (`useFetchData.ts`)

#### `useFetchData`
Generic hook for any API call with consistent error handling.

```typescript
function useFetchData<T>({ apiCall }: { apiCall: () => Promise<T> }) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await apiCall();
      setData(result);
      setError(null);
    } catch (err: any) {
      setError('An error occurred while fetching data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
}
```

## 🎯 Best Practices

### 1. Query Key Structure
Use consistent, hierarchical query keys:

```typescript
// Good
['videos', 'featured']
['channel', channelId, 'analytics', period]
['user', userId, 'points', 'history']

// Avoid
['getVideos']
['channelData']
['userStuff']
```

### 2. Error Handling Pattern
Implement consistent error handling:

```typescript
const { data, error, isLoading } = useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
  onError: (error) => {
    console.error('Failed to fetch data:', error);
    // Show user-friendly error message
  },
  retry: 2,
  retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
});
```

### 3. Optimistic Updates
Use optimistic updates for better UX:

```typescript
const mutation = useMutation({
  mutationFn: updateData,
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey });
    const previousData = queryClient.getQueryData(queryKey);
    
    queryClient.setQueryData(queryKey, newData);
    return { previousData };
  },
  onError: (err, newData, context) => {
    queryClient.setQueryData(queryKey, context?.previousData);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey });
  },
});
```

### 4. Conditional Fetching
Enable queries conditionally:

```typescript
const { data } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
  enabled: !!userId && isAuthenticated,
});
```

## 🔄 Common Patterns

### 1. Infinite Scroll
```typescript
const useInfiniteData = (queryKey: string[], fetchFn: Function) => {
  return useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 1 }) => fetchFn(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.hasNext ? lastPage.nextPage : undefined,
  });
};
```

### 2. Real-time Polling
```typescript
const useRealtimeData = (queryKey: string[], fetchFn: Function, condition: boolean) => {
  return useQuery({
    queryKey,
    queryFn: fetchFn,
    refetchInterval: condition ? 1000 : false,
    refetchIntervalInBackground: true,
  });
};
```

### 3. Dependent Queries
```typescript
const useUserPosts = (userId?: string) => {
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId!),
    enabled: !!userId,
  });

  const { data: posts } = useQuery({
    queryKey: ['posts', user?.id],
    queryFn: () => fetchUserPosts(user!.id),
    enabled: !!user,
  });

  return { user, posts };
};
```

## 🐛 Issues & Improvements

### Current Issues:
• **Mixed State Management**: Some hooks use useState while others use React Query - inconsistent pattern
• **Error Boundaries**: Not all hooks integrate with error boundaries properly
• **Type Safety**: Some hooks lack proper TypeScript generics and type constraints
• **Memory Leaks**: Missing cleanup in some useEffect hooks
• **Polling Performance**: Some hooks poll unnecessarily when component unmounts

### Potential Improvements:
• **Standardize on React Query**: Move all data fetching to React Query for consistency
• **Add Error Boundaries**: Implement error boundary integration for all data hooks
• **Improve TypeScript**: Add proper generics and type constraints throughout
• **Add Suspense Support**: Implement React Suspense for better loading states
• **Optimize Polling**: Add proper cleanup and conditional polling based on visibility
• **Add Offline Support**: Implement offline-first capabilities with service workers
• **Performance Monitoring**: Add hook performance tracking and optimization
• **Custom Hook Composition**: Create higher-order hooks for common patterns
``` 