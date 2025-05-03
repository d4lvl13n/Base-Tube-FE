// src/components/pages/CreatorHub/CreatorHubLandingPage.tsx
import React from 'react';
import { useUser } from '@clerk/clerk-react';
import CreatorDashboard from './CreatorDashboard';
import NewCreatorView from './NewCreatorView';
import Loader from '../../common/Loader';
import ChannelPreviewCard from '../../common/CreatorHub/ChannelPreviewCard';
import { useChannelSelection } from '../../../contexts/ChannelSelectionContext';

const CreatorHubLandingPage: React.FC = () => {
  const { user: clerkUser } = useUser();
  const { selectedChannel, channels, isLoading, selectedChannelId } = useChannelSelection();

  if (isLoading) return <Loader />;

  const hasChannel = channels.length > 0;

  return (
    <div className="bg-black text-white min-h-screen pt-16">
      {hasChannel && selectedChannel && (
        <ChannelPreviewCard channel={selectedChannel} />
      )}

      <div className="flex-1">
        {hasChannel ? (
          <CreatorDashboard 
            userProfile={null}
            channels={channels}
            clerkUser={clerkUser}
            selectedChannelId={selectedChannelId}
          />
        ) : (
          <NewCreatorView />
        )}
      </div>
    </div>
  );
};

export default CreatorHubLandingPage;