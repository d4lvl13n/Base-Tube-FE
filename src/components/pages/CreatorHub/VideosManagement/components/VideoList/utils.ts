import { format, formatDistanceToNow } from 'date-fns';
import { Video } from '../../../../../../types/video';
import { VideoStatus } from '../../../../../../types/video';

/**
 * Formats duration in seconds to a human-readable string (H:MM:SS or M:SS)
 */
export const formatDuration = (seconds?: number): string => {
  if (!seconds) return '0:00';
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainingSeconds = total % 60;
  const paddedSeconds = remainingSeconds.toString().padStart(2, '0');
  if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${paddedSeconds}`;
  return `${minutes}:${paddedSeconds}`;
};

/** A week — after which "3 weeks ago" is less use than the date itself. */
const RELATIVE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * The date a row shows.
 *
 * Recent uploads are the ones a creator is still thinking in hours about, so
 * they read as "2 hours ago"; anything older is a calendar date, because
 * "9 months ago" tells nobody which video this is.
 */
export const formatRowDate = (createdAt: string): string => {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '';
  if (Date.now() - date.getTime() < RELATIVE_WINDOW_MS) {
    return formatDistanceToNow(date, { addSuffix: true });
  }
  return format(date, 'MMM d');
};

/** The statuses at which a video exists as something you can actually play. */
export const isPlayable = (status?: VideoStatus): boolean =>
  status === 'processed' || status === 'completed';

/** Is the transcoder still working on this one — or did it give up? */
export const isUnfinished = (status?: VideoStatus): boolean =>
  status === 'pending' || status === 'processing' || status === 'failed';

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