import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getVideoProgress } from '../api/video';
import type { ProgressResponse, VideoProgress, VideoStatus } from '../types/video';

const POLLING_INTERVAL = 2000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const STALE_TIME = 1000;
const CACHE_TIME = 5 * 60 * 1000;

interface UseVideoProgressReturn {
  progress: VideoProgress;
  isProcessing: boolean;
  error: Error | null;
  isError: boolean;
  isLoading: boolean;
}

export const useVideoProgress = (videoId: number | string): UseVideoProgressReturn => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const isMountedRef = useRef<boolean>(true);

  const { 
    data: progressResponse, 
    error,
    isLoading 
  } = useQuery<ProgressResponse, Error, ProgressResponse, [string, number | string]>({
    queryKey: ['videoProgress', videoId],
    queryFn: () => getVideoProgress(Number(videoId)) as Promise<ProgressResponse>,
    enabled: Boolean(videoId),
    refetchInterval: (query) => {
      // MEMORY LEAK FIX: Check if component is mounted and tab is visible
      if (!isMountedRef.current) {
        console.log('[useVideoProgress] Component unmounted, stopping polling');
        return false;
      }

      if (document.visibilityState === 'hidden') {
        console.log('[useVideoProgress] Tab hidden, pausing polling');
        return false;
      }

      const status = query.state.data?.data?.status;
      const isAnyVideoProcessing = status === 'processing' || status === 'pending';
      
      // Only update state if component is still mounted
      if (isMountedRef.current) {
      setIsProcessing(isAnyVideoProcessing);
      }

      // Only poll if:
      // 1. Component is mounted
      // 2. Tab is visible  
      // 3. Video is processing
      return isAnyVideoProcessing && isMountedRef.current && document.visibilityState === 'visible' 
        ? POLLING_INTERVAL 
        : false;
    },
    refetchOnMount: true,
    retry: MAX_RETRIES,
    retryDelay: RETRY_DELAY,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });

  // Handle status updates with mount check
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    const status = progressResponse?.data?.status;
    setIsProcessing(status === 'processing');
    
    return () => {
      if (isMountedRef.current) {
        setIsProcessing(false);
      }
    };
  }, [progressResponse?.data?.status]);

  // MEMORY LEAK FIX: Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      console.log('[useVideoProgress] Component unmounting, cleaning up');
      isMountedRef.current = false;
      setIsProcessing(false);
    };
  }, []);

  // MEMORY LEAK FIX: Handle visibility change events
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!isMountedRef.current) return;
      
      if (document.visibilityState === 'hidden') {
        console.log('[useVideoProgress] Tab hidden, will pause polling');
      } else {
        console.log('[useVideoProgress] Tab visible, will resume polling if needed');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const defaultProgress: VideoProgress = {
    videoId: Number(videoId),
    percent: 0,
    status: 'pending' as VideoStatus,
    currentQuality: undefined,
    totalQualities: undefined,
    currentQualityIndex: undefined
  };

  const progress: VideoProgress = progressResponse?.data ? {
    videoId: Number(videoId),
    percent: progressResponse.data.progress?.percent ?? 0,
    status: progressResponse.data.status,
    currentQuality: progressResponse.data.progress?.currentQuality,
    totalQualities: progressResponse.data.progress?.totalQualities,
    currentQualityIndex: progressResponse.data.progress?.currentQualityIndex
  } : defaultProgress;

  return {
    progress,
    isProcessing,
    error,
    isError: Boolean(error),
    isLoading
  };
};