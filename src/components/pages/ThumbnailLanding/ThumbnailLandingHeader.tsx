import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/clerk-react';
import { LogIn, UserPlus, UserCircle } from 'lucide-react';
import Button from '../../common/Button';

interface ThumbnailLandingHeaderProps {
  onSignInClick: () => void;
  onSignUpClick: () => void;
}

const ThumbnailLandingHeader: React.FC<ThumbnailLandingHeaderProps> = ({
  onSignInClick,
  onSignUpClick,
}) => {
  const { isSignedIn, user } = useUser();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const UserMenu = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute top-full right-0 mt-2 w-48 bg-black/90 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl overflow-hidden"
    >
      <div className="p-2">
        <div className="px-3 py-2 border-b border-white/10">
          <p className="text-white font-medium text-sm">{user?.fullName || 'User'}</p>
          <p className="text-white/60 text-xs">{user?.primaryEmailAddress?.emailAddress}</p>
        </div>
        <div className="mt-2 space-y-1">
          <Link
            to="/creator-hub"
            className="flex items-center gap-2 px-3 py-2 text-white/80 hover:text-white hover:bg-white/5 rounded-md transition-colors text-sm"
          >
            <UserCircle className="w-4 h-4" />
            Creator Hub
          </Link>
          <Link
            to="/profile"
            className="flex items-center gap-2 px-3 py-2 text-white/80 hover:text-white hover:bg-white/5 rounded-md transition-colors text-sm"
          >
            <UserCircle className="w-4 h-4" />
            Profile
          </Link>
        </div>
      </div>
    </motion.div>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full">
      <div className="bg-gradient-to-b from-black via-black/95 to-black/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#fa7517] to-orange-400 rounded-xl opacity-30 group-hover:opacity-50 blur transition duration-300" />
                <img 
                  src="/assets/basetubelogo.png" 
                  alt="Base.Tube Logo" 
                  className="relative w-12 h-12"
                />
              </motion.div>
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-[#fa7517] to-orange-400 bg-clip-text text-transparent">
                  Base.Tube
                </span>
                <span className="text-xs text-white/60 -mt-1">
                  AI Thumbnails
                </span>
              </div>
            </Link>

            {/* Auth Section */}
            <div className="flex items-center gap-4">
              {isSignedIn ? (
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="relative group"
                  >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#fa7517] to-orange-400 rounded-full opacity-75 group-hover:opacity-100 blur transition duration-300" />
                    <img
                      src={user?.imageUrl}
                      alt="User Avatar"
                      className="relative w-10 h-10 rounded-full border-2 border-[#fa7517]"
                    />
                  </motion.button>
                  
                  <AnimatePresence>
                    {showUserMenu && <UserMenu />}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onSignInClick}
                      className="text-white/80 hover:text-white hover:bg-white/5 flex items-center gap-2"
                    >
                      <LogIn className="w-4 h-4" />
                      <span className="hidden sm:inline">Sign In</span>
                    </Button>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative group"
                  >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#fa7517] to-orange-400 rounded-lg opacity-0 group-hover:opacity-100 blur transition-all duration-300" />
                    <Button
                      variant="default"
                      size="sm"
                      onClick={onSignUpClick}
                      className="relative bg-[#fa7517] hover:bg-[#fa7517]/90 text-white flex items-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span className="hidden sm:inline">Get Started</span>
                    </Button>
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ThumbnailLandingHeader; 