import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Edit3, Trash2, ArrowLeft, Hexagon, Plus, BarChart3 } from 'lucide-react';
import { useChannelData } from '../../../../hooks/useChannelData';
import EditChannelModal from './components/EditChannelModal';
import ChannelPreviewCard from '../../../common/CreatorHub/ChannelPreviewCard';
import YouTubeIntegration from './components/YouTubeIntegration';
import DeleteChannel from './components/DeleteChannel';
import ChannelList from './ChannelList';

const ChannelManagement: React.FC = () => {
  const navigate = useNavigate();
  // The URL param is named 'channelId' but could be either an ID or handle
  const { channelId } = useParams();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDeleteSection, setShowDeleteSection] = useState(false);

  // Use the custom hook instead of direct API call - it handles both IDs and handles
  const { 
    channel, 
    isLoading, 
    error
  } = useChannelData(channelId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#fa7517]" />
      </div>
    );
  }

  if (error || !channel) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white">
        <p className="text-xl mb-4">Failed to load channel</p>
        <button
          onClick={() => navigate('/creator-hub/channels')}
          className="px-4 py-2 bg-[#fa7517] rounded-lg hover:bg-[#ff8c3a] transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-16">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
        {channelId ? (
          // Single channel view
          <div className="relative">
            {/* Back button */}
            <button
              onClick={() => navigate('/creator-hub/channels')}
              className="flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Channels
            </button>

            {/* Channel Preview */}
            <div className="mb-6">
              <ChannelPreviewCard 
                channel={channel} 
                onUpdate={() => {
                  setIsEditModalOpen(false);
                }} 
                onDeleted={() => navigate('/creator-hub/channels')}
              />
            </div>

            {/* YouTube Integration Section */}
            <YouTubeIntegration className="mb-6" />

            {/* Delete Channel Section */}
            <DeleteChannel 
              channelId={channelId} 
              channelName={channel?.name || 'this channel'} 
              onDeleted={() => navigate('/creator-hub/channels')}
            />
          </div>
        ) : (
          // Channel list view
          <>
            {/* Header */}
            <div className="mb-6 sm:mb-10">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">Channel Management</h1>
              <p className="text-sm sm:text-base text-gray-400">
                Manage your channels and connectivity with other platforms
              </p>
            </div>

            {/* Main content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left column (1/3 width on large screens, full width on mobile) */}
              <div className="order-2 lg:order-1 lg:col-span-1">
                <YouTubeIntegration className="mb-6" />
                
                {/* Additional integrations can be added here */}
                <div className="bg-zinc-900 rounded-lg p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-semibold mb-4 flex items-center">
                    <Hexagon className="mr-2 text-blue-400" size={20} />
                    Channel Analytics
                  </h3>
                  <p className="text-zinc-400 text-sm sm:text-base mb-4">
                    View detailed analytics and performance metrics for your channel.
                  </p>
                  <Link 
                    to="/creator-hub/analytics"
                    className="inline-flex items-center px-4 py-2 bg-zinc-800 text-white rounded-md hover:bg-zinc-700 text-xs sm:text-sm transition-colors"
                  >
                    <BarChart3 size={16} className="mr-2" />
                    View Analytics
                  </Link>
                </div>
              </div>
              
              {/* Right column (2/3 width on large screens, full width on mobile) */}
              <div className="order-1 lg:order-2 lg:col-span-2">
                <div className="bg-zinc-900 rounded-lg p-4 sm:p-6 mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                    <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-0">Your Channels</h3>
                    
                    <Link
                      to="/creator-hub/channels/new"
                      className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-[#fa7517] text-black text-xs sm:text-sm rounded-md hover:bg-[#ff8c3a] transition-colors"
                    >
                      <Plus size={16} className="mr-2" />
                      Create New Channel
                    </Link>
                  </div>
                  
                  <ChannelList />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {channel && (
        <EditChannelModal
          channel={channel}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={() => {
            setIsEditModalOpen(false);
            // Refresh channel data if needed
          }}
        />
      )}
    </div>
  );
};

export default ChannelManagement; 