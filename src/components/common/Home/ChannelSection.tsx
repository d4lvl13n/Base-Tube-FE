import React from 'react';
import { Link } from 'react-router-dom';
import { Channel } from '../../../types/channel';

interface ChannelSectionProps {
  channels: Channel[];
  renderPlaceholder: () => React.ReactNode;
}

const ChannelSection: React.FC<ChannelSectionProps> = ({ channels, renderPlaceholder }) => {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Popular Channels</h2>
        <Link to="/channels" className="text-[#fa7517] hover:underline">View All</Link>
      </div>
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {channels.length > 0 ? channels.map((channel) => (
          <Link key={channel.id} to={`/channel/${channel.id}`} className="flex-shrink-0">
            <img 
              src={channel.avatarUrl} 
              alt={channel.name} 
              className="w-24 h-24 rounded-full object-cover mb-2"
            />
            <p className="text-center text-sm font-semibold">{channel.name}</p>
          </Link>
        )) : renderPlaceholder()}
      </div>
    </div>
  );
};

export default ChannelSection;