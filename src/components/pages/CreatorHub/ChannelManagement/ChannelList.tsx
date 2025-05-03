import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useChannelSelection } from '../../../../contexts/ChannelSelectionContext';
import ChannelPreviewCard from '../../../common/CreatorHub/ChannelPreviewCard';
import { toast } from 'react-toastify';
import NoChannelView from '../NoChannelView';

const ChannelList: React.FC = () => {
  const navigate = useNavigate();
  const { channels: initialChannels, isLoading } = useChannelSelection();
  const [channels, setChannels] = useState(initialChannels);
  
  // Update local state when context changes
  React.useEffect(() => {
    setChannels(initialChannels);
  }, [initialChannels]);
  
  // Handle channel deletion from the UI
  const handleChannelDeleted = useCallback((deletedId: string) => {
    // Remove the deleted channel from local state
    setChannels(prev => prev.filter(ch => ch.id.toString() !== deletedId));
    toast.success('Channel deleted successfully');
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#fa7517]" />
      </div>
    );
  }

  // Show NoChannelView if there are no channels
  if (channels.length === 0) {
    return (
      <NoChannelView 
        title="Manage Your Channels"
        description="Create a channel to start managing your content, collaborators, and settings."
        buttonText="Create Your First Channel"
      />
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-16">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Channel Management</h1>
          <p className="text-gray-400">
            Manage your channels and their settings
          </p>
        </div>

        {/* Channel Grid */}
        <div className="grid grid-cols-1 gap-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {channels.map((channel) => (
              <motion.div
                key={channel.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="relative"
              >
                <div className="group">
                  <ChannelPreviewCard 
                    channel={channel} 
                    onDeleted={() => handleChannelDeleted(channel.id.toString())}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ChannelList; 