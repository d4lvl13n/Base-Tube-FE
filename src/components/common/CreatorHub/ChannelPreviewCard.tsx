import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ExternalLink, Users, Video, Edit3 } from 'lucide-react';
import { Channel } from '../../../types/channel';
import EditChannelModal from '../../pages/CreatorHub/ChannelManagement/components/EditChannelModal';
import DOMPurify from 'dompurify';

interface ChannelPreviewCardProps {
  channel: Channel;
  onUpdate?: () => void;
}

const ChannelPreviewCard: React.FC<ChannelPreviewCardProps> = ({ channel, onUpdate }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const coverImageUrl = channel.channel_image_url || 
    (channel.channel_image_path
      ? channel.channel_image_path.startsWith('http')
        ? channel.channel_image_path
        : `${process.env.REACT_APP_API_URL}/${channel.channel_image_path}`
      : '/assets/default-cover.jpg');

  // Sanitize the description HTML to prevent XSS attacks
  const sanitizeHTML = (html: string) => {
    return {
      __html: DOMPurify.sanitize(html)
    };
  };

  // Function to create a plain text version of the HTML for accessibility
  const createPlainText = (html: string) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  return (
    <>
      <div className="w-full bg-black/50 rounded-xl p-6">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gray-900/30 rounded-xl border border-gray-800/30 backdrop-blur-sm overflow-hidden"
        >
          {/* Banner Image with Gradient Overlay */}
          <div className="h-40 relative">
            <img 
              src={coverImageUrl}
              alt={`${channel.name} cover`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent">
              {/* Channel Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex items-end justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{channel.name}</h3>
                    <p className="text-gray-300">@{channel.handle}</p>
                    
                    {/* Channel description - render HTML safely */}
                    {channel.description && (
                      <div 
                        className="text-sm text-gray-400 mt-1 line-clamp-2 overflow-hidden"
                        dangerouslySetInnerHTML={sanitizeHTML(channel.description)}
                        aria-label={createPlainText(channel.description)}
                      />
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/channel/${channel.handle}`}
                      className="p-2 hover:bg-[#fa7517]/10 rounded-lg transition-colors text-white hover:text-[#fa7517]"
                      title="View Channel"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="p-2 hover:bg-[#fa7517]/10 rounded-lg transition-colors text-white hover:text-[#fa7517]"
                      title="Edit Channel"
                    >
                      <Edit3 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex items-center space-x-4 mt-2 text-gray-300">
                  <span className="flex items-center">
                    <Users size={14} className="mr-1 text-[#fa7517]" />
                    {(channel.subscribers_count ?? 0).toLocaleString()} subscribers
                  </span>
                  <span className="flex items-center">
                    <Video size={14} className="mr-1 text-[#fa7517]" />
                    {(channel.videos_count ?? 0).toLocaleString()} videos
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Edit Modal */}
      <EditChannelModal
        channel={channel}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={() => {
          setIsEditModalOpen(false);
          onUpdate?.();
        }}
      />
    </>
  );
};

export default ChannelPreviewCard; 