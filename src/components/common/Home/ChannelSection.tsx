import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Users, ExternalLink } from 'lucide-react';
import { Channel } from '../../../types/channel';
import { motion } from 'framer-motion';

interface ChannelSectionProps {
  channels: Channel[] | undefined;
  renderPlaceholder: () => React.ReactNode;
}

const ChannelSection: React.FC<ChannelSectionProps> = ({ channels, renderPlaceholder }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      if (scrollRef.current) {
        handleScroll();
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = direction === 'left' ? -current.clientWidth : current.clientWidth;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!channels || channels.length === 0) {
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl sm:text-2xl font-bold">Popular Channels</h2>
          <Link to="/channel" className="text-[#fa7517] hover:underline text-sm sm:text-base">View All</Link>
        </div>
        {renderPlaceholder()}
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl sm:text-2xl font-bold">Popular Channels</h2>
        <Link to="/channel" className="text-[#fa7517] hover:underline text-sm sm:text-base">View All</Link>
      </div>
      <div className="relative">
        {showLeftArrow && (
          <button
            aria-label="Scroll Left"
            className="absolute -left-4 top-1/2 transform -translate-y-1/2 bg-black/50 rounded-full p-2 z-10 hidden sm:block
                     hover:bg-black/70 transition-colors duration-200"
            onClick={() => scroll('left')}
          >
            <ChevronLeft size={24} className="text-white" />
          </button>
        )}
        <div
          ref={scrollRef}
          className="flex space-x-6 overflow-x-auto scrollbar-hide"
          onScroll={handleScroll}
        >
          {channels.map((channel) => {
            const coverImageUrl = channel.channel_image_url 
              ? channel.channel_image_url
              : (channel.channel_image_path
                ? channel.channel_image_path.startsWith('http')
                  ? channel.channel_image_path
                  : `${process.env.REACT_APP_API_URL}/${channel.channel_image_path}`
                : '/assets/default-cover.jpg'
              );
            
            const rawAvatar = channel.ownerProfileImage || '';
            const avatarUrl = rawAvatar
              ? (rawAvatar.startsWith('http')
                ? rawAvatar
                : `${process.env.REACT_APP_API_URL}/${rawAvatar}`)
              : '/assets/default-avatar.jpg';

            return (
              <motion.div
                key={channel.id}
                className="flex-shrink-0 w-[300px] group"
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300, damping: 10 }}
              >
                <div className="h-48 relative overflow-hidden rounded-xl">
                  <motion.img 
                    src={coverImageUrl}
                    alt={`${channel.name} cover`}
                    className="w-full h-full object-cover transition-all duration-500
                             group-hover:scale-110 group-hover:brightness-75"
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="flex items-end space-x-4">
                        <div className="relative">
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#fa7517] to-[#fa9517] opacity-0 
                                      group-hover:opacity-100 blur-md transition-opacity duration-300" />
                          <img
                            src={avatarUrl}
                            alt={channel.name}
                            className="relative w-16 h-16 rounded-full border-2 border-white shadow-lg 
                                   transform transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                        
                        <motion.div 
                          className="flex-grow"
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.1 }}
                        >
                          <h3 className="text-xl font-bold text-white mb-1 line-clamp-1">{channel.name}</h3>
                          <p className="text-gray-300">@{channel.handle}</p>
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-b from-black/90 to-black/70 
                              opacity-0 group-hover:opacity-100 transition-all duration-300
                              flex flex-col justify-between p-6 transform translate-y-2 
                              group-hover:translate-y-0">
                    <div className="flex justify-end">
                      <Link
                        to={`/channel/${channel.handle}`}
                        className="p-2 bg-[#fa7517] rounded-lg transition-all duration-300
                               text-white hover:bg-[#fa9517] hover:scale-110"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </Link>
                    </div>
                    
                    <div className="space-y-4">
                      {channel.description && (
                        <p className="text-gray-100 text-sm line-clamp-2 
                                 transform transition-all duration-300">
                          {channel.description}
                        </p>
                      )}
                      <div className="flex items-center text-gray-100">
                        <span className="flex items-center group-hover:text-[#fa7517] transition-colors">
                          <Users size={16} className="mr-2" />
                          {(channel.subscribers_count || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        {showRightArrow && (
          <button
            aria-label="Scroll Right"
            className="absolute -right-4 top-1/2 transform -translate-y-1/2 bg-black/50 rounded-full p-2 z-10 hidden sm:block
                     hover:bg-black/70 transition-colors duration-200"
            onClick={() => scroll('right')}
          >
            <ChevronRight size={24} className="text-white" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChannelSection;
