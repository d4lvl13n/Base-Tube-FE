// src/components/pages/CreatorHub/CreatorHubLandingPage.tsx
import React from 'react';
import { useUser } from '@clerk/clerk-react';
import CreatorDashboard from './CreatorDashboard';
import NewCreatorView from './NewCreatorView';
import Loader from '../../common/Loader';
import Error from '../../common/Error';
import WhyCreateChannelSection from '../../common/CreatorHub/WhyCreateChannelSection';
import ResourcesSection from '../../common/CreatorHub/ResourcesSection';
import { getMyProfile } from '../../../api/profile';
import { useQuery } from '@tanstack/react-query';
import { getMyChannels } from '../../../api/channel';

const CreatorHubLandingPage: React.FC = () => {
  const { user: clerkUser } = useUser();
  
  const { 
    data: userProfile,
    isLoading: profileLoading 
  } = useQuery({
    queryKey: ['userProfile'],
    queryFn: getMyProfile,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  const {
    data: channels = [],
    isLoading: channelsLoading,
    error
  } = useQuery({
    queryKey: ['myChannels'],
    queryFn: () => getMyChannels(1, 10, 'createdAt'),
    staleTime: 5 * 60 * 1000
  });

  const loading = profileLoading || channelsLoading;
  const hasChannel = channels.length > 0;

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <Error message={error.message} />;
  }

  return (
    <div className="flex-1">
      {/* Dynamic Content Based on Channel Presence */}
      {hasChannel ? (
        <CreatorDashboard 
          userProfile={userProfile}
          channels={channels} 
          clerkUser={clerkUser}
        />
      ) : (
        <NewCreatorView />
      )}
      {/* Static Information Sections */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <WhyCreateChannelSection />
        <ResourcesSection />
      </div>
    </div>
  );
};

export default CreatorHubLandingPage;