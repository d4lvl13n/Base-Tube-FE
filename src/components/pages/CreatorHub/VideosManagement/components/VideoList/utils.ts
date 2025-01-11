import { Video } from '../../../../../../types/video';

/**
 * Formats duration in seconds to a human-readable string (HH:MM:SS or MM:SS)
 */
export const formatDuration = (seconds?: number): string => {
  if (!seconds) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Gets the thumbnail URL for a video, handling different URL formats and fallbacks
 */
export const getThumbnailUrl = (video: Video): string => {
  if (!video) return '/assets/default-thumbnail.jpg';

  // First try to get the custom thumbnail URL
  if (video.thumbnail_url) {
    return video.thumbnail_url;
  }

  // Then try to get from thumbnail_urls (different sizes)
  if (video.thumbnail_urls) {
    // Prefer medium size, fallback to other sizes
    return (
      video.thumbnail_urls.medium ||
      video.thumbnail_urls.large ||
      video.thumbnail_urls.small ||
      video.thumbnail_urls.original ||
      '/assets/default-thumbnail.jpg'
    );
  }

  // If we have a thumbnail path (development)
  if (video.thumbnail_path) {
    return video.thumbnail_path;
  }

  // Fallback to default thumbnail
  return '/assets/default-thumbnail.jpg';
};

/**
 * Validates if a thumbnail URL is accessible
 */
export const validateThumbnailUrl = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Gets a color based on video status
 */
export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'processing':
      return '#fa7517'; // Orange
    case 'completed':
      return '#10B981'; // Green
    case 'failed':
      return '#EF4444'; // Red
    case 'pending':
      return '#6B7280'; // Gray
    default:
      return '#6B7280'; // Default Gray
  }
};