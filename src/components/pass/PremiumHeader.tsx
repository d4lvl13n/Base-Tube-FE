import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ChevronLeft, UserCircle } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { useAuth as useWeb3Auth } from '../../contexts/AuthContext';

interface PremiumHeaderProps {
  passTitle?: string;
  creatorName?: string;
  passId?: string;
}

const PremiumHeader: React.FC<PremiumHeaderProps> = ({ 
  passTitle,
  creatorName,
  passId
}) => {
  const { isSignedIn, user: clerkUser } = useUser();
  const { isAuthenticated: isWeb3SignedIn, user: web3User } = useWeb3Auth();

  const renderAvatar = () => {
    if (isWeb3SignedIn && web3User) {
      return (
        <Link to="/profile" className="relative group">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="relative flex items-center"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#fa7517] to-orange-400 rounded-full opacity-50 group-hover:opacity-80 blur transition duration-300" />
            <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-[#fa7517] to-orange-400 flex items-center justify-center text-xs font-bold border-2 border-[#fa7517]">
              {web3User.profile_image_url ? (
                <img src={web3User.profile_image_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                '0x'
              )}
            </div>
          </motion.div>
        </Link>
      );
    }

    if (isSignedIn && clerkUser) {
      return (
        <Link to="/profile" className="relative group">
          <motion.div whileHover={{ scale: 1.05 }} className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#fa7517] to-orange-400 rounded-full opacity-50 group-hover:opacity-80 blur transition duration-300" />
            <img src={clerkUser.imageUrl} alt="Avatar" className="relative w-8 h-8 rounded-full border-2 border-[#fa7517]" />
          </motion.div>
        </Link>
      );
    }

    // Not signed in – show generic user icon
    return (
      <Link to="/sign-in" className="text-white/60 hover:text-white">
        <UserCircle className="w-6 h-6" />
      </Link>
    );
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full">
      <div className="bg-gradient-to-b from-black via-black/95 to-transparent backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16 relative">
            {/* Left Section - Logo and Back Button */}
            <div className="flex items-center gap-2">
              <motion.div 
                whileHover={{ x: -3 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link 
                  to="/" 
                  className="flex items-center gap-1 text-white/60 hover:text-white text-sm font-medium pr-4"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back to Base.Tube</span>
                </Link>
              </motion.div>
              
              <div className="h-6 w-px bg-white/10 mx-1"></div>
              
              <Link to="/" className="flex items-center gap-2 group">
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="relative"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[#fa7517] to-orange-400 rounded-xl opacity-30 group-hover:opacity-50 blur transition duration-300" />
                  <img 
                    src="/assets/basetubelogo.png" 
                    alt="Base.Tube Logo" 
                    className="relative w-8 h-8"
                  />
                </motion.div>
              </Link>
            </div>

            {/* Center Section - Pass Title (if available) */}
            {passTitle && (
              <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 hidden md:block">
                {passId ? (
                  <Link to={`/p/${passId}`} className="group">
                    <motion.div 
                      whileHover={{ scale: 1.03 }}
                      className="flex items-center gap-2 text-white/80 hover:text-white"
                    >
                      <span className="font-medium truncate max-w-xs group-hover:underline">{passTitle}</span>
                      {creatorName && (
                        <>
                          <span className="text-white/40">•</span>
                          <span className="text-white/60 text-sm">{creatorName}</span>
                        </>
                      )}
                    </motion.div>
                  </Link>
                ) : (
                  <div className="flex items-center gap-2 text-white/80">
                    <span className="font-medium truncate max-w-xs">{passTitle}</span>
                    {creatorName && (
                      <>
                        <span className="text-white/40">•</span>
                        <span className="text-white/60 text-sm">{creatorName}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Right Section - Premium Indicator/Pass Title and Avatar */}
            <div className="flex items-center gap-4">
              {passId && passTitle ? (
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-2"
                >
                  <Link 
                    to={`/p/${passId}`} 
                    className="bg-gradient-to-r from-orange-500/10 to-pink-500/10 rounded-full px-3 py-1.5 border border-orange-500/20 flex items-center gap-2 hover:from-orange-500/20 hover:to-pink-500/20 transition-all duration-300"
                  >
                    <Lock className="w-3.5 h-3.5 text-orange-400" />
                    <span className="text-white/90 text-sm font-medium truncate max-w-[150px]">{passTitle}</span>
                  </Link>
                </motion.div>
              ) : (
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-2 bg-gradient-to-r from-orange-500/10 to-pink-500/10 rounded-full px-3 py-1.5 border border-orange-500/20"
                >
                  <Lock className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-white/90 text-sm font-medium">Content Pass</span>
                </motion.div>
              )}
              {renderAvatar()}
            </div>
          </div>
        </div>
      </div>
      
      {/* Animated gradient line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-orange-500/50 to-transparent relative overflow-hidden">
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-400/80 to-transparent"
          animate={{
            x: ['0%', '100%'],
          }}
          transition={{
            repeat: Infinity,
            repeatType: 'mirror',
            duration: 3,
            ease: 'easeInOut',
          }}
        />
      </div>
    </header>
  );
};

export default PremiumHeader; 