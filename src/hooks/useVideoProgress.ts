import { useState, useEffect } from 'react';
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

  const { 
    data: progressResponse, 
    error,
    isLoading 
  } = useQuery<ProgressResponse, Error, ProgressResponse, [string, number | string]>({
    queryKey: ['videoProgress', videoId],
    queryFn: () => getVideoProgress(Number(videoId)) as Promise<ProgressResponse>,
    enabled: Boolean(videoId),
    refetchInterval: (query) => {
      const status = query.state.data?.data?.status;
      
      // Check if any video is processing
      const isAnyVideoProcessing = status === 'processing' || status === 'pending';
      setIsProcessing(isAnyVideoProcessing);

      // Only poll if there are videos processing
      return isAnyVideoProcessing ? POLLING_INTERVAL : false;
    },
    refetchOnMount: true,
    retry: MAX_RETRIES,
    retryDelay: RETRY_DELAY,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });

  useEffect(() => {
    const status = progressResponse?.data?.status;
    setIsProcessing(status === 'processing');
    
    return () => setIsProcessing(false);
  }, [progressResponse?.data?.status]);

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