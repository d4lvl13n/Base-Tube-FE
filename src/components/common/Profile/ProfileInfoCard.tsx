import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCircle, Mail, Calendar, Wallet as WalletIcon, X } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { LinkWalletButton } from '../WalletWrapper/LinkWalletButton';
import {
  Identity,
  Avatar,
  Name,
  Address,
  EthBalance,
} from '@coinbase/onchainkit/identity';
import { useWallet } from '../../../hooks/useWallet';
import { useUser } from '@clerk/clerk-react';
import { useLinkWallet } from '../../../hooks/useLinkWallet';

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
  const { isAuthenticated } = useAuth();
  const { isSignedIn } = useUser();
  const { wallet, isLoading } = useWallet();
  const { modalState, clearModal } = useLinkWallet();

  console.log('ProfileInfoCard render:', { 
    isAuthenticated, 
    isSignedIn,
    wallet, 
    isLoading 
  });

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

  // Get the correct wallet address based on auth type
  const displayWalletAddress = useMemo(() => {
    if (isAuthenticated) {
      // Web3 auth user - use profile wallet address
      return formatWalletAddress(profile.wallet_address);
    } else if (isSignedIn && wallet?.walletAddress) {
      // Clerk user with linked wallet - use wallet from useWallet hook
      return formatWalletAddress(wallet.walletAddress);
    }
    return 'No wallet connected';
  }, [isAuthenticated, isSignedIn, profile.wallet_address, wallet?.walletAddress]);

  // Show wallet info if:
  // 1. User is Web3 authenticated OR
  // 2. User is Clerk authenticated AND has a linked wallet
  const showWalletInfo = isAuthenticated || (isSignedIn && wallet?.walletAddress);
  
  // Show link button if:
  // User is Clerk authenticated but has no linked wallet
  const showLinkButton = isSignedIn && !wallet?.walletAddress;

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
        <div className="flex items-center justify-between gap-3 mb-6">
          <h2 className="text-xl font-bold text-white">Profile</h2>
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
              <h3 className="text-base md:text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                {profile.username || 'Anonymous'}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <WalletIcon className="w-4 h-4 text-[#fa7517]" />
                <span className="text-xs md:text-sm text-gray-400 font-mono">
                  {displayWalletAddress}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 md:pt-0 border-t md:border-t-0 border-gray-800/30">
            <div className="flex items-center gap-2 text-gray-400">
              <Mail className="w-4 h-4 flex-shrink-0 text-[#fa7517]" />
              <span className="text-xs md:text-sm truncate">
                {profile.email || 'No email provided'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Calendar className="w-4 h-4 flex-shrink-0 text-[#fa7517]" />
              <span className="text-xs md:text-sm">
                Joined {formatDate(profile.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {showWalletInfo && (
          <div className="mt-4 p-3 rounded-lg bg-gray-900/50">
            <Identity 
              address={wallet?.walletAddress}
              hasCopyAddressOnClick
              className="!border-none !bg-transparent"
            >
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10" />
                <div className="flex-1 min-w-0">
                  <Name className="text-white font-semibold" />
                  <Address className="text-sm text-gray-400" />
                </div>
                <EthBalance 
                  className="text-[#fa7517]"
                  containerClassName="!bg-transparent !border-none"
                />
              </div>
            </Identity>
          </div>
        )}

        {showLinkButton && (
          <div className="mt-4 space-y-4">
            <AnimatePresence>
              {modalState.type && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-80 backdrop-blur-sm"
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className={`bg-gray-900 rounded-2xl p-8 w-full max-w-md relative border
                      ${modalState.type === 'success' 
                        ? 'border-green-900/50' 
                        : 'border-red-900/50'}`}
                    style={{
                      boxShadow: `0 0 20px ${modalState.type === 'success' 
                        ? 'rgba(0, 255, 0, 0.1)' 
                        : 'rgba(255, 0, 0, 0.1)'}, 
                        0 0 60px ${modalState.type === 'success' 
                          ? 'rgba(0, 255, 0, 0.1)' 
                          : 'rgba(255, 0, 0, 0.1)'}`,
                    }}
                  >
                    <button
                      onClick={clearModal}
                      className="absolute top-4 right-4 text-gray-400 hover:text-white"
                    >
                      <X size={24} />
                    </button>
                    <h3 className={`text-2xl font-bold mb-4 
                      ${modalState.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                      {modalState.message}
                    </h3>
                    <div className="space-y-4 text-gray-300">
                      <p>{modalState.details}</p>
                      {modalState.type === 'error' && modalState.message?.includes('Already Linked') && (
                        <div className="mt-4 p-4 bg-red-950/30 rounded-lg border border-red-900/50">
                          <h4 className="font-medium text-red-400 mb-2">What to do next:</h4>
                          <ol className="list-decimal list-inside space-y-2 text-red-300">
                            <li>Disconnect your current wallet</li>
                            <li>Connect a different wallet that isn't linked to any account</li>
                            <li>Try the connection process again</li>
                          </ol>
                        </div>
                      )}
                    </div>
                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={clearModal}
                        className={`px-4 py-2 rounded-lg transition-colors
                          ${modalState.type === 'success' 
                            ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30' 
                            : 'bg-red-600/20 text-red-400 hover:bg-red-600/30'}`}
                      >
                        Close
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex justify-end">
              <LinkWalletButton />
            </div>
          </div>
        )}
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