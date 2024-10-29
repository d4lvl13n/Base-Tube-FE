import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit3, ChevronRight, Camera } from 'lucide-react';
import { dark } from "@clerk/themes";
import { useNavigate } from 'react-router-dom';

interface UserProfileHeaderProps {
  userProfile: any;
  clerkUser: any;
}

export default function UserProfileHeader({ userProfile, clerkUser }: UserProfileHeaderProps) {
  const navigate = useNavigate();

  const handleEditProfile = () => {
    navigate('/profile/settings');
  };

  return (
    <>
      <div className="relative">
        {/* Background Banner */}
        <div className="absolute inset-0 h-48 bg-gradient-to-r from-orange-600 to-orange-400 opacity-10 rounded-t-3xl" />
        
        <motion.div
          className="relative z-10 p-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
            {/* Profile Image Section */}
            <div className="relative group">
              <motion.div
                className="relative w-36 h-36 rounded-2xl overflow-hidden border-4 border-orange-500/20 bg-gray-800"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <img
                  src={userProfile?.picture || clerkUser?.imageUrl || '/assets/default-avatar.jpg'}
                  alt={userProfile?.username || 'User'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-8 h-8 text-white/80" />
                </div>
              </motion.div>
            </div>

            {/* Profile Info Section */}
            <div className="flex-1 space-y-4 text-center md:text-left">
              <div>
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-300">
                  {userProfile?.username || clerkUser?.username || 'Welcome!'}
                </h1>
                <p className="mt-2 text-lg text-gray-400">
                  {userProfile?.description || clerkUser?.description || 'No description available'}
                </p>
              </div>

              {/* Stats Row */}
              <div className="flex flex-wrap justify-center md:justify-start gap-6 pt-2">
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-500">1.2K</p>
                  <p className="text-sm text-gray-400">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-500">342</p>
                  <p className="text-sm text-gray-400">Following</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-500">28</p>
                  <p className="text-sm text-gray-400">Videos</p>
                </div>
              </div>

              {/* Edit Profile Button */}
              <motion.button
                onClick={handleEditProfile}
                className="inline-flex items-center px-6 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors gap-2 shadow-lg shadow-orange-500/20"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Edit3 className="w-4 h-4" />
                Edit Profile
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}