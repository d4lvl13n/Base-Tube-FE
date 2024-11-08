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
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
      className="space-y-6"
    >
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={cardVariants}
      >
        {/* OverviewCards */}
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
          value={userWallet ? `${userWallet.balance} TUBE` : 'N/A'}
          icon={<FaWallet className="text-[#fa7517]" size={24} />}
          variants={cardVariants}
        />
      </motion.div>

    </motion.div>
  );
};

export default OverviewTab;