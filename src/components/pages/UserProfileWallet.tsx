import React, { useState, useEffect } from 'react';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';
import OverviewTab from '../common/Profile/OverviewTab';
import ContentTab from '../common/Profile/ContentTab';
import NFTsTab from '../common/Profile/NFTsTab';
import WalletTab from '../common/Profile/WalletTab';
import SettingsTab from '../common/Profile/SettingsTab';
import TabNav from '../common/TabNav';
import {
  getMyProfile,
  getMyVideos,
  getMyNFTs,
  getMyWallet,
} from '../../api/profile';
import {
  UserProfile,
  UserVideo,
  UserNFT,
  UserWallet,
} from '../../types/user';
import ProfileCompletionForm from '../common/Profile/ProfileCompletionForm';
import Modal from '../common/Modal';
import Loader from '../common/Loader';
import Error from '../common/Error';
import { motion, AnimatePresence } from 'framer-motion';
import UserProfileHeader from '../common/Profile/UserProfileHeader';
import ProfileCompletionBar from '../common/Profile/ProfileCompletionBar';
import { useUser } from '@clerk/clerk-react';

const UserProfileWallet: React.FC = () => {
  const { user: clerkUser } = useUser();
  const [activeTab, setActiveTab] = useState('Overview');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userVideos, setUserVideos] = useState<UserVideo[]>([]);
  const [userNFTs, setUserNFTs] = useState<UserNFT[]>([]);
  const [userWallet, setUserWallet] = useState<UserWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const tabs = ['Overview', 'Content', 'NFTs', 'Wallet', 'Settings'];

  const fetchUserData = async () => {
    setLoading(true);
    const newErrors: { [key: string]: string } = {};

    try {
     const profileData = await getMyProfile();
      console.log('Fetched profile data:', profileData);
      setUserProfile(profileData); // Make sure you're setting the data property
    } catch (err) {
      console.error('Error fetching profile data:', err);
      newErrors.profile = 'Failed to load profile data';
    }

    try {
      const videosData = await getMyVideos();
      setUserVideos(videosData);
    } catch (err) {
      console.error('Error fetching videos:', err);
      newErrors.videos = 'Failed to load videos';
      setUserVideos([]);
    }

    try {
      const nftsData = await getMyNFTs();
      setUserNFTs(nftsData);
    } catch (err) {
      console.error('Error fetching NFTs:', err);
      newErrors.nfts = 'Failed to load NFTs';
      setUserNFTs([]);
    }

    try {
      const walletData = await getMyWallet();
      if (!walletData.transactions) {
        walletData.transactions = [];
      }
      setUserWallet(walletData);
    } catch (err) {
      console.error('Error fetching wallet data:', err);
      newErrors.wallet = 'Failed to load wallet data';
      setUserWallet(null);
    }

    setErrors(newErrors);
    setLoading(false);
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
  setUserProfile(updatedProfile);
  setIsEditingProfile(false);
  fetchUserData(); // Fetch the latest data from the server
};

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'Overview':
        return userProfile && userWallet ? (
          <OverviewTab userProfile={userProfile} userWallet={userWallet} />
        ) : (
          <Error message={errors.profile || errors.wallet || 'Failed to load overview data'} />
        );
      case 'Content':
        return <ContentTab videos={userVideos} error={errors.videos} />;
      case 'NFTs':
        return <NFTsTab nfts={userNFTs} error={errors.nfts} />;
      case 'Wallet':
        return userWallet ? (
          <WalletTab wallet={userWallet} />
        ) : (
          <Error message={errors.wallet || 'Failed to load wallet data'} />
        );
      case 'Settings':
        return <SettingsTab />;
      default:
        return null;
    }
  };

  if (loading) {
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
                onEditProfile={() => setIsEditingProfile(true)} 
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
            {userProfile && (
              <ProfileCompletionBar 
                userProfile={userProfile} 
                onEditProfile={() => setIsEditingProfile(true)} 
              />
            )}
            <AnimatePresence>
              {isEditingProfile && (
                <Modal onClose={() => setIsEditingProfile(false)}>
                  <ProfileCompletionForm
                    initialData={{
                      username: userProfile?.username, // Changed from 'name' to 'username'
                      dob: userProfile?.dob,
                      picture: userProfile?.picture,
                      description: userProfile?.description,
                      clerkImageUrl: clerkUser?.imageUrl,
                    }}
                    onSuccess={handleProfileUpdate}
                    onClose={() => setIsEditingProfile(false)}
                  />  
                </Modal>
              )}
            </AnimatePresence>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default UserProfileWallet;
