import React, { useMemo } from 'react';

interface PassVideoPlayerProps {
  /**
   * A signed URL returned from the backend. Can be a YouTube watch URL, youtu.be short link, or a
   * direct mp4 (S3 / Storj) link.
   */
  signedUrl: string;
  /** Poster / thumbnail image to show before play (only applies to mp4 rendering) */
  poster?: string;
  /** Should the video autoplay? default = true */
  autoPlay?: boolean;
  /** Optional title for accessibility */
  title?: string;
  /** Extra tailwind classes for wrapper */
  className?: string;
}

// Utility to extract a YouTube videoId from various URL formats
function getYouTubeId(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const hostname = u.hostname.toLowerCase();
    const pathname = u.pathname;

    if (hostname.includes('youtube.com')) {
      // Check for /embed/ format first
      if (pathname.startsWith('/embed/')) {
        // Path: /embed/VIDEO_ID?... or /embed/VIDEO_ID&... or /embed/VIDEO_ID
        // Get the part after /embed/ -> VIDEO_ID?... or VIDEO_ID&... or VIDEO_ID
        const potentialId = pathname.split('/')[2];
        // Split by '?' then '&' to remove any params
        return potentialId?.split('?')[0]?.split('&')[0] || null;
      }
      // Then check for watch?v= format (searchParams handles this correctly)
      const videoId = u.searchParams.get('v');
      if (videoId) {
        return videoId;
      }
    } else if (hostname === 'youtu.be') {
      // Handle youtu.be links
      // Path: /VIDEO_ID?... or /VIDEO_ID&... or /VIDEO_ID
      const pathPart = pathname.slice(1); // Remove leading '/' -> VIDEO_ID?... or VIDEO_ID&... or VIDEO_ID
      // Split by '?' first, then by '&' to isolate the ID
      return pathPart?.split('?')[0]?.split('&')[0] || null;
    }
  } catch (_) {
    // Ignore URL parsing errors for invalid formats
    console.error("Error parsing URL in getYouTubeId:", url, _);
  }
  // Return null if no valid ID pattern was matched
  return null;
}

const PassVideoPlayer: React.FC<PassVideoPlayerProps> = ({
  signedUrl,
  poster,
  autoPlay = true,
  title = 'Premium video',
  className = '',
}) => {
  const youTubeId = useMemo(() => getYouTubeId(signedUrl), [signedUrl]);

  const renderYouTube = () => {
    if (!youTubeId) return null;
    const src = `https://www.youtube.com/embed/${youTubeId}?autoplay=${autoPlay ? 1 : 0}&rel=0`;
    return (
      <iframe
        src={src}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full border-0"
      />
    );
  };

  const renderVideo = () => {
    return (
      <video
        src={signedUrl}
        controls
        autoPlay={autoPlay}
        poster={poster}
        className="w-full h-full"
      />
    );
  };

  return (
    <div className={`relative w-full h-[56.25vw] max-h-[80vh] bg-black ${className}`}>
      {youTubeId ? renderYouTube() : renderVideo()}
    </div>
  );
};

export default PassVideoPlayer; 