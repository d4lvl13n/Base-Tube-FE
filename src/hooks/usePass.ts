import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { passApi } from '../api/pass';
import type { 
  Pass, 
  CheckoutSessionResponse, 
  PurchaseStatus,
  DiscoverPassesParams,
  DiscoverPassesResponse,
  CreatePassRequest,
  AddVideoRequest
} from '../types/pass';

/**
 * Fetch pass details based on slug or id
 */
export const usePassDetails = (
  identifier?: string | null,
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;
  return useQuery<Pass, Error>({
    queryKey: ['pass', identifier],
    queryFn: () => {
      if (!identifier) throw new Error('Pass identifier is required');
      return passApi.getPassDetails(identifier);
    },
    enabled: enabled && Boolean(identifier),
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Hook to create checkout session and redirect user
 */
export const useCheckout = () => {
  const queryClient = useQueryClient();
  return useMutation<CheckoutSessionResponse, Error, string, unknown>({
    mutationFn: (passId: string) => passApi.createCheckoutSession(passId),
    onSuccess: (data: CheckoutSessionResponse) => {
      queryClient.invalidateQueries({ queryKey: ['pass'] });
      queryClient.invalidateQueries({ queryKey: ['purchased-passes'] });
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });
};

/**
 * Hook to fetch signed video url with access checks
 */
export const useSignedVideoUrl = (videoId?: string | null, enabled = true) => {
  return useQuery<string, Error>({
    queryKey: ['signed-url', videoId],
    queryFn: () => {
      if (!videoId) throw new Error('videoId missing');
      return passApi.getSignedVideoUrl(videoId);
    },
    enabled: enabled && Boolean(videoId),
    retry: (failureCount, error) => {
      // Retry for 403 up to 3 times
      if ((error as any).response?.status === 403 && failureCount < 3) return true;
      return false;
    },
    staleTime: 0,
  });
};

/**
 * Hook to list all passes purchased by the current user
 * Requires authentication
 */
export const usePurchasedPasses = () => {
  return useQuery<Pass[], Error>({
    queryKey: ['purchased-passes'],
    queryFn: () => passApi.getPurchasedPasses(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to check and poll Stripe checkout session status
 * @param sessionId Stripe checkout session ID
 * @param options Optional configuration
 */
export const useCheckoutStatus = (
  sessionId?: string | null,
  options: {
    enabled?: boolean;
    pollingInterval?: number;
    maxAttempts?: number;
  } = {}
) => {
  const {
    enabled = true,
    pollingInterval = 2000, // 2 seconds
    maxAttempts = 30        // 1 minute max polling time
  } = options;
  
  const queryClient = useQueryClient();
  
  return useQuery<PurchaseStatus, Error>({
    queryKey: ['checkout-status', sessionId],
    queryFn: () => {
      if (!sessionId) throw new Error('Session ID is required');
      return passApi.getCheckoutStatus(sessionId);
    },
    enabled: enabled && Boolean(sessionId),
    refetchInterval: (query) => {
      // Stop polling when we have enough info to proceed, or if the session expired
      const data = query.state.data as PurchaseStatus | undefined;
      if (!data) return pollingInterval;
      if (data.status === 'expired') return false;
      // Backend returns purchase_id (or pass_id) when webhook finishes; stop then
      if (data.purchase_id || (data as any).pass_id) return false;
      return pollingInterval;
    },
    refetchIntervalInBackground: true,
    retry: maxAttempts,
    staleTime: 0, // Always refetch
  });
};

/**
 * Hook to discover available passes with filtering and pagination
 * @param params - Discovery parameters and filters
 * @returns InfiniteQuery result for paginated pass discovery
 */
export const usePassDiscover = (params: DiscoverPassesParams = {}, options: { enabled?: boolean } = {}) => {
  const { limit = 24, ...otherParams } = params;
  const { enabled = true } = options;
  
  return useInfiniteQuery<DiscoverPassesResponse, Error>({
    queryKey: ['passes-discover', otherParams],
    queryFn: ({ pageParam = 0 }) => {
      return passApi.discoverPasses({
        ...otherParams,
        limit,
        offset: pageParam as number
      });
    },
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage;
      
      // If we've loaded all items, return undefined to stop further loading
      if (pagination.offset + pagination.limit >= pagination.total) {
        return undefined;
      }
      
      // Otherwise, return the next offset
      return pagination.offset + pagination.limit;
    },
    initialPageParam: 0,
    enabled
  });
};

/**
 * Hook to create a new pass for monetization
 * 
 * @example
 * // For a single video
 * createPass({
 *   title: "My Pass",
 *   price_cents: 500,
 *   src_url: "https://youtu.be/abcdef"
 * })
 * 
 * // For multiple videos
 * createPass({
 *   title: "My Multi-Video Pass",
 *   price_cents: 500,
 *   videos: ["https://youtu.be/video1", "https://youtu.be/video2"]
 * })
 */
export const useCreatePass = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Pass, Error, CreatePassRequest>({
    mutationFn: (data: CreatePassRequest) => passApi.createPass(data),
    onSuccess: (data) => {
      // Invalidate creator passes query to refetch the list
      queryClient.invalidateQueries({ queryKey: ['creator-passes'] });
      
      // Add the new pass to the creator passes cache
      queryClient.setQueryData<Pass[]>(['creator-passes'], (oldData) => {
        return oldData ? [...oldData, data] : [data];
      });
    },
  });
};

/**
 * Hook to fetch all passes created by the current user
 * Requires authentication
 */
export const useCreatorPasses = () => {
  return useQuery<Pass[], Error>({
    queryKey: ['creator-passes'],
    queryFn: () => passApi.getCreatorPasses(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to add a new video to an existing pass
 */
export const useAddVideoToPass = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Pass, Error, { passId: string; data: AddVideoRequest }>({
    mutationFn: ({ passId, data }) => passApi.addVideoToPass(passId, data),
    onSuccess: (updatedPass) => {
      // Invalidate specific pass data
      queryClient.invalidateQueries({ queryKey: ['pass', updatedPass.id] });
      
      // Invalidate creator passes query to refetch the list
      queryClient.invalidateQueries({ queryKey: ['creator-passes'] });
      
      // Update the specific pass cache with the new version
      queryClient.setQueryData(['pass', updatedPass.id], updatedPass);
    },
  });
}; 