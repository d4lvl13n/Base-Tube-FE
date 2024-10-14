// src/components/common/Profile/OverviewTab.tsx

import React from 'react';
import { DollarSign, Hexagon, BarChart2, Video } from 'lucide-react';
import { UserProfile, UserWallet } from '../../../types/user';
import OverviewCard from './OverviewCard';

interface OverviewTabProps {
  userProfile: UserProfile;
  userWallet: UserWallet | null;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ userProfile, userWallet }) => {
  return (
    <div className="grid grid-cols-2 gap-6">
      <OverviewCard
        title="$TUBE Balance"
        value={userWallet?.tubeBalance || 0}
        icon={<DollarSign size={24} />}
      />
      <OverviewCard
        title="NFTs Owned"
        value={userProfile.nftCount || 0}
        icon={<Hexagon size={24} />}
      />
      <OverviewCard
        title="Total Earnings"
        value={userWallet?.totalEarnings || '$0'}
        icon={<BarChart2 size={24} />}
      />
      <OverviewCard
        title="Content Created"
        value={`${userProfile.videoCount || 0} videos`}
        icon={<Video size={24} />}
      />
    </div>
  );
};

export default OverviewTab;
