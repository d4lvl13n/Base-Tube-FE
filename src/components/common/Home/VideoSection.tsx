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
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        <Link to={linkTo} className="text-[#fa7517] hover:underline">View More</Link>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {videos.length > 0 ? videos.map((video) => (
          <VideoCard key={video.id} video={video} size="normal" />
        )) : renderPlaceholder()}
      </div>
    </div>
  );
};

export default VideoSection;