// src/components/common/Profile/OverviewTab.tsx

import React from 'react';
import { UserProfile, UserWallet } from '../../../types/user';
import OverviewCard from './OverviewCard';
import { FaRegEye, FaVideo, FaShapes, FaWallet } from 'react-icons/fa';
import { motion } from 'framer-motion';

interface OverviewTabProps {
  userProfile: UserProfile;
  userWallet: UserWallet | null;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  userProfile,
  userWallet,
}) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
    >
      <OverviewCard
        title="Total Views"
        value={userProfile.totalViews || 0}
        icon={<FaRegEye className="text-[#fa7517]" size={24} />}
        variants={cardVariants}
      />
      <OverviewCard
        title="Videos"
        value={userProfile.videoCount || 0}
        icon={<FaVideo className="text-[#fa7517]" size={24} />}
        variants={cardVariants}
      />
      <OverviewCard
        title="NFTs"
        value={userProfile.nftCount || 0}
        icon={<FaShapes className="text-[#fa7517]" size={24} />}
        variants={cardVariants}
      />
      <OverviewCard
        title="Wallet Balance"
        value={userWallet ? `${userWallet.balance} ETH` : 'N/A'}
        icon={<FaWallet className="text-[#fa7517]" size={24} />}
        variants={cardVariants}
      />
      <motion.div
        className="md:col-span-2 lg:col-span-4"
        variants={cardVariants}
      >
        <div className="bg-gray-800 p-6 rounded-xl transition-colors duration-300">
          <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-[#fa7517] to-[#ff9a5a] text-transparent bg-clip-text">About Me</h3>
          <p className="text-gray-300">
            {userProfile.description || 'No bio available.'}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default OverviewTab;
