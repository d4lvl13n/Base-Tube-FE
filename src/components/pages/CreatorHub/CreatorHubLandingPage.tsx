// src/components/pages/CreatorHub/CreatorHubLandingPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import CreatorDashboard from './CreatorDashboard';
import NewCreatorView from './NewCreatorView';
import Loader from '../../common/Loader';
import Error from '../../common/Error';
import WhyCreateChannelSection from '../../common/CreatorHub/WhyCreateChannelSection';
import ResourcesSection from '../../common/CreatorHub/ResourcesSection';
import { useChannels } from '../../../context/ChannelContext';
import { getMyProfile } from '../../../api/profile';
import { UserProfile } from '../../../types/user';

const CreatorHubLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { channels, loading, error, refreshChannels } = useChannels();
  const { user: clerkUser } = useUser();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await getMyProfile();
        setUserProfile(profile);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
    refreshChannels();
  }, []);

  const hasChannel = channels.length > 0;

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <Error message={error} />;
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