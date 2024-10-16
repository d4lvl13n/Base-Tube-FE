import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Channel } from '../../../types/channel';

interface ChannelSectionProps {
  channels: Channel[] | undefined;
  renderPlaceholder: () => React.ReactNode;
}


const ChannelSection: React.FC<ChannelSectionProps> = ({ channels, renderPlaceholder }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [visibleChannels, setVisibleChannels] = useState(5);

  useEffect(() => {
    const handleResize = () => {
      if (scrollRef.current) {
        const containerWidth = scrollRef.current.clientWidth;
        const channelWidth = 120; // Approximate width of each channel item
        const gap = 24; // Gap between channel items
        const channelsPerRow = Math.floor((containerWidth + gap) / (channelWidth + gap));
        setVisibleChannels(channelsPerRow);
      }
      handleScroll();
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
    <div className="mb-8 mr-16">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl sm:text-2xl font-bold">Popular Channels</h2>
        <Link to="/channel" className="text-[#fa7517] hover:underline text-sm sm:text-base">View All</Link>
      </div>
      <div className="relative">
        {showLeftArrow && (
          <button
            aria-label="Scroll Left"
            className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 rounded-full p-2 z-10 hidden sm:block"
            onClick={() => scroll('left')}
          >
            <ChevronLeft size={24} className="text-white" />
          </button>
        )}
        <div
          ref={scrollRef}
          className="flex space-x-4 sm:space-x-6 overflow-x-auto scrollbar-hide"
          onScroll={handleScroll}
        >
          {channels.map((channel) => (
            <Link
              key={channel.id}
              to={`/channel/${channel.id}`}
              className="flex-shrink-0 group"
            >
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 mb-2">
                <img
                  src={channel.channel_image_path ? `${process.env.REACT_APP_API_URL}/${channel.channel_image_path}` : '/MockupAssets/gaming.webp'}
                  alt={channel.name}
                  loading="lazy"
                  className="w-full h-full rounded-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-[#FA7517] bg-opacity-0 group-hover:bg-opacity-30 rounded-full transition-opacity duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="text-white text-xs font-semibold">View Channel</span>
                </div>
              </div>
              <p className="text-center text-xs sm:text-sm font-semibold truncate w-20 sm:w-24">
                {channel.name}
              </p>
              <p className="text-center text-xs text-gray-400">
                {(channel.subscribers_count || 0).toLocaleString()} subscribers
              </p>  
            </Link>
          ))}
        </div>
        {showRightArrow && (
          <button
            aria-label="Scroll Right"
            className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 rounded-full p-2 z-10 hidden sm:block"
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
