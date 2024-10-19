// src/components/common/Profile/OverviewTab.tsx

import React from 'react';
import { UserProfile, UserWallet } from '../../../types/user';

interface OverviewTabProps {
  userProfile: UserProfile;
  userWallet: UserWallet | null;
  loading?: boolean;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ userProfile, userWallet, loading = false }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Personal Information */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-xl font-bold mb-2">Personal Information</h3>
        <p>
          <strong>Name:</strong> {userProfile.name}
        </p>
        <p>
          <strong>Email:</strong> {userProfile.email}
        </p>
        <p>
          <strong>Bio:</strong> {userProfile.bio || 'No bio available.'}
        </p>
      </div>

      {/* Wallet Information */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-xl font-bold mb-2">Wallet</h3>
        {userWallet ? (
          <>
            <p>
              <strong>Address:</strong> {userWallet.walletAddress}
            </p>
            <p>
              <strong>Balance:</strong> {userWallet.balance} ETH
            </p>
            <p>
              <strong>TUBE Balance:</strong> {userWallet.tubeBalance} TUBE
            </p>
          </>
        ) : (
          <p>No wallet connected.</p>
        )}
      </div>

      {/* Additional Statistics */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-xl font-bold mb-2">Statistics</h3>
        <p>
          <strong>Subscribers:</strong> {userProfile.subscribers}
        </p>
        <p>
          <strong>Total Views:</strong> {userProfile.totalViews}
        </p>
        <p>
          <strong>Videos:</strong> {userProfile.videoCount}
        </p>
        <p>
          <strong>NFTs:</strong> {userProfile.nftCount}
        </p>
      </div>
    </div>
  );
};

export default OverviewTab;
