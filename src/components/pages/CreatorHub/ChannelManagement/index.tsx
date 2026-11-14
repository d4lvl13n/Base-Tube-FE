import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Hexagon, Plus, BarChart3 } from 'lucide-react';
import { useChannelData } from '../../../../hooks/useChannelData';
import EditChannelModal from './components/EditChannelModal';
import ChannelPreviewCard from '../../../common/CreatorHub/ChannelPreviewCard';
import YouTubeIntegration from './components/YouTubeIntegration';
import DeleteChannel from './components/DeleteChannel';
import ChannelList from './ChannelList';
import { EmptyState } from '../Business/BusinessUi';
import { button, cx, frame, sheen, skeleton, surface, text } from '../Business/businessStyles';

/** One channel reads in a narrower column than the Analytics measure. */
const NARROW = 'mx-auto max-w-4xl space-y-6 px-4 md:px-6';

const ChannelManagement: React.FC = () => {
  const navigate = useNavigate();
  // The URL param is named 'channelId' but could be either an ID or handle
  const { channelId } = useParams();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Use the custom hook instead of direct API call - it handles both IDs and handles
  const {
    channel,
    isLoading,
    error
  } = useChannelData(channelId);

  if (isLoading) {
    return (
      <div className={frame.page} aria-busy="true">
        <div className={NARROW}>
          <div className={cx(skeleton.line, 'w-32')} />
          <div className={surface.card} aria-hidden="true">
            <div className={cx(skeleton.block, 'h-44 rounded-none sm:h-48')} />
            <div className="flex gap-6 border-t border-gray-800/50 px-4 py-3 sm:px-5">
              <div className={cx(skeleton.line, 'w-28')} />
              <div className={cx(skeleton.line, 'w-24')} />
            </div>
          </div>
          <div className={cx(surface.card, 'space-y-3 p-5 md:p-6')} aria-hidden="true">
            <div className={cx(skeleton.line, 'w-40')} />
            <div className={cx(skeleton.block, 'h-12 w-full')} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !channel) {
    return (
      <div className={frame.page}>
        <div className={NARROW}>
          <EmptyState
            icon={AlertCircle}
            tone="error"
            role="alert"
            title="Failed to load channel"
            action={
              <button onClick={() => navigate('/creator-hub/channels')} className={button.secondary}>
                Go Back
              </button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className={frame.page}>
      <div className={channelId ? NARROW : frame.wide}>
        {channelId ? (
          // Single channel view
          <div className="relative space-y-6">
            <button onClick={() => navigate('/creator-hub/channels')} className={cx(button.ghost, '-ml-2.5')}>
              <ArrowLeft size={16} aria-hidden="true" />
              Back to Channels
            </button>

            <ChannelPreviewCard
              channel={channel}
              onUpdate={() => {
                setIsEditModalOpen(false);
              }}
              onDeleted={() => navigate('/creator-hub/channels')}
            />

            <YouTubeIntegration />

            <DeleteChannel
              channelId={channelId}
              channelName={channel?.name || 'this channel'}
              onDeleted={() => navigate('/creator-hub/channels')}
            />
          </div>
        ) : (
          // Channel list view
          <>
            <header>
              <h1 className={text.pageTitle}>Channel Management</h1>
              <p className={text.pageSubtitle}>
                Manage your channels and connectivity with other platforms
              </p>
            </header>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Left column (1/3 width on large screens, full width on mobile) */}
              <div className="order-2 space-y-6 lg:order-1 lg:col-span-1">
                <YouTubeIntegration />

                {/* Additional integrations can be added here */}
                <section className={cx(surface.card, 'p-5 md:p-6')}>
                  <h3 className="mb-2 flex items-center gap-2 text-base font-semibold text-white">
                    <Hexagon className="text-gray-400" size={20} aria-hidden="true" />
                    Channel Analytics
                  </h3>
                  <p className="mb-4 text-sm text-gray-400">
                    View detailed analytics and performance metrics for your channel.
                  </p>
                  <Link to="/creator-hub/analytics" className={button.secondary}>
                    <BarChart3 size={16} aria-hidden="true" />
                    View Analytics
                  </Link>
                </section>
              </div>

              {/* Right column (2/3 width on large screens, full width on mobile) */}
              <div className="order-1 lg:order-2 lg:col-span-2">
                <section className={cx(surface.card, 'p-5 md:p-6')}>
                  <div className={sheen} aria-hidden="true" />
                  <div className="relative mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-base font-semibold text-white">Your Channels</h3>
                    <Link to="/creator-hub/channels/new" className={button.primary}>
                      <Plus size={16} aria-hidden="true" />
                      Create New Channel
                    </Link>
                  </div>

                  <ChannelList />
                </section>
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
