import { useEffect, useRef, useCallback } from 'react';
import { useConfig } from '../contexts/ConfigContext';
import { initializeVideoView, updateVideoView } from '../api/video';

interface UseViewTrackingProps {
  videoId: string;
  videoDuration: number;
}

export const useViewTracking = ({ videoId, videoDuration }: UseViewTrackingProps) => {
  const { viewConfig } = useConfig();
  
  const isTrackingRef = useRef(false);
  const watchedDurationRef = useRef(0);
  const viewIdRef = useRef<string | null>(null);
  const hasMetThresholdRef = useRef(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const hasMetViewThreshold = useCallback((duration: number): boolean => {
    if (!viewConfig?.thresholds || !videoDuration) return false;
    
    const percentageWatched = (duration / videoDuration) * 100;
    const { percentage, seconds } = viewConfig.thresholds;
    
    return (
      percentageWatched >= percentage ||  // Met percentage threshold
      duration >= seconds                 // Met seconds threshold
    );
  }, [videoDuration, viewConfig?.thresholds]);

  const isVideoComplete = useCallback((duration: number): boolean => {
    if (!videoDuration) return false;
    const percentageWatched = (duration / videoDuration) * 100;
    const remainingSeconds = videoDuration - duration;
    
    return (
      percentageWatched >= 90 ||    // Over 90% watched
      remainingSeconds <= 15         // Or less than 15s remaining
    );
  }, [videoDuration]);

  const updateView = useCallback(async (force: boolean = false) => {
    if (!isMountedRef.current || !viewIdRef.current || watchedDurationRef.current <= 0) return;
    
    if (!force && updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    const doUpdate = async () => {
      if (!isMountedRef.current) {
        console.log('[useViewTracking] Component unmounted, skipping view update');
        return;
      }

      try {
        const isComplete = isVideoComplete(watchedDurationRef.current);
        await updateVideoView(
          videoId,
          viewIdRef.current!,
          watchedDurationRef.current,
          isComplete
        );
      } catch (error) {
        console.error('Failed to update view:', error);
      }
    };

    if (force) {
      await doUpdate();
    } else {
      updateTimeoutRef.current = setTimeout(doUpdate, viewConfig?.updateInterval || 1000);
    }
  }, [videoId, isVideoComplete, viewConfig?.updateInterval]);

  const initializeView = useCallback(async () => {
    if (!isMountedRef.current || viewIdRef.current) return;
    
    try {
      if (!hasMetThresholdRef.current) {
        console.debug('View threshold not met yet');
        return;
      }

      console.debug('Initializing view with duration:', watchedDurationRef.current);
      const response = await initializeVideoView(videoId, watchedDurationRef.current);
      
      if (!isMountedRef.current) {
        console.log('[useViewTracking] Component unmounted during view initialization');
        return;
      }
      
      if (response.success && response.data.viewId) {
        viewIdRef.current = response.data.viewId;
        void updateView();
      }
    } catch (error) {
      console.error('Failed to initialize view:', error);
    }
  }, [videoId, updateView]);

  const updateWatchedDuration = useCallback((currentTime: number) => {
    if (!isMountedRef.current || !isTrackingRef.current) return;
    
    const validatedTime = Math.min(currentTime, videoDuration);
    
    watchedDurationRef.current = Math.min(
      Math.max(watchedDurationRef.current, validatedTime),
      videoDuration
    );
    
    if (!hasMetThresholdRef.current && hasMetViewThreshold(currentTime)) {
      console.debug('View threshold met, initializing view');
      hasMetThresholdRef.current = true;
      void initializeView();
    }

    if (viewIdRef.current) {
      void updateView();
    }
  }, [hasMetViewThreshold, initializeView, updateView, videoDuration]);

  useEffect(() => {
    isTrackingRef.current = false;
    watchedDurationRef.current = 0;
    viewIdRef.current = null;
    hasMetThresholdRef.current = false;
  }, [videoId]);

  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (hasMetThresholdRef.current && isMountedRef.current) {
        void initializeView();
      }
    };
  }, [initializeView]);

  useEffect(() => {
    if (!viewConfig?.updateInterval) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (isMountedRef.current && 
          isTrackingRef.current && 
          viewIdRef.current && 
          document.visibilityState === 'visible') {
        void updateView();
      } else {
        console.log('[useViewTracking] Skipping periodic update - component unmounted, not tracking, no viewId, or tab hidden');
      }
    }, viewConfig.updateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [updateView, viewConfig?.updateInterval]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!isMountedRef.current) return;

      if (document.visibilityState === 'hidden') {
        console.log('[useViewTracking] Tab hidden, pausing tracking');
        if (isTrackingRef.current && viewIdRef.current) {
          void updateView(true);
        }
      } else {
        console.log('[useViewTracking] Tab visible, resuming tracking');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [updateView]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      console.log('[useViewTracking] Component unmounting, cleaning up');
      isMountedRef.current = false;
      
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return {
    startTracking: useCallback(() => {
      if (isMountedRef.current) {
        isTrackingRef.current = true;
      }
    }, []),

    pauseTracking: useCallback(() => {
      if (isMountedRef.current) {
        isTrackingRef.current = false;
        void updateView(true);
      }
    }, [updateView]),

    updateWatchedDuration,
    
    finalize: useCallback(async () => {
      if (!isMountedRef.current || !viewIdRef.current) return;
      await updateView(true);
    }, [updateView])
  };
};