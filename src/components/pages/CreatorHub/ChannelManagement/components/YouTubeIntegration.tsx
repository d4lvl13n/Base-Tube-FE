import React, { useState } from 'react';
import { useYouTubeAuth } from '../../../../../hooks/useYouTubeAuth';
import { toast } from 'react-toastify';
import { Trash, Youtube, AlertCircle, CheckCircle } from 'lucide-react';

interface YouTubeIntegrationProps {
  className?: string;
}

const YouTubeIntegration: React.FC<YouTubeIntegrationProps> = ({ className }) => {
  const { status, channel, startOAuth, unlink } = useYouTubeAuth();
  const [unlinking, setUnlinking] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleUnlink = async () => {
    try {
      setUnlinking(true);
      await unlink();
      toast.success('YouTube channel unlinked successfully');
      setShowConfirm(false);
    } catch (error) {
      console.error('Failed to unlink YouTube channel:', error);
      toast.error('Failed to unlink YouTube channel');
    } finally {
      setUnlinking(false);
    }
  };

  return (
    <div className={`bg-zinc-900 rounded-lg p-4 sm:p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg sm:text-xl font-semibold flex items-center">
          <Youtube className="mr-2 text-red-500" size={20} /> 
          YouTube Integration
        </h3>
      </div>

      {status === 'loading' && (
        <div className="text-zinc-400 animate-pulse text-sm sm:text-base">
          Checking YouTube connection status...
        </div>
      )}

      {status === 'linked' && (
        <div>
          <div className="flex items-center mb-4 text-green-500 text-sm sm:text-base">
            <CheckCircle size={18} className="mr-2 flex-shrink-0" />
            <span>Channel Connected</span>
          </div>
          
          {channel?.title && (
            <div className="mb-4 p-2 sm:p-3 bg-zinc-800 rounded-md">
              <div className="text-xs sm:text-sm text-zinc-400">Connected Channel:</div>
              <div className="font-medium text-sm sm:text-base">{channel.title}</div>
            </div>
          )}

          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="flex items-center px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-red-900/30 text-red-400 border border-red-900 rounded-md hover:bg-red-900/50 transition-colors w-full sm:w-auto justify-center sm:justify-start"
            >
              <Trash size={16} className="mr-2" />
              Unlink YouTube Channel
            </button>
          ) : (
            <div className="border border-red-800 rounded-md p-3 bg-red-950/20">
              <p className="text-xs sm:text-sm text-red-400 mb-3">
                Are you sure you want to unlink your YouTube channel? You'll need to reconnect to create content passes.
              </p>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={handleUnlink}
                  disabled={unlinking}
                  className="px-4 py-2 text-xs sm:text-sm bg-red-700 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed w-full"
                >
                  {unlinking ? 'Unlinking...' : 'Confirm Unlink'}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={unlinking}
                  className="px-4 py-2 text-xs sm:text-sm bg-zinc-800 text-white rounded-md hover:bg-zinc-700 w-full"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {status === 'unlinked' && (
        <div>
          <div className="flex items-start mb-4">
            <AlertCircle size={18} className="mr-2 mt-0.5 flex-shrink-0 text-amber-500" />
            <div>
              <h4 className="font-medium text-amber-500 text-sm sm:text-base">No YouTube channel yet</h4>
              <p className="text-zinc-300 mt-1 text-xs sm:text-sm">
                Hook up your channel once, and you can start selling unlisted videos in a snap.
              </p>
            </div>
          </div>
          
          <div className="mb-4 p-2 sm:p-3 border border-zinc-700 rounded-md bg-zinc-800/50">
            <h5 className="font-medium mb-2 text-xs sm:text-sm">Why connect?</h5>
            <ul className="text-xs sm:text-sm text-zinc-400 list-disc pl-4 space-y-1">
              <li>Start earning from your best videos</li>
              <li>You stay in control — we just check ownership</li>
            </ul>
          </div>
          
          <button
            onClick={startOAuth}
            className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-500 transition-colors flex items-center justify-center text-xs sm:text-sm"
          >
            <Youtube size={18} className="mr-2" />
            Verify YouTube Channel
          </button>
          <p className="text-xs text-zinc-500 mt-2">
            P.S. We can't post or edit anything on your channel.
          </p>
        </div>
      )}
    </div>
  );
};

export default YouTubeIntegration; 