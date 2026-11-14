import React, { useState } from 'react';
import { useYouTubeAuth } from '../../../../../hooks/useYouTubeAuth';
import { toast } from 'react-toastify';
import { Trash, Youtube, AlertCircle, CheckCircle } from 'lucide-react';
import { button, cx, sheen, skeleton, surface } from '../../Business/businessStyles';

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
      const result = await unlink();
      if (result.cleanupStatus === 'pending') {
        toast.info('YouTube is disconnected. Private-data deletion is still being retried.');
      } else {
        toast.success('YouTube disconnected and private data deleted');
      }
      setShowConfirm(false);
    } catch (error) {
      console.error('Failed to unlink YouTube channel:', error);
      toast.error('Failed to unlink YouTube channel');
    } finally {
      setUnlinking(false);
    }
  };

  return (
    <section className={cx(surface.card, 'p-5 md:p-6', className)}>
      <div className={sheen} aria-hidden="true" />
      <div className="relative">
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
          <Youtube className="text-red-500" size={20} aria-hidden="true" />
          YouTube Integration
        </h3>

        {status === 'loading' && (
          <div className="space-y-3" aria-busy="true">
            <p className="text-sm text-gray-400">Checking YouTube connection status...</p>
            <div className={cx(skeleton.block, 'h-12 w-full')} aria-hidden="true" />
          </div>
        )}

        {status === 'linked' && (
          <div>
            <div className="mb-4 flex items-center gap-2 text-sm text-emerald-300">
              <CheckCircle size={18} className="shrink-0" aria-hidden="true" />
              <span>Channel Connected</span>
            </div>

            {channel?.title && (
              <div className="mb-4 rounded-lg border border-gray-800/50 bg-black/40 p-3">
                <div className="text-xs text-gray-400">Connected Channel:</div>
                <div className="mt-0.5 text-sm font-medium text-white">{channel.title}</div>
              </div>
            )}

            {!showConfirm ? (
              <button
                onClick={() => setShowConfirm(true)}
                className={cx(
                  button.secondary,
                  'w-full border-red-500/30 text-red-300 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-200 focus-visible:ring-red-400/50 sm:w-auto',
                )}
              >
                <Trash size={16} aria-hidden="true" />
                Unlink YouTube Channel
              </button>
            ) : (
              <div className="rounded-lg border border-red-500/30 bg-red-500/[0.05] p-3">
                <p className="mb-3 text-sm text-red-200">
                  Are you sure you want to unlink your YouTube channel? You'll need to reconnect to create content passes.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button onClick={handleUnlink} disabled={unlinking} className={cx(button.danger, 'w-full sm:w-auto')}>
                    {unlinking ? 'Unlinking...' : 'Confirm Unlink'}
                  </button>
                  <button
                    onClick={() => setShowConfirm(false)}
                    disabled={unlinking}
                    className={cx(button.ghost, 'w-full justify-center sm:w-auto')}
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
            <div className="mb-4 flex items-start gap-2">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-300" aria-hidden="true" />
              <div>
                <h4 className="text-sm font-medium text-amber-200">No YouTube channel yet</h4>
                <p className="mt-1 text-sm text-gray-300">
                  Hook up your channel once, and you can start selling unlisted videos in a snap.
                </p>
              </div>
            </div>

            <div className="mb-4 rounded-lg border border-gray-800/50 bg-black/40 p-3">
              <h5 className="mb-2 text-xs font-medium text-gray-300">Why connect?</h5>
              <ul className="list-disc space-y-1 pl-4 text-sm text-gray-400">
                <li>Start earning from your best videos</li>
                <li>You stay in control — we just check ownership</li>
              </ul>
            </div>

            <button onClick={() => startOAuth()} className={cx(button.primary, 'w-full sm:w-auto')}>
              <Youtube size={18} aria-hidden="true" />
              Verify YouTube Channel
            </button>
            <p className="mt-2 text-xs text-gray-400">
              P.S. We can't post or edit anything on your channel.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default YouTubeIntegration;
