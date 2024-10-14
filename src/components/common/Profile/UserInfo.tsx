import React from 'react';
import { motion } from 'framer-motion';
import { Edit } from 'lucide-react';
import { UserProfile } from '../../../types/user';
import Button from '../Button';

interface UserInfoProps {
  userProfile: UserProfile;
}

const UserInfo: React.FC<UserInfoProps> = ({ userProfile }) => {
  return (
    <motion.div 
      className="flex items-center mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="w-32 h-32 bg-gray-700 rounded-full overflow-hidden mr-6"
        whileHover={{ scale: 1.05 }}
      >
        <img src={`${process.env.REACT_APP_API_URL}/${userProfile.avatar_path}`} alt="User avatar" className="w-full h-full object-cover" />
      </motion.div>
      <div>
        <h1 className="text-3xl font-bold mb-2">{userProfile.name}</h1>
          <p className="text-xl text-gray-300 mb-2">{userProfile.name}</p>
        <div className="flex space-x-4">
          <span>{userProfile.subscribers} subscribers</span>
          <span>{userProfile.totalViews} total views</span>
        </div>
      </div>
      <Button 
        className="ml-auto"
        onClick={() => {/* Handle edit profile */}}
      >
        <Edit size={24} />
      </Button>
    </motion.div>
  );
};

export default UserInfo;