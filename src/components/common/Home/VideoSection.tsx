import React from 'react';
import { Link } from 'react-router-dom';
import VideoCard from '../VideoCard';
import { Video } from '../../../types/video';

interface VideoSectionProps {
  title: string;
  videos: Video[];
  linkTo: string;
  renderPlaceholder: () => React.ReactNode;
}

const VideoSection: React.FC<VideoSectionProps> = ({ title, videos, linkTo, renderPlaceholder }) => {
  console.log(`VideoSection "${title}" received videos:`, videos);
  
  const hasVideos = Array.isArray(videos) && videos.length > 0;
  console.log(`VideoSection "${title}" hasVideos:`, hasVideos);

  return (
    <div className="mb-8 mr-16">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl sm:text-2xl font-bold">{title}</h2>
        <Link to={linkTo} className="text-[#fa7517] hover:underline text-sm sm:text-base">View More</Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {hasVideos ? (
          videos.slice(0, 4).map((video) => {
            console.log(`Rendering video in "${title}":`, video);
            return <VideoCard key={video.id} video={video} size="normal" />;
          })
        ) : (
          <>
            {console.log(`Rendering placeholder for "${title}"`)}
            {renderPlaceholder()}
          </>
        )}
      </div>
    </div>
  );
};

export default VideoSection;
