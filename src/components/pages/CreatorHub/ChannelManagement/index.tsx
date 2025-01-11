import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Edit3, Trash2, ArrowLeft } from 'lucide-react';
import { deleteChannel } from '../../../../api/channel';
import { useChannelData } from '../../../../hooks/useChannelData';
import EditChannelModal from './components/EditChannelModal';
import DeleteConfirmationDialog from '../../../common/DeleteConfirmationDialog';
import ChannelPreviewCard from '../../../common/CreatorHub/ChannelPreviewCard';

const ChannelManagement: React.FC = () => {
  const navigate = useNavigate();
  const { channelId } = useParams();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Use the custom hook instead of direct API call
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

  const handleDelete = async () => {
    try {
      await deleteChannel(channel.id.toString());
      toast.success('Channel deleted successfully');
      navigate('/creator-hub/channels');
    } catch (error) {
      toast.error('Failed to delete channel');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
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
            onClick={() => setIsDeleteDialogOpen(true)}
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

      {/* Modals */}
      <EditChannelModal
        channel={channel}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={() => {
          setIsEditModalOpen(false);
          // The query will automatically refetch due to React Query's cache invalidation
        }}
      />

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Channel"
        message="Are you sure you want to delete this channel? This action cannot be undone."
      />
    </div>
  );
};

export default ChannelManagement; 