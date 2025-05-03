import React, { useState } from 'react';
import { Trash, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { deleteChannel } from '../../../../../api/channel';

interface DeleteChannelProps {
  channelId: string;
  channelName: string;
  className?: string;
  onDeleted?: () => void;
}

const DeleteChannel: React.FC<DeleteChannelProps> = ({ 
  channelId, 
  channelName,
  className,
  onDeleted 
}) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const confirmationText = channelName.toLowerCase();
  const isConfirmationValid = deleteText.toLowerCase() === confirmationText;

  const handleDeleteChannel = async () => {
    if (!isConfirmationValid) return;
    
    try {
      setIsDeleting(true);
      await deleteChannel(channelId);
      toast.success(`Channel ${channelName} has been deleted successfully`);
      
      if (onDeleted) {
        onDeleted();
      } else {
        // If no callback provided, navigate to channels list
        navigate('/creator-hub/channels');
      }
    } catch (error: any) {
      console.error('Error deleting channel:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete channel';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className={`border-t border-zinc-800 pt-6 mt-6 ${className}`}>
      <h3 className="text-xl font-semibold text-red-400 mb-4">Danger Zone</h3>
      
      {!showConfirm ? (
        <div className="flex items-center justify-between bg-zinc-900 p-4 rounded-lg">
          <div>
            <h4 className="font-medium">Delete this channel</h4>
            <p className="text-sm text-zinc-400">
              Once deleted, all channel data will be permanently removed.
              This action cannot be undone.
            </p>
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            className="px-4 py-2 bg-red-900/30 text-red-400 border border-red-900 rounded-md hover:bg-red-900/50 transition-colors whitespace-nowrap ml-4"
          >
            Delete Channel
          </button>
        </div>
      ) : (
        <div className="border border-red-800 rounded-lg p-4 bg-red-950/20">
          <div className="flex items-center mb-3 text-red-400">
            <AlertTriangle size={20} className="mr-2" />
            <h4 className="font-medium">Delete {channelName}</h4>
          </div>
          
          <p className="text-sm text-zinc-300 mb-4">
            This action <strong>cannot be undone</strong>. All videos, analytics, and channel data will be permanently deleted.
          </p>
          
          <div className="mb-4">
            <label className="block text-sm text-zinc-400 mb-1">
              Type <span className="font-mono bg-zinc-800 px-1 py-0.5 rounded text-red-400">{confirmationText}</span> to confirm deletion:
            </label>
            <input
              type="text"
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white"
              placeholder={`Type "${confirmationText}" to confirm`}
            />
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleDeleteChannel}
              disabled={!isConfirmationValid || isDeleting}
              className="px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Trash size={16} className="mr-2" />
              {isDeleting ? 'Deleting...' : 'Permanently Delete Channel'}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              disabled={isDeleting}
              className="px-4 py-2 bg-zinc-800 text-white rounded-md hover:bg-zinc-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeleteChannel; 