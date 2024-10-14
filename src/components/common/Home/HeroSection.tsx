import React from 'react';
import { Link } from 'react-router-dom';
import { Video } from '../../../types/video';

interface HeroSectionProps {
  featuredVideos: Video[];
  renderPlaceholder: () => React.ReactNode;
}

const HeroSection: React.FC<HeroSectionProps> = ({ featuredVideos, renderPlaceholder }) => {
  if (!Array.isArray(featuredVideos) || featuredVideos.length === 0) {
    return <div className="flex gap-4 mb-8 h-[400px]">{renderPlaceholder()}</div>;
  }

  return (
    <div className="flex gap-4 mb-8 h-[400px]">
      {featuredVideos.slice(0, 2).map((video) => (
        <Link 
          key={video.id} 
          to={`/video/${video.id}`} 
          className="relative flex-1 group overflow-hidden rounded-lg"
        >
          <img 
            src={`${process.env.REACT_APP_API_URL}/${video.thumbnail_path}`} 
            alt={video.title} 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
/>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
            <h2 className="text-xl font-bold text-white">{video.title}</h2>
            <p className="text-sm text-gray-300">{video.channel.name}</p>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default HeroSection;
