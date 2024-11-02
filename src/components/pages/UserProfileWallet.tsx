import React, { useState, useEffect, useCallback } from 'react';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';
import OverviewTab from '../common/Profile/OverviewTab';
import ContentTab from '../common/Profile/ContentTab';
import NFTsTab from '../common/Profile/NFTsTab';
import WalletTab from '../common/Profile/WalletTab';
import TabNav from '../common/TabNav';
import {
  getMyProfile,
  getMyVideos,
  getMyNFTs,
  getMyWallet,
} from '../../api/profile';
import { getMyChannels } from '../../api/channel';
import {
  UserProfile,
  UserVideo,
  UserNFT,
  UserWallet,
} from '../../types/user';
import { Channel } from '../../types/channel';
import Loader from '../common/Loader';
import Error from '../common/Error';
import { motion, AnimatePresence } from 'framer-motion';
import UserProfileHeader from '../common/Profile/UserProfileHeader';
import { useUser } from '@clerk/clerk-react';

const UserProfileWallet: React.FC = () => {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const [activeTab, setActiveTab] = useState('Overview');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userVideos, setUserVideos] = useState<UserVideo[]>([]);
  const [userNFTs, setUserNFTs] = useState<UserNFT[]>([]);
  const [userWallet, setUserWallet] = useState<UserWallet | null>(null);
  const [userChannels, setUserChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const tabs = ['Overview', 'Content', 'NFT Content Passes', 'Wallet'];

  const [refreshChannels, setRefreshChannels] = useState<boolean>(false);


  const fetchUserData = async () => {
  setLoading(true);
  const newErrors: { [key: string]: string } = {};

  try {
    const [profileData, videosData, nftsData, walletData, channelsData] = await Promise.all([
      getMyProfile().catch((err) => {
        console.error('Error fetching profile data:', err);
        newErrors.profile = 'Failed to load profile data';
        return null;
      }),
      getMyVideos().catch((err) => {
        console.error('Error fetching videos:', err);
        newErrors.videos = 'Failed to load videos';
        return [];
      }),
      getMyNFTs().catch((err) => {
        console.error('Error fetching NFTs:', err);
        newErrors.nfts = 'Failed to load NFTs';
        return [];
      }),
      getMyWallet().catch((err) => {
        console.error('Error fetching wallet data:', err);
        newErrors.wallet = 'Failed to load wallet data';
        return null;
      }),
      getMyChannels().catch((err) => { // No token parameter needed
        console.error('Error fetching channels:', err);
        newErrors.channels = 'Failed to load channels';
        return [];
      }),
    ]);

    // Set states based on the results
    if (profileData) setUserProfile(profileData);
    setUserVideos(videosData);
    setUserNFTs(nftsData);
    if (walletData) {
      setUserWallet({
        ...walletData,
        transactions: walletData.transactions || [],
      });
    }
    setUserChannels(channelsData); // channelsData is Channel[]
  } catch (err) {
    console.error('Error in fetchUserData:', err);
    newErrors.general = 'Failed to load user data';
  } finally {
    setErrors(newErrors);
    setLoading(false);
    }
  };
  
  useEffect(() => {
    if (isClerkLoaded) {
      fetchUserData();
    }
  }, [isClerkLoaded, refreshChannels]);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'Overview':
        return userProfile && userWallet ? (
          <OverviewTab userProfile={userProfile} userWallet={userWallet} />
        ) : (
          <Error message={errors.profile || errors.wallet || 'Failed to load overview data'} />
        );
      case 'Content':
        return (
          <ContentTab 
            videos={userVideos} 
            channels={userChannels} 
            error={errors.videos || errors.channels} 
            loading={loading}
          />
        );
      case 'NFTs':
        return <NFTsTab nfts={userNFTs} error={errors.nfts} />;
      case 'Wallet':
        return userWallet ? (
          <WalletTab wallet={userWallet} />
        ) : (
          <Error message={errors.wallet || 'Failed to load wallet data'} />
        );
      default:
        return null;
    }
  };

  if (loading || !isClerkLoaded) {
    return <Loader />;
  }

  return (
    <div className="bg-gradient-to-br from-black to-gray-900 text-white min-h-screen">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-6xl mx-auto"
          >
            {userProfile ? (
              <UserProfileHeader 
                userProfile={userProfile} 
                clerkUser={clerkUser} 
              />
            ) : (
              <Error message={errors.profile || 'Failed to load profile data'} />
            )}
            <TabNav tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-3xl p-6 shadow-lg mt-6"
              >
                {renderActiveTab()}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default UserProfileWallet;