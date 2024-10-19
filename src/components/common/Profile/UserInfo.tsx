// src/components/common/Profile/UserInfo.tsx

import React from 'react';
import { UserProfile } from '../../../types/user';

interface UserInfoProps {
  userProfile: UserProfile;
}

const UserInfo: React.FC<UserInfoProps> = ({ userProfile }) => {
  return (
    <div className="flex items-center mb-6">
      <img
        src={userProfile.picture || '/assets/default-profile.png'}
        alt={userProfile.name}
        className="w-24 h-24 rounded-full mr-4"
      />
      <div>
        <h2 className="text-2xl font-bold">{userProfile.name}</h2>
        <p className="text-gray-400">{userProfile.bio}</p>
      </div>
    </div>
  );
};

export default UserInfo;
