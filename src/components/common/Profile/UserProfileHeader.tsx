import React from 'react';
import { motion } from 'framer-motion';
import { UserProfile } from '../../../types/user';

interface UserProfileHeaderProps {
  userProfile: UserProfile | null;
  onEditProfile: () => void;
  clerkUser: any;
}

const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({ userProfile, onEditProfile, clerkUser }) => {
  console.log('UserProfileHeader userProfile:', userProfile);
  return (
    <motion.div
      className="mb-8 p-6 bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-3xl shadow-lg"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col md:flex-row items-center">
        <motion.img
        src={userProfile?.picture || clerkUser?.imageUrl || '/assets/default-avatar.jpg'}
        alt={userProfile?.username || 'User'}
          className="w-32 h-32 rounded-full object-cover border-4 border-[#fa7517]"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        />
        <div className="md:ml-8 mt-4 md:mt-0 text-center md:text-left">
          <h1 className="text-4xl font-bold text-[#fa7517]">
            {userProfile?.username || clerkUser?.username || 'Welcome!'}
          </h1>
          <p className="text-xl text-gray-300 mt-2">
            {userProfile?.description || clerkUser?.description || 'No description available'}
          </p>
        </div>
        <motion.button
          onClick={onEditProfile}
          className="mt-4 md:mt-0 md:ml-auto px-6 py-2 bg-gradient-to-r from-[#fa7517] to-[#ff9a5a] text-black font-bold rounded-full hover:shadow-lg hover:shadow-[#fa7517]/50 transition-all duration-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Edit Profile
        </motion.button>
      </div>
    </motion.div>
  );
};

export default UserProfileHeader;
