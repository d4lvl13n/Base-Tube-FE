import React, { useState } from 'react';
import { Trash, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { deleteChannel } from '../../../../../api/channel';
import { button, cx, field } from '../../Business/businessStyles';

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
    <div className={cx('mt-6 border-t border-gray-800/50 pt-6', className)}>
      <h3 className="mb-3 text-base font-semibold text-red-300">Danger Zone</h3>

      {!showConfirm ? (
        <div className="flex flex-col gap-3 rounded-xl border border-red-500/20 bg-black/50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-sm font-medium text-white">Delete this channel</h4>
            <p className="mt-0.5 text-sm text-gray-400">
              Once deleted, all channel data will be permanently removed.
              This action cannot be undone.
            </p>
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            className={cx(
              button.secondary,
              'border-red-500/30 text-red-300 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-200 focus-visible:ring-red-400/50 sm:ml-4',
            )}
          >
            Delete Channel
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-red-500/30 bg-red-500/[0.05] p-4">
          <div className="mb-3 flex items-center gap-2 text-red-300">
            <AlertTriangle size={18} className="shrink-0" aria-hidden="true" />
            <h4 className="text-sm font-medium">Delete {channelName}</h4>
          </div>

          <p className="mb-4 text-sm text-gray-300">
            This action <strong className="font-semibold text-white">cannot be undone</strong>. All videos, analytics, and channel data will be permanently deleted.
          </p>

          <div className="mb-4 space-y-1.5">
            <label htmlFor={`delete-channel-${channelId}`} className={field.label}>
              Type <span className="rounded border border-gray-800 bg-black px-1 py-0.5 font-mono text-red-300">{confirmationText}</span> to confirm deletion:
            </label>
            <input
              id={`delete-channel-${channelId}`}
              type="text"
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
              className={cx(field.input, 'focus-visible:border-red-400/50 focus-visible:ring-red-400/30')}
              placeholder={`Type "${confirmationText}" to confirm`}
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={handleDeleteChannel}
              disabled={!isConfirmationValid || isDeleting}
              className={button.danger}
            >
              <Trash size={16} aria-hidden="true" />
              {isDeleting ? 'Deleting...' : 'Permanently Delete Channel'}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              disabled={isDeleting}
              className={button.ghost}
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
