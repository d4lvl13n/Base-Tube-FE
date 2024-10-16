// src/components/Profile/UserProfileWallet.tsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';
import FloatingNavigation from '../common/FloatingNavigation';
import UserInfo from '../common/Profile/UserInfo';
import OverviewTab from '../common/Profile/OverviewTab';
import ContentTab from '../common/Profile/ContentTab';
import NFTsTab from '../common/Profile/NFTsTab';
import WalletTab from '../common/Profile/WalletTab';
import SettingsTab from '../common/Profile/SettingsTab';
import FloatingActionButton from '../common/FloatingActionButton';
import TabNav from '../common/TabNav';
import { getMyNFTs, getMyProfile, getMyVideos, getMyWallet } from '../../api/profile';
import { UserProfile, UserVideo, UserNFT, UserWallet } from '../../types/user';
import PlaceholderVideoCard from '../common/PlaceHolderVideoCard';

const UserProfileWallet: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userVideos, setUserVideos] = useState<UserVideo[]>([]);
  const [userNFTs, setUserNFTs] = useState<UserNFT[]>([]);
  const [userWallet, setUserWallet] = useState<UserWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tabs = ['Overview', 'Content', 'NFTs', 'Wallet', 'Settings'];

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const [profileData, videosData, nftsData, walletData] = await Promise.allSettled([
          getMyProfile(),
          getMyVideos(),
          getMyNFTs(),
          getMyWallet(),
        ]);

        if (profileData.status === 'fulfilled') setUserProfile(profileData.value);
        if (videosData.status === 'fulfilled') setUserVideos(videosData.value);
        if (nftsData.status === 'fulfilled') setUserNFTs(nftsData.value);
        if (walletData.status === 'fulfilled') setUserWallet(walletData.value);

        if (profileData.status === 'rejected') setError('Failed to fetch profile data');
      } catch (err) {
        setError('An error occurred while fetching user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const renderPlaceholderContent = () => {
    switch (activeTab) {
      case 'Overview':
        return <OverviewTab userProfile={placeholderProfile} userWallet={placeholderWallet} />;
      case 'Content':
        return (
          <div className="grid grid-cols-3 gap-4">
            {Array(6)
              .fill(null)
              .map((_, index) => (
                <PlaceholderVideoCard key={index} size="normal" />
              ))}
          </div>
        );
      case 'NFTs':
        return (
          <div className="grid grid-cols-3 gap-4">
            {Array(6)
              .fill(null)
              .map((_, index) => (
                <div key={index} className="bg-gray-800 rounded-xl h-48 animate-pulse"></div>
              ))}
          </div>
        );
      case 'Wallet':
        return <WalletTab wallet={placeholderWallet} />;
      case 'Settings':
        return <SettingsTab />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-black text-white min-h-screen">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          {userProfile ? (
            <UserInfo userProfile={userProfile} />
          ) : (
            <div className="bg-gray-800 p-4 rounded-lg mb-6 h-32 animate-pulse"></div>
          )}

          <TabNav tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />

          <motion.div
            className="bg-gray-900 bg-opacity-70 rounded-3xl p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{
              boxShadow: `0 0 20px 5px rgba(250, 117, 23, 0.3), 
                          0 0 60px 10px rgba(250, 117, 23, 0.2), 
                          0 0 100px 20px rgba(250, 117, 23, 0.1)`,
            }}
          >
            {loading ? (
              renderPlaceholderContent()
            ) : (
              <>
                {activeTab === 'Overview' && userProfile && (
                  <OverviewTab userProfile={userProfile} userWallet={userWallet} />
                )}
                {activeTab === 'Content' && <ContentTab videos={userVideos} />}
                {activeTab === 'NFTs' && <NFTsTab nfts={userNFTs} />}
                {activeTab === 'Wallet' && <WalletTab wallet={userWallet} />}
                {activeTab === 'Settings' && <SettingsTab />}
              </>
            )}
          </motion.div>

          {error && (
            <div className="mt-4 p-4 bg-yellow-600 text-white rounded-lg">
              {error}
            </div>
          )}
        </main>
      </div>
      <FloatingNavigation />
      <FloatingActionButton />
    </div>
  );
};

const placeholderProfile: UserProfile = {
  id: 0,
  name: 'Loading...',
  email: '',
  picture: '',
  subscribers: 0,
  totalViews: 0,
  nftCount: 0,
  videoCount: 0,
  createdAt: '',
  updatedAt: '',
};

const placeholderWallet: UserWallet = {
  tubeBalance: 0,
  totalEarnings: '$0',
  transactions: [],
};

export default UserProfileWallet;
