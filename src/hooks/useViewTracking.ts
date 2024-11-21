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
    if (!viewIdRef.current || watchedDurationRef.current <= 0) return;
    
    if (!force && updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    const doUpdate = async () => {
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
    if (viewIdRef.current) return;
    
    try {
      if (!hasMetThresholdRef.current) {
        console.debug('View threshold not met yet');
        return;
      }

      console.debug('Initializing view with duration:', watchedDurationRef.current);
      const response = await initializeVideoView(videoId, watchedDurationRef.current);
      
      if (response.success && response.data.viewId) {
        viewIdRef.current = response.data.viewId;
        void updateView(); // Start periodic updates once we have a viewId
      }
    } catch (error) {
      console.error('Failed to initialize view:', error);
    }
  }, [videoId, updateView]);

  const updateWatchedDuration = useCallback((currentTime: number) => {
    if (!isTrackingRef.current) return;
    
    watchedDurationRef.current = Math.max(watchedDurationRef.current, currentTime);
    
    // Check if we've met the threshold
    if (!hasMetThresholdRef.current && hasMetViewThreshold(currentTime)) {
      console.debug('View threshold met, initializing view');
      hasMetThresholdRef.current = true;
      void initializeView();
    }

    // If we have a viewId, schedule an update
    if (viewIdRef.current) {
      void updateView();
    }
  }, [hasMetViewThreshold, initializeView, updateView]);

  // Reset refs when video changes
  useEffect(() => {
    isTrackingRef.current = false;
    watchedDurationRef.current = 0;
    viewIdRef.current = null;
    hasMetThresholdRef.current = false;
  }, [videoId]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      if (hasMetThresholdRef.current) {
        void initializeView();
      }
    };
  }, [initializeView]);

  // Periodic updates
  useEffect(() => {
    if (!viewConfig?.updateInterval) return;

    const intervalId = setInterval(() => {
      if (isTrackingRef.current && viewIdRef.current) {
        void updateView();
      }
    }, viewConfig.updateInterval);

    return () => clearInterval(intervalId);
  }, [updateView, viewConfig?.updateInterval]);

  return {
    startTracking: useCallback(() => {
      isTrackingRef.current = true;
    }, []),

    pauseTracking: useCallback(() => {
      isTrackingRef.current = false;
      void updateView(true);
    }, [updateView]),

    updateWatchedDuration,
    
    finalize: useCallback(async () => {
      if (!viewIdRef.current) return;
      await updateView(true);
    }, [updateView])
  };
};