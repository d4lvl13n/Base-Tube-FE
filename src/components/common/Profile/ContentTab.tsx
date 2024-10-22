// src/components/common/Profile/ContentTab.tsx

import React, { useState, useEffect } from 'react';
import { Video } from '../../../types/video';
import VideoCard from '../VideoCard';
import InfiniteScroll from 'react-infinite-scroll-component';
import EmptyState from '../EmptyState';
import Loader from '../Loader';
import Error from '../Error';

interface ContentTabProps {
  videos: Video[];
  error?: string;
}

const ContentTab: React.FC<ContentTabProps> = ({ videos, error }) => {
  const [displayedVideos, setDisplayedVideos] = useState<Video[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const itemsPerPage = 9;

  useEffect(() => {
    setDisplayedVideos(videos.slice(0, itemsPerPage));
    setHasMore(videos.length > itemsPerPage);
  }, [videos]);

  const fetchMoreData = () => {
    if (displayedVideos.length >= videos.length) {
      setHasMore(false);
      return;
    }
    setTimeout(() => {
      setDisplayedVideos((prev) => [
        ...prev,
        ...videos.slice(prev.length, prev.length + itemsPerPage),
      ]);
    }, 500);
  };

  if (error) {
    return <Error message={error} />;
  }

  if (!videos || videos.length === 0) {
    return (
      <EmptyState
        imageSrc="/assets/no-videos.svg"
        title="No Videos Yet"
        description="You haven't uploaded any videos yet."
        buttonText="Upload Your First Video"
        onButtonClick={() => {
          // Navigate to upload page
        }}
      />
    );
  }

  return (
    <InfiniteScroll
      dataLength={displayedVideos.length}
      next={fetchMoreData}
      hasMore={hasMore}
      loader={<Loader />}
      endMessage={
        <p className="text-center text-gray-500 mt-4">No more videos.</p>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {displayedVideos.map((video) => (
          <VideoCard key={video.id} video={video} size="normal" />
        ))}
      </div>
    </InfiniteScroll>
  );
};

export default ContentTab;