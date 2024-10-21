import React from 'react';
import { UserProfile } from '../../../types/user';
import { motion } from 'framer-motion';

interface UserInfoProps {
  userProfile: UserProfile;
}

const UserInfo: React.FC<UserInfoProps> = ({ userProfile }) => {
  return (
    <motion.div
      className="flex items-center"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.img
        src={userProfile.picture || '/assets/default-profile.png'}
        alt={userProfile.name}
        className="w-24 h-24 rounded-full mr-4 object-cover border-4 border-[#fa7517]"
        whileHover={{ scale: 1.1 }}
      />
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-[#fa7517] to-[#ff9a5a] text-transparent bg-clip-text">{userProfile.name}</h2>
        <p className="text-gray-400">{userProfile.description || 'No bio available.'}</p>
      </div>
    </motion.div>
  );
};

export default UserInfo;