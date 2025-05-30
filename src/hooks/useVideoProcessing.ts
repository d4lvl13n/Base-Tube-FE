import { useState, useEffect, useCallback, useRef } from 'react';
import { getVideoProgress, VideoProgressData } from '../api/video';

export interface ProcessingVideo extends VideoProgressData {
  videoId: number;
}

export const useVideoProcessing = (videoIds: number[]) => {
  const [processingVideos, setProcessingVideos] = useState<Record<number, ProcessingVideo>>({});
  const [isPolling, setIsPolling] = useState(false);
  const isMountedRef = useRef<boolean>(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Keep a mutable ref to always have the latest processingVideos inside callbacks without causing re-subscriptions
  const processingVideosRef = useRef(processingVideos);
  useEffect(() => {
    processingVideosRef.current = processingVideos;
  }, [processingVideos]);

  const clearPollingInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const checkProgress = useCallback(async () => {
    // MEMORY LEAK FIX: Don't proceed if component unmounted or tab hidden
    if (!isMountedRef.current) {
      console.log('[useVideoProcessing] Component unmounted, stopping progress check');
      return;
    }

    if (document.visibilityState === 'hidden') {
      console.log('[useVideoProcessing] Tab hidden, skipping progress check');
      return;
    }

    try {
      const incompleteVideos = videoIds.filter(id => {
        const video = processingVideosRef.current[id];
        return !video || video.status === 'pending' || video.status === 'processing';
      });

      if (incompleteVideos.length === 0) {
        if (isMountedRef.current) {
          setIsPolling(false);
        }
        return;
      }

      const updates = await Promise.all(
        incompleteVideos.map(async (id) => {
          try {
            const response = await getVideoProgress(id);
            return {
              videoId: id,
              ...response.data
            } satisfies ProcessingVideo;
          } catch (error) {
            console.error(`Error fetching progress for video ${id}:`, error);
            return null;
          }
        })
      );

      // MEMORY LEAK FIX: Only update state if component is still mounted
      if (!isMountedRef.current) {
        console.log('[useVideoProcessing] Component unmounted during API call, discarding results');
        return;
      }

      const validUpdates = updates.filter((update): update is ProcessingVideo => update !== null);

      if (validUpdates.length > 0) {
        setProcessingVideos(prev => ({
          ...prev,
          ...Object.fromEntries(validUpdates.map(update => [update.videoId, update]))
        }));
      }

      // Stop polling if no videos are still processing
      if (!validUpdates.some(video => video.status === 'pending' || video.status === 'processing')) {
        if (isMountedRef.current) {
          setIsPolling(false);
        }
      }
    } catch (error) {
      console.error('Error checking video progress:', error);
      if (isMountedRef.current) {
        setIsPolling(false);
      }
    }
  }, [videoIds]);

  // Start polling only when we have untracked videos
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    const untrackedVideos = videoIds.filter(id => !processingVideosRef.current[id]);
    if (untrackedVideos.length > 0) {
      setIsPolling(true);
    }
  }, [videoIds]);

  // Handle polling with visibility and mount checks
  useEffect(() => {
    if (!isPolling || !isMountedRef.current) {
      clearPollingInterval();
      return;
    }

    // MEMORY LEAK FIX: Don't start polling if tab is hidden
    if (document.visibilityState === 'hidden') {
      console.log('[useVideoProcessing] Tab hidden, deferring polling start');
      clearPollingInterval();
      return;
    }

    console.log('[useVideoProcessing] Starting polling interval');
    checkProgress(); // Initial check
    
    intervalRef.current = setInterval(() => {
      // Double-check visibility and mount status on each interval
      if (isMountedRef.current && document.visibilityState === 'visible') {
        checkProgress();
      } else {
        console.log('[useVideoProcessing] Skipping interval - component unmounted or tab hidden');
      }
    }, 5000);

    return () => {
      console.log('[useVideoProcessing] Cleaning up polling interval');
      clearPollingInterval();
    };
  }, [isPolling, checkProgress, clearPollingInterval]);

  // MEMORY LEAK FIX: Handle visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!isMountedRef.current) return;

      if (document.visibilityState === 'hidden') {
        console.log('[useVideoProcessing] Tab hidden, stopping polling');
        clearPollingInterval();
      } else if (document.visibilityState === 'visible' && isPolling) {
        console.log('[useVideoProcessing] Tab visible, resuming polling');
        // Restart polling when tab becomes visible
        checkProgress();
        if (!intervalRef.current) {
          intervalRef.current = setInterval(() => {
            if (isMountedRef.current && document.visibilityState === 'visible') {
              checkProgress();
            }
          }, 5000);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPolling, checkProgress, clearPollingInterval]);

  // MEMORY LEAK FIX: Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      console.log('[useVideoProcessing] Component unmounting, cleaning up');
      isMountedRef.current = false;
      clearPollingInterval();
      setIsPolling(false);
    };
  }, [clearPollingInterval]);

  return { processingVideos };
}; 