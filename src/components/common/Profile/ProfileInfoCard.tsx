import React from 'react';
import { motion } from 'framer-motion';
import { UserCircle, Mail, Calendar, Wallet } from 'lucide-react';

interface ProfileData {
  id: string;
  username: string | null;
  email?: string | null;
  profile_image_url?: string;  // This is already a signed URL from the backend
  createdAt?: string | Date | null; 
  wallet_address?: string;  // Add wallet address
}

interface ProfileInfoCardProps {
  profile: ProfileData;
}

const ProfileInfoCard: React.FC<ProfileInfoCardProps> = ({ profile }) => {
  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return 'Unknown date';
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format wallet address to show first 6 and last 4 characters
  const formatWalletAddress = (address?: string) => {
    if (!address) return 'No wallet connected';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className="p-4 md:p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm relative overflow-hidden"
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
          
          
        </div>

        <div className="space-y-6 md:space-y-0 md:grid md:grid-cols-2 md:gap-6">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden border-2 border-[#fa7517]/20 flex-shrink-0">
              {profile.profile_image_url ? (
                <img 
                  src={profile.profile_image_url}
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-900/50 flex items-center justify-center">
                  <UserCircle className="w-8 h-8 text-gray-600" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base md:text-lg font-semibold text-white truncate">
                {profile.username || 'Anonymous'}
              </h3>
              <div className="flex items-center gap-2 text-gray-400">
                <Wallet className="w-3 h-3 flex-shrink-0" />
                <span className="text-xs md:text-sm text-gray-500 truncate font-mono">
                  {formatWalletAddress(profile.wallet_address)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 md:pt-0 border-t md:border-t-0 border-gray-800/30">
            <div className="flex items-center gap-2 text-gray-400">
              <Mail className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs md:text-sm truncate">
                {profile.email || 'No email provided'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs md:text-sm">
                Joined {formatDate(profile.createdAt)}
              </span>
            </div>
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
  );
};

export default ProfileInfoCard; 