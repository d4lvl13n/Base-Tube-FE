import { useState, useEffect, useCallback } from 'react';
import { getVideoProgress, VideoProgressData } from '../api/video';

export interface ProcessingVideo extends VideoProgressData {
  videoId: number;
}

export const useVideoProcessing = (videoIds: number[]) => {
  const [processingVideos, setProcessingVideos] = useState<Record<number, ProcessingVideo>>({});
  const [isPolling, setIsPolling] = useState(false);

  const checkProgress = useCallback(async () => {
    try {
      const incompleteVideos = videoIds.filter(id => {
        const video = processingVideos[id];
        return !video || video.status === 'pending' || video.status === 'processing';
      });

      if (incompleteVideos.length === 0) {
        setIsPolling(false);
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

      const validUpdates = updates.filter((update): update is ProcessingVideo => update !== null);
      
      if (validUpdates.length > 0) {
        setProcessingVideos(prev => ({
          ...prev,
          ...Object.fromEntries(validUpdates.map(update => [update.videoId, update]))
        }));
      }

      // Stop polling if no videos are still processing
      if (!validUpdates.some(video => video.status === 'pending' || video.status === 'processing')) {
        setIsPolling(false);
      }
    } catch (error) {
      console.error('Error checking video progress:', error);
      setIsPolling(false);
    }
  }, [videoIds, processingVideos]);

  // Start polling only when we have untracked videos
  useEffect(() => {
    const untrackedVideos = videoIds.filter(id => !processingVideos[id]);
    if (untrackedVideos.length > 0) {
      setIsPolling(true);
    }
  }, [videoIds, processingVideos]);

  // Handle polling with a more reasonable interval
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isPolling) {
      checkProgress(); // Initial check
      interval = setInterval(checkProgress, 5000); // Check every 5 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPolling, checkProgress]);

  return { processingVideos };
}; 