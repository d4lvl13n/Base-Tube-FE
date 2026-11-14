import React, { useState, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useChannelSelection } from '../../../../contexts/ChannelSelectionContext';
import ChannelPreviewCard from '../../../common/CreatorHub/ChannelPreviewCard';
import { toast } from 'react-toastify';
import NoChannelView from '../NoChannelView';
import { cx, frame, skeleton, surface, text } from '../Business/businessStyles';

/** The card's shape while the channels load: cover, then the stats line. */
const ChannelCardSkeleton: React.FC = () => (
  <div className={surface.card} aria-hidden="true">
    <div className={cx(skeleton.block, 'h-44 rounded-none sm:h-48')} />
    <div className="flex gap-6 border-t border-gray-800/50 px-4 py-3 sm:px-5">
      <div className={cx(skeleton.line, 'w-28')} />
      <div className={cx(skeleton.line, 'w-24')} />
    </div>
  </div>
);

const ChannelList: React.FC = () => {
  const reduceMotion = useReducedMotion();
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
      <div className={frame.page} aria-busy="true">
        <div className={frame.wide}>
          <div className="space-y-2">
            <div className={cx(skeleton.line, 'h-7 w-56')} />
            <div className={cx(skeleton.line, 'w-72')} />
          </div>
          <ChannelCardSkeleton />
          <ChannelCardSkeleton />
        </div>
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
    <div className={frame.page}>
      <div className={frame.wide}>
        <header>
          <h1 className={text.pageTitle}>
            Channel Management
            <span className="ml-2 font-normal tabular-nums text-gray-500">{channels.length}</span>
          </h1>
          <p className={text.pageSubtitle}>
            Manage your channels and their settings
          </p>
        </header>

        <div className="space-y-4">
          {channels.map((channel) => (
            <motion.div
              key={channel.id}
              layout={!reduceMotion}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="relative"
            >
              <ChannelPreviewCard
                channel={channel}
                onDeleted={() => handleChannelDeleted(channel.id.toString())}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChannelList;
