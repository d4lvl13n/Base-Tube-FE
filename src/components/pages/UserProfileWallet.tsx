import React, { useState } from 'react';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';
import TabNav from '../common/TabNav';
import Loader from '../common/Loader';
import Error from '../common/Error';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/clerk-react';
import { ExtendedUser, UserProfile, UserWallet, ProfileSettings } from '../../types/user';
import DashboardTab from '../common/Profile/DashboardTab';
import HistoryTab from '../common/Profile/HistoryTab';
import WalletTab from '../common/Profile/WalletTab';
import ReferralsTab from '../common/Profile/ReferralsTab';
import SettingsTab from '../common/Profile/SettingsTab';

import { useQuery } from '@tanstack/react-query';
import {
  getMyProfile,
  getMyWallet,
  getProfileSettings,
} from '../../api/profile';

const UserProfileWallet: React.FC = () => {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const [activeTab, setActiveTab] = useState('Dashboard');

  const tabs = ['Dashboard', 'History', 'Wallet', 'Referrals', 'Settings'];

  const { 
    error: profileError,
    isLoading: isProfileLoading
  } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: getMyProfile,
    enabled: isClerkLoaded
  });

  const {
    data: userWallet,
    error: walletError,
    isLoading: isWalletLoading
  } = useQuery<UserWallet>({
    queryKey: ['wallet'],
    queryFn: getMyWallet,
    enabled: isClerkLoaded
  });

  const {
    data: userSettings,
    error: settingsError,
    isLoading: isSettingsLoading
  } = useQuery<ProfileSettings>({
    queryKey: ['settings'],
    queryFn: getProfileSettings,
    enabled: isClerkLoaded
  });

  const errors = {
    profile: profileError?.message || '',
    wallet: walletError?.message || '',
    settings: settingsError?.message || ''
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'Dashboard':
        return clerkUser ? (
          <DashboardTab
            userProfile={clerkUser as ExtendedUser}
            userWallet={userWallet}
            errors={errors}
          />
        ) : (
          <Error message={errors.profile || 'Failed to load user data'} />
        );
      case 'History':
        return <HistoryTab errors={errors} />;
      case 'Wallet':
        return (
          <WalletTab 
            wallet={userWallet}
            isLoading={isWalletLoading}
            error={walletError}
          />
        );
      case 'Referrals':
        return <ReferralsTab errors={errors} />;
      case 'Settings':
        return userSettings ? (
          <SettingsTab
            settings={userSettings}
            errors={errors}
          />
        ) : (
          <Error message={errors.settings || 'Failed to load settings data'} />
        );
      default:
        return null;
    }
  };

  if (!isClerkLoaded || isProfileLoading || isWalletLoading || isSettingsLoading) {
    return <Loader />;
  }

  return (
    <div className="bg-black text-white min-h-screen">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-7xl mx-auto space-y-8"
          >
            {/* Navigation Tabs with Creator Hub styling */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm relative overflow-hidden"
              style={{
                boxShadow: `
                  0 0 20px 5px rgba(250, 117, 23, 0.1),
                  0 0 40px 10px rgba(250, 117, 23, 0.05),
                  inset 0 0 60px 15px rgba(250, 117, 23, 0.03)
                `
              }}
            >
              <div className="relative z-10">
                <TabNav
                  tabs={tabs}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="mt-6"
                  >
                    {renderActiveTab()}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="absolute inset-0 bg-gradient-to-br from-[#fa751708] to-transparent" />
              
              <motion.div
                className="absolute inset-0 bg-[#fa7517] opacity-0 blur-2xl transition-opacity duration-300"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 0.03 }}
              />
            </motion.div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default UserProfileWallet;