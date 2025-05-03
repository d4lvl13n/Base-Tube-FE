import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Edit3, Trash2, ArrowLeft } from 'lucide-react';
import { useChannelData } from '../../../../hooks/useChannelData';
import EditChannelModal from './components/EditChannelModal';
import ChannelPreviewCard from '../../../common/CreatorHub/ChannelPreviewCard';
import YouTubeIntegration from './components/YouTubeIntegration';
import DeleteChannel from './components/DeleteChannel';

const ChannelManagement: React.FC = () => {
  const navigate = useNavigate();
  // The URL param is named 'channelId' but could be either an ID or handle
  const { channelId: channelIdentifier } = useParams();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDeleteSection, setShowDeleteSection] = useState(false);

  // Use the custom hook instead of direct API call - it handles both IDs and handles
  const { 
    channel, 
    isLoading, 
    error
  } = useChannelData(channelIdentifier);

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
      {/* Channel Preview with Banner */}
      <div className="relative">
        <ChannelPreviewCard 
          channel={channel} 
        />
        
        {/* Action Buttons Overlay */}
        <div className="absolute top-6 right-6 flex items-center gap-3">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="p-2 bg-black/50 hover:bg-gray-800/80 rounded-xl transition-all duration-300
              text-white hover:text-[#fa7517] border border-gray-800/30 hover:border-[#fa7517]/50
              backdrop-blur-sm"
          >
            <Edit3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowDeleteSection(true)}
            className="p-2 bg-black/50 hover:bg-red-900/80 rounded-xl transition-all duration-300
              text-white hover:text-red-500 border border-gray-800/30 hover:border-red-500/50
              backdrop-blur-sm"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate('/creator-hub/channels')}
          className="absolute top-6 left-6 p-2 bg-black/50 hover:bg-gray-800/80 
            rounded-xl transition-all duration-300 text-white hover:text-[#fa7517]
            border border-gray-800/30 hover:border-[#fa7517]/50
            backdrop-blur-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Channel Management Sections */}
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* YouTube Integration Section */}
        <YouTubeIntegration className="mb-8" />
        
        {/* Delete Channel Section - only show when requested */}
        {showDeleteSection && (
          <DeleteChannel 
            channelId={channel.id.toString()} 
            channelName={channel.name}
            onDeleted={() => navigate('/creator-hub/channels')}
          />
        )}
      </div>

      {/* Modals */}
      <EditChannelModal
        channel={channel}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={() => {
          setIsEditModalOpen(false);
        }}
      />
    </div>
  );
};

export default ChannelManagement; 