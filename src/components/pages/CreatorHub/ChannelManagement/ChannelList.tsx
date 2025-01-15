import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useChannelSelection } from '../../../../contexts/ChannelSelectionContext';
import ChannelPreviewCard from '../../../common/CreatorHub/ChannelPreviewCard';

const ChannelList: React.FC = () => {
  const navigate = useNavigate();
  const { channels, isLoading } = useChannelSelection();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#fa7517]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
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
          {channels.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-900/30 rounded-xl border border-gray-800/30 p-8 text-center"
            >
              <p className="text-gray-400 mb-4">You haven't created any channels yet</p>
              <button
                onClick={() => navigate('/create-channel')}
                className="px-4 py-2 bg-[#fa7517] hover:bg-[#ff8c3a] text-white rounded-lg transition-colors"
              >
                Create Your First Channel
              </button>
            </motion.div>
          ) : (
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
                    <ChannelPreviewCard channel={channel} />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChannelList; 