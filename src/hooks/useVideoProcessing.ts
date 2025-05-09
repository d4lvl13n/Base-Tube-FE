import { useState, useEffect, useCallback, useRef } from 'react';
import { getVideoProgress, VideoProgressData } from '../api/video';

export interface ProcessingVideo extends VideoProgressData {
  videoId: number;
}

export const useVideoProcessing = (videoIds: number[]) => {
  const [processingVideos, setProcessingVideos] = useState<Record<number, ProcessingVideo>>({});
  const [isPolling, setIsPolling] = useState(false);

  // Keep a mutable ref to always have the latest processingVideos inside callbacks without causing re-subscriptions
  const processingVideosRef = useRef(processingVideos);
  useEffect(() => {
    processingVideosRef.current = processingVideos;
  }, [processingVideos]);

  const checkProgress = useCallback(async () => {
    try {
      const incompleteVideos = videoIds.filter(id => {
        const video = processingVideosRef.current[id];
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
  }, [videoIds]);

  // Start polling only when we have untracked videos
  useEffect(() => {
    const untrackedVideos = videoIds.filter(id => !processingVideosRef.current[id]);
    if (untrackedVideos.length > 0) {
      setIsPolling(true);
    }
  }, [videoIds]);

  // Handle polling with a stable interval
  useEffect(() => {
    if (!isPolling) return;

    checkProgress(); // Initial check
    const interval = setInterval(checkProgress, 5000);

    return () => clearInterval(interval);
  }, [isPolling, checkProgress]);

  return { processingVideos };
}; 