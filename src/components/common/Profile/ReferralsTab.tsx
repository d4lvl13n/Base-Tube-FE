// src/components/common/Profile/ReferralsTab.tsx

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Gift, 
  Trophy, 
  Coins,
  Share2,
  Copy,
  AlertCircle
} from 'lucide-react';
import EmptyState from '../EmptyState';
import StatsCard from '../../pages/CreatorHub/StatsCard';

interface ReferralsTabProps {
  errors?: { [key: string]: string };
}

const ReferralsTab: React.FC<ReferralsTabProps> = ({ errors }) => {
  if (errors?.referrals) {
    return <EmptyState 
      title="Error Loading Referrals"
      description={errors.referrals}
      imageSrc="/assets/error.svg"
    />;
  }

  // Placeholder referral code
  const referralCode = "COMING-SOON";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#fa7517] to-orange-400 mb-3">
          Referral Program
        </h1>
        <p className="text-gray-400 text-lg">Invite friends and earn rewards together</p>
      </div>

      {/* Coming Soon Notice */}
      <motion.div 
        className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <AlertCircle className="w-5 h-5 text-orange-500" />
        <p className="text-orange-500">
          Our referral program is coming soon! Stay tuned for exciting rewards and benefits.
        </p>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 opacity-50">
        <StatsCard 
          icon={Users}
          title="Total Referrals"
          value="0"
          change={0}
        />
        <StatsCard 
          icon={Gift}
          title="Pending Invites"
          value="0"
          change={0}
        />
        <StatsCard 
          icon={Trophy}
          title="Successful Referrals"
          value="0"
          change={0}
        />
        <StatsCard 
          icon={Coins}
          title="Rewards Earned"
          value="0 TUBE"
          change={0}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Referral Link Section */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="lg:col-span-2 p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm relative overflow-hidden"
          style={{
            boxShadow: `
              0 0 20px 5px rgba(250, 117, 23, 0.1),
              0 0 40px 10px rgba(250, 117, 23, 0.05),
              inset 0 0 60px 15px rgba(250, 117, 23, 0.03)
            `
          }}
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-900/50 rounded-lg">
                  <Share2 className="w-5 h-5 text-[#fa7517]" />
                </div>
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                  Your Referral Link
                </h2>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-4 bg-gray-900/50 rounded-lg flex items-center justify-between opacity-50">
                <code className="text-gray-400">{referralCode}</code>
                <button 
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  disabled
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  className="p-4 bg-[#fa7517]/50 text-white rounded-xl font-semibold transition-colors opacity-50 cursor-not-allowed"
                  disabled
                >
                  Share on Twitter
                </button>
                <button 
                  className="p-4 bg-gray-900/50 text-white rounded-xl font-semibold transition-colors opacity-50 cursor-not-allowed"
                  disabled
                >
                  Copy Link
                </button>
              </div>
            </div>
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-br from-[#fa751708] to-transparent" />
          
          <motion.div
            className="absolute inset-0 bg-[#fa7517] opacity-0 blur-2xl transition-opacity duration-300"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 0.03 }}
          />
        </motion.div>

        {/* Rewards Info */}
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
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gray-900/50 rounded-lg">
                <Gift className="w-5 h-5 text-[#fa7517]" />
              </div>
              <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                Rewards
              </h2>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-900/50 rounded-lg opacity-50">
                <p className="text-gray-400 text-sm">Reward per Referral</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mt-1">
                  Coming Soon
                </p>
              </div>
              
              <div className="p-4 bg-gray-900/50 rounded-lg opacity-50">
                <p className="text-gray-400 text-sm">Your Tier</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mt-1">
                  Bronze
                </p>
              </div>

              <div className="p-4 bg-gray-900/50 rounded-lg opacity-50">
                <p className="text-gray-400 text-sm">Next Tier</p>
                <div className="mt-2 w-full bg-gray-800 rounded-full h-2">
                  <div className="bg-[#fa7517] h-2 rounded-full w-0"></div>
                </div>
                <p className="text-sm text-gray-400 mt-1">0/5 referrals to Silver</p>
              </div>
            </div>
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-br from-[#fa751708] to-transparent" />
          
          <motion.div
            className="absolute inset-0 bg-[#fa7517] opacity-0 blur-2xl transition-opacity duration-300"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 0.03 }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ReferralsTab;