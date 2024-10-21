// src/components/pages/UserProfileWallet.tsx

import React, { useState, useEffect } from 'react';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';
import UserInfo from '../common/Profile/UserInfo';
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

const UserProfileWallet: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userVideos, setUserVideos] = useState<UserVideo[]>([]);
  const [userNFTs, setUserNFTs] = useState<UserNFT[]>([]);
  const [userWallet, setUserWallet] = useState<UserWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const tabs = ['Overview', 'Content', 'NFTs', 'Wallet', 'Settings'];

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const profileData = await getMyProfile();
      setUserProfile(profileData);
    } catch (err) {
      console.error('Error fetching profile data:', err);
      setUserProfile(null);
      setError('An error occurred while fetching your profile.');
    }

    try {
      const videosData = await getMyVideos();
      setUserVideos(videosData);
    } catch (err) {
      console.error('Error fetching videos:', err);
      setUserVideos([]);
    }

    try {
      const nftsData = await getMyNFTs();
      setUserNFTs(nftsData);
    } catch (err) {
      console.error('Error fetching NFTs:', err);
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
      setUserWallet(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const calculateCompletionPercentage = (profile: UserProfile) => {
    const totalFields = 4; // name, dob, picture, description
    let completedFields = 0;

    if (profile.name) completedFields += 1;
    if (profile.dob) completedFields += 1;
    if (profile.picture) completedFields += 1;
    if (profile.description) completedFields += 1;

    return Math.round((completedFields / totalFields) * 100);
  };

  return (
    <div className="bg-black text-white min-h-screen">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          {loading ? (
            <Loader />
          ) : error ? (
            <Error message={error} />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                {userProfile ? (
                  <UserInfo userProfile={userProfile} />
                ) : (
                  <div className="text-gray-500">
                    <p>User profile not available.</p>
                  </div>
                )}
                <motion.button
                  onClick={() => setIsEditingProfile(true)}
                  className="mt-4 md:mt-0 px-6 py-2 bg-gradient-to-r from-[#fa7517] to-[#ff9a5a] text-black font-bold rounded-full hover:shadow-lg hover:shadow-[#fa7517]/50 transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {userProfile ? 'Edit Profile' : 'Complete Your Profile'}
                </motion.button>
              </div>

              <TabNav tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />

              <motion.div
                className="bg-black rounded-3xl p-6 shadow-lg"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <AnimatePresence mode="wait">
                  {activeTab === 'Overview' && userProfile && (
                    <OverviewTab key="overview" userProfile={userProfile} userWallet={userWallet} />
                  )}
                  {activeTab === 'Content' && (
                    <ContentTab key="content" videos={userVideos} />
                  )}
                  {activeTab === 'NFTs' && (
                    <NFTsTab key="nfts" nfts={userNFTs} />
                  )}
                  {activeTab === 'Wallet' && (
                    <WalletTab key="wallet" wallet={userWallet} />
                  )}
                  {activeTab === 'Settings' && (
                    <SettingsTab key="settings" />
                  )}
                </AnimatePresence>
              </motion.div>

              {userProfile && (
                <motion.div
                  className="profile-completion mt-8 bg-black rounded-xl p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <div className="flex justify-between items-center">
                    <p className="text-lg font-semibold">
                      Profile Completion: {calculateCompletionPercentage(userProfile)}%
                    </p>
                    {calculateCompletionPercentage(userProfile) < 100 && (
                      <motion.button
                        onClick={() => setIsEditingProfile(true)}
                        className="px-4 py-2 bg-gradient-to-r from-[#fa7517] to-[#ff9a5a] text-black font-bold rounded-full hover:shadow-lg hover:shadow-[#fa7517]/50 transition-all duration-300"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Complete Profile
                      </motion.button>
                    )}
                  </div>
                  <div className="mt-4 bg-gray-700 rounded-full h-4 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[#fa7517] to-[#ff9a5a]"
                      initial={{ width: 0 }}
                      animate={{ width: `${calculateCompletionPercentage(userProfile)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                </motion.div>
              )}

              <AnimatePresence>
                {isEditingProfile && (
                  <Modal onClose={() => setIsEditingProfile(false)}>
                    <ProfileCompletionForm
                      initialData={{
                        name: userProfile?.name,
                        dob: userProfile?.dob,
                        picture: userProfile?.picture,
                        description: userProfile?.description,
                      }}
                      onSuccess={() => {
                        fetchUserData();
                        setIsEditingProfile(false);
                      }}
                      onClose={() => setIsEditingProfile(false)}
                    />
                  </Modal>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
};

export default UserProfileWallet;
