// src/components/channel/VideoGrid.tsx

import React, { useEffect, useRef } from 'react';
import { Video } from '../../../types/video';
import VideoCard from '../VideoCard';
import PlaceholderVideoCard from '../PlaceHolderVideoCard';

interface VideoGridProps {
  videos: Video[];
  loadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
}

const VideoGrid: React.FC<VideoGridProps> = ({ 
  videos, 
  loadMore, 
  hasMore = false,
  loading = false 
}) => {
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const target = sentinel.current;
    if (!target || !hasMore || loading || !loadMore) return;
    let requested = false;
    if (typeof IntersectionObserver === 'undefined') {
      const check = () => {
        if (!requested && target.getBoundingClientRect().top <= window.innerHeight + 600) {
          requested = true;
          loadMore();
        }
      };
      window.addEventListener('scroll', check);
      window.addEventListener('resize', check);
      check();
      return () => {
        window.removeEventListener('scroll', check);
        window.removeEventListener('resize', check);
      };
    }
    const observer = new IntersectionObserver(entries => {
      if (!requested && entries.some(entry => entry.isIntersecting)) {
        requested = true;
        loadMore();
      }
    }, { rootMargin: '600px' });
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loading, loadMore, videos.length]);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            size="normal"
          />
        ))}
        {loading && (
          <>
            <PlaceholderVideoCard size="normal" />
            <PlaceholderVideoCard size="normal" />
            <PlaceholderVideoCard size="normal" />
            <PlaceholderVideoCard size="normal" />
          </>
        )}
      </div>
      
      <div ref={sentinel} aria-hidden="true" className="h-px" />
      {loading && <p role="status" className="text-center text-sm text-gray-400">Loading videos…</p>}
    </div>
  );
};

export default VideoGrid;
