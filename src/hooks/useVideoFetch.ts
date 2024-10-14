import { useState, useEffect } from 'react';
import { getVideoById } from '../api/video';
import { Video } from '../types/video';

export const useVideoFetch = (id: string) => {
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadVideo = async () => {
      try {
        const response = await getVideoById(id);
        setVideo(response.data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    loadVideo();
  }, [id]);

  return { video, loading, error };
};
