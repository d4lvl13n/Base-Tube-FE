import React, { useState } from 'react';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';
import TabNav from '../common/TabNav';
import Loader from '../common/Loader';
import Error from '../common/Error';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/clerk-react';
import { useAuth } from '../../contexts/AuthContext';
import { ExtendedUser, UserProfile, UserWallet, ProfileSettings } from '../../types/user';
import DashboardTab from '../common/Profile/DashboardTab';
import HistoryTab from '../common/Profile/HistoryTab';
import WalletTab from '../common/Profile/WalletTab';
import ReferralsTab from '../common/Profile/ReferralsTab';
import SettingsTab from '../common/Profile/SettingsTab';
import ProfileInfoCard from '../common/Profile/ProfileInfoCard';

import { useQuery } from '@tanstack/react-query';
import {
  getMyProfile,
  getMyWallet,
  getProfileSettings,
} from '../../api/profile';

const UserProfileWallet: React.FC = () => {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const { isAuthenticated, user: web3User } = useAuth();
  const [activeTab, setActiveTab] = useState('Dashboard');

  const tabs = ['Dashboard', 'History', 'Wallet', 'Referrals', 'Settings'];

  const { 
    error: profileError,
    isLoading: isProfileLoading
  } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: getMyProfile,
    enabled: isClerkLoaded && !isAuthenticated
  });

  const {
    data: userWallet,
    error: walletError,
    isLoading: isWalletLoading
  } = useQuery<UserWallet>({
    queryKey: ['wallet'],
    queryFn: getMyWallet,
    enabled: isClerkLoaded && !isAuthenticated
  });

  const {
    data: userSettings,
    error: settingsError,
    isLoading: isSettingsLoading
  } = useQuery<ProfileSettings>({
    queryKey: ['settings'],
    queryFn: getProfileSettings,
    enabled: isClerkLoaded && !isAuthenticated
  });

  const errors = {
    profile: profileError?.message || '',
    wallet: walletError?.message || '',
    settings: settingsError?.message || ''
  };

  const activeUser = isAuthenticated && web3User ? web3User : clerkUser;

  // Add mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'Dashboard':
        return activeUser ? (
          <DashboardTab
            userProfile={activeUser as ExtendedUser}
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
        if (!isAuthenticated) {
          return userSettings ? (
            <SettingsTab
              settings={userSettings}
              errors={errors}
            />
          ) : (
            <Error message={errors.settings || 'Failed to load settings data'} />
          );
        } else {
          return (
            <SettingsTab
              settings={{} as ProfileSettings}
              errors={errors}
            />
          );
        }
      default:
        return null;
    }
  };

  const isLoadingAll = !isClerkLoaded ||
    (!isAuthenticated && (isProfileLoading || isWalletLoading || isSettingsLoading));

  if (isLoadingAll) {
    return <Loader />;
  }

  return (
    <div className="bg-black text-white min-h-screen relative">
      <style>
        {`
          @media (max-width: 768px) {
            .hide-on-mobile {
              display: none;
            }
          }
          @media (min-width: 769px) {
            .hide-on-desktop {
              display: none;
            }
          }
        `}
      </style>

      <Header />
      <div className="flex pt-20">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 min-h-[calc(100vh-5rem)]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-7xl mx-auto space-y-8"
          >
            {/* Profile Info Card */}
            {activeUser && (
              <ProfileInfoCard profile={activeUser as ExtendedUser} />
            )}

            {/* Navigation Tabs with Mobile Optimization */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="p-4 md:p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm relative"
              style={{
                boxShadow: `
                  0 0 20px 5px rgba(250, 117, 23, 0.1),
                  0 0 40px 10px rgba(250, 117, 23, 0.05),
                  inset 0 0 60px 15px rgba(250, 117, 23, 0.03)
                `
              }}
            >
              <div className="relative z-10">
                {/* Mobile Tab Selector */}
                <div className="hide-on-desktop mb-4">
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="w-full p-3 flex items-center justify-between bg-gray-900/50 rounded-lg border border-gray-800/30"
                  >
                    <span className="text-white font-medium">{activeTab}</span>
                    <motion.svg
                      animate={{ rotate: isMobileMenuOpen ? 180 : 0 }}
                      className="w-5 h-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </motion.svg>
                  </button>

                  <AnimatePresence>
                    {isMobileMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-xl rounded-lg border border-gray-800/30 shadow-xl z-50 overflow-hidden"
                      >
                        {tabs.map((tab) => (
                          <button
                            key={tab}
                            onClick={() => {
                              setActiveTab(tab);
                              setIsMobileMenuOpen(false);
                            }}
                            className={`w-full p-3 text-left transition-colors
                              ${activeTab === tab 
                                ? 'bg-[#fa7517]/10 text-[#fa7517]' 
                                : 'text-gray-300 hover:bg-gray-800/50'
                              }`}
                          >
                            {tab}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Desktop Tabs */}
                <div className="hide-on-mobile">
                  <TabNav
                    tabs={tabs}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                  />
                </div>
                
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