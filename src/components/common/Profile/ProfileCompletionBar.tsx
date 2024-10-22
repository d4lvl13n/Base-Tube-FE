import React from 'react';
import { motion } from 'framer-motion';
import { UserProfile } from '../../../types/user';

interface ProfileCompletionBarProps {
  userProfile: UserProfile;
  onEditProfile: () => void;
}

const ProfileCompletionBar: React.FC<ProfileCompletionBarProps> = ({ userProfile, onEditProfile }) => {
  const calculateCompletionPercentage = (profile: UserProfile) => {
    const totalFields = 4; // name, dob, picture, description
    let completedFields = 0;

    if (profile.username) completedFields += 1;
    if (profile.dob) completedFields += 1;
    if (profile.picture) completedFields += 1;
    if (profile.description) completedFields += 1;

    return Math.round((completedFields / totalFields) * 100);
  };

  const completionPercentage = calculateCompletionPercentage(userProfile);

  return (
    <motion.div
      className="mt-8 bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-3xl p-6 shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold text-[#fa7517]">Profile Completion</h3>
        {completionPercentage < 100 && (
          <motion.button
            onClick={onEditProfile}
            className="px-4 py-2 bg-gradient-to-r from-[#fa7517] to-[#ff9a5a] text-black font-bold rounded-full hover:shadow-lg hover:shadow-[#fa7517]/50 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Complete Profile
          </motion.button>
        )}
      </div>
      <div className="relative pt-1">
        <div className="flex mb-2 items-center justify-between">
          <div>
            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-[#fa7517] bg-[#fa7517] bg-opacity-20">
              {completionPercentage}% Complete
            </span>
          </div>
        </div>
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-gray-700">
          <motion.div
            style={{ width: `${completionPercentage}%` }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-[#fa7517] to-[#ff9a5a]"
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileCompletionBar;
