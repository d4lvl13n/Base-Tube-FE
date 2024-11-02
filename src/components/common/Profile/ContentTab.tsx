import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Video } from '../../../types/video';
import { Channel } from '../../../types/channel';
import { motion } from 'framer-motion';
import { Plus, Tv2 } from 'lucide-react';
import ChannelCard from '../Channel/ChannelCard';
import VideoGrid from '../Channel/VideoGrid';
import Error from '../Error';

interface ContentTabProps {
  videos: Video[];
  channels?: Channel[];
  error?: string;
  loading?: boolean;
  loadMoreVideos?: () => void;
  hasMoreVideos?: boolean;
}

const ContentTab: React.FC<ContentTabProps> = ({ 
  videos, 
  channels = [], 
  error, 
  loading, 
  loadMoreVideos, 
  hasMoreVideos 
}) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#fa7517]"></div>
      </div>
    );
  }

  if (channels.length === 0) {
    return (
      <motion.div 
        className="flex flex-col items-center justify-center h-64 bg-gray-900 rounded-xl p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Tv2 size={64} className="text-[#fa7517] mb-4" />
        <h3 className="text-xl font-bold mb-2">No Channels Found</h3>
        <p className="text-gray-400 text-center mb-6">You don't have any channels yet.</p>
        <motion.button
          onClick={() => navigate('/create-channel')}
          className="bg-gradient-to-r from-[#fa7517] to-[#ff9a5a] text-black px-6 py-3 rounded-full font-bold flex items-center space-x-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus size={20} />
          <span>Create Your First Channel</span>
        </motion.button>
      </motion.div>
    );
  }

  if (error) {
    return <Error message={error} />;
  }

  return (
    <div className="space-y-8">
      {/* Channels Section */}
      {channels.length > 0 && (
        <motion.div
          className="bg-gray-900 p-6 rounded-xl"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold bg-gradient-to-r from-[#fa7517] to-[#ff9a5a] text-transparent bg-clip-text">
              Your Channels
            </h3>
            <motion.button
              onClick={() => navigate('/create-channel')}
              className="bg-gray-800 hover:bg-gray-700 text-[#fa7517] px-4 py-2 rounded-full flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus size={18} />
              <span>New Channel</span>
            </motion.button>
          </div>
          
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex space-x-4">
              {channels.map((channel) => (
                <motion.div
                  key={channel.id}
                  className="flex-shrink-0 w-48"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChannelCard
                    channel={channel}
                    variant="compact"
                    className="h-full"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Videos Section */}
      {videos.length > 0 ? (
        <VideoGrid 
          videos={videos} 
          loadMore={() => { /* Implement your loadMore function here */ }} 
          hasMore={true} // Replace with your actual hasMore state
        />
      ) : (
        <motion.div 
          className="flex justify-center items-center h-32 bg-gray-900 rounded-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="text-gray-400">No videos to display.</span>
        </motion.div>
      )}
    </div>
  );
};

export default ContentTab;