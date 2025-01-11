import { useState, useEffect, useCallback } from 'react';
import { getVideoProgress, VideoProgressData } from '../api/video';

export interface ProcessingVideo extends VideoProgressData {
  videoId: number;
}

export const useVideoProcessing = (videoIds: number[]) => {
  const [processingVideos, setProcessingVideos] = useState<Record<number, ProcessingVideo>>({});
  const [isPolling, setIsPolling] = useState(false);

  const hasProcessingVideos = useCallback(() => {
    return videoIds.some(id => {
      const video = processingVideos[id];
      return !video || video.status === 'pending' || video.status === 'processing';
    });
  }, [videoIds, processingVideos]);

  const checkProgress = useCallback(async () => {
    const incompleteVideos = videoIds.filter(id => {
      const video = processingVideos[id];
      return !video || video.status === 'pending' || video.status === 'processing';
    });

    if (incompleteVideos.length === 0) {
      setIsPolling(false);
      return;
    }

    try {
      const updates = await Promise.all(
        incompleteVideos.map(async (id) => {
          try {
            const response = await getVideoProgress(id);
            if (!response.success) {
              throw new Error('Failed to fetch progress');
            }
            
            return {
              videoId: id,
              ...response.data
            } as ProcessingVideo;
          } catch (error) {
            return { 
              videoId: id, 
              status: 'failed' as const,
              error: { message: 'Failed to fetch progress' }
            } satisfies ProcessingVideo;
          }
        })
      );

      const newProcessingVideos = Object.fromEntries(
        updates.map(update => [update.videoId, update])
      );
      
      setProcessingVideos(prev => ({
        ...prev,
        ...newProcessingVideos
      }));

      if (!updates.some(video => 
        video.status === 'pending' || video.status === 'processing'
      )) {
        setIsPolling(false);
      }
    } catch (error) {
      console.error('Error checking video progress:', error);
    }
  }, [videoIds, processingVideos]);

  // Start polling when we have videos to track
  useEffect(() => {
    if (videoIds.length > 0 && hasProcessingVideos() && !isPolling) {
      setIsPolling(true);
    }
  }, [videoIds, hasProcessingVideos, isPolling]);

  // Handle the polling
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isPolling) {
      checkProgress(); // Initial check
      interval = setInterval(checkProgress, 1000); // Check every second
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPolling, checkProgress]);

  return { processingVideos };
}; 