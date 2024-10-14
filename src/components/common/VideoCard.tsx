import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Heart, MessageCircle } from 'lucide-react';

interface Video {
  id: number;
  title: string;
  creator: string;
  views: string;
  thumbnailUrl: string;
  videoUrl: string;
}

interface VideoCardProps {
  video: Video;
  size: 'normal' | 'large';
}

const VideoCard: React.FC<VideoCardProps> = ({ video, size }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <Link to={`/video/${video.id}`} className="block">
      <div 
        className={`relative overflow-hidden transition-all duration-300 ease-in-out bg-gray-800 rounded-lg ${
          size === 'large' ? 'col-span-2 row-span-2' : 'col-span-1 row-span-1'
        } ${isHovered ? 'scale-105 z-10' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-0 transition-opacity duration-300 ease-in-out" style={{ opacity: isHovered ? 0.7 : 0 }} />
        <div className={`aspect-video w-full ${size === 'large' ? 'h-[400px]' : 'h-[225px]'}`}>
          <img 
            src={video.thumbnailUrl} 
            alt={video.title} 
            className="w-full h-full object-cover" 
          />
        </div>
        {isHovered && (
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white transition-all duration-300 ease-in-out transform translate-y-0">
            <h3 className="text-lg font-bold mb-1">{video.title}</h3>
            <p className="text-sm mb-2">{video.creator}</p>
            <div className="flex items-center space-x-4">
              <span className="flex items-center"><Play size={16} className="mr-1" /> {video.views}</span>
              <span className="flex items-center"><Heart size={16} className="mr-1" /> 12K</span>
              <span className="flex items-center"><MessageCircle size={16} className="mr-1" /> 1.2K</span>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
};

export default VideoCard;