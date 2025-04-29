import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { passApi } from '../api/pass';
import type { Pass, CheckoutSessionResponse, PurchaseStatus } from '../types/pass';

/**
 * Fetch pass details based on slug or id
 */
export const usePassDetails = (identifier?: string | null) => {
  return useQuery<Pass, Error>({
    queryKey: ['pass', identifier],
    queryFn: () => {
      if (!identifier) throw new Error('Pass identifier is required');
      return passApi.getPassDetails(identifier);
    },
    enabled: Boolean(identifier),
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
      // Stop polling if we get a final status
      if (query.state.data && ['completed', 'expired'].includes(query.state.data.status)) {
        return false;
      }
      return pollingInterval;
    },
    refetchIntervalInBackground: true,
    retry: maxAttempts,
    staleTime: 0, // Always refetch
  });
}; 