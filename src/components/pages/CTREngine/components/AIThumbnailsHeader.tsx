// src/components/pages/CTREngine/components/AIThumbnailsHeader.tsx
// Header for AI Thumbnails - Identical to Header.tsx but without search bar

import React, { useState } from 'react';
import { UserCircle, Palette, Shield, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../../common/Button';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useAuth } from '../../../../contexts/AuthContext';

import AIThumbnailsSignInOptions from './AIThumbnailsSignInOptions';

interface AIThumbnailsHeaderProps {
  className?: string;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
  isNavOpen?: boolean;
  onNavToggle?: () => void;
}

const AIThumbnailsHeader: React.FC<AIThumbnailsHeaderProps> = ({
  className = '',
  isMobileMenuOpen = false,
  onToggleMobileMenu,
}) => {
  const { isSignedIn, user: clerkUser } = useUser();
  const { isAuthenticated, user: web3User } = useAuth();
  const [showSignInOptions, setShowSignInOptions] = useState(false);
  const [hoveredAvatar, setHoveredAvatar] = useState(false);

  const SignInPopover = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute top-full right-0 mt-2 w-64 bg-black/90 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl"
    >
      <AIThumbnailsSignInOptions />
    </motion.div>
  );

  const renderAuthButtons = () => {
    if (isAuthenticated && web3User) {
      return (
        <Link to="/profile">
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.95 }}
            className="relative group"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#fa7517] to-orange-400 rounded-full opacity-75 group-hover:opacity-100 blur transition duration-1000 group-hover:duration-200" />
            <div className="relative flex items-center gap-2">
              {/* Avatar with AnimatePresence Tooltip */}
              <motion.div
                className="relative"
                onHoverStart={() => setHoveredAvatar(true)}
                onHoverEnd={() => setHoveredAvatar(false)}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#fa7517] to-orange-400 flex items-center justify-center text-white font-bold border-2 border-[#fa7517]">
                  {web3User.profile_image_url ? (
                    <img
                      src={web3User.profile_image_url}
                      alt="User Avatar"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm">0x</span>
                  )}
                </div>

                <AnimatePresence>
                  {hoveredAvatar && (
                    <motion.div
                      className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 
                               bg-black/90 rounded-lg p-3 backdrop-blur-sm min-w-[200px]
                               z-50"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="text-white">
                        <h3 className="font-semibold mb-1">Web3 Wallet</h3>
                        <p className="text-xs text-gray-300">{web3User.username}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              
              {/* Username - Only show on larger screens */}
              <span className="hidden md:block text-sm text-white/90 group-hover:text-white transition-colors">
                {web3User.username || 'My Wallet'}
              </span>
            </div>
          </motion.div>
        </Link>
      );
    }

    if (isSignedIn && clerkUser) {
      return (
        <Link to="/profile">
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.95 }}
            className="relative group"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#fa7517] to-orange-400 rounded-full opacity-75 group-hover:opacity-100 blur transition duration-1000 group-hover:duration-200" />
            <img
              src={clerkUser.imageUrl}
              alt="User Avatar"
              className="relative w-10 h-10 rounded-full border-2 border-[#fa7517]"
            />
          </motion.div>
        </Link>
      );
    }

    return (
      <div className="flex items-center gap-3">
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="relative group"
        >
          <Button
            variant="ghost"
            size="sm"
            aria-label="Sign in"
            aria-expanded={showSignInOptions}
            onClick={() => setShowSignInOptions(!showSignInOptions)}
            className="relative text-white/80 hover:text-white hover:bg-white/5"
          >
            <UserCircle className="w-6 h-6 transform group-hover:scale-105 transition-transform duration-300" />
          </Button>
        </motion.div>
        <div className="relative">
          <AnimatePresence>
            {showSignInOptions && <SignInPopover />}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between h-16 md:h-[60px] relative md:justify-end">
        {/* Left Section */}
        <div className="ai-studio-mobile-brand flex items-center gap-2 sm:gap-4 shrink-0 md:hidden">
          {/* Mobile Hamburger Menu Button */}
          {onToggleMobileMenu && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleMobileMenu}
              className="md:hidden text-white/80 hover:text-white hover:bg-white/5 p-2"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </Button>
          )}

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
                className="relative w-9 h-9"
              />
            </motion.div>
            <span className="block text-lg font-semibold tracking-tight text-zinc-100">
              Base.Tube
            </span>
          </Link>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-[#0d0d0f]/90 px-1.5 py-1 shadow-xl shadow-black/20 md:mr-2 md:mt-2">
          <Link
            to="/creator-hub"
            className="ai-studio-creator-link relative text-white/80 hover:text-white hover:bg-white/5"
          >
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="relative group"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#fa7517] to-orange-400 rounded-lg opacity-0 group-hover:opacity-30 blur transition-all duration-300" />
              <Button
                variant="ghost"
                size="sm"
                className="relative text-white/80 hover:text-white hover:bg-white/5"
              >
                <Palette className="w-5 h-5 transform group-hover:scale-105 transition-transform duration-300" />
              </Button>
            </motion.div>
          </Link>

          {isSignedIn || isAuthenticated ? (
            <Link
              to="/my-passes"
              className="relative text-white/80 hover:text-white hidden md:block"
            >
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="px-3 py-1 rounded-full border border-[#fa7517]/40 hover:border-[#fa7517] hover:bg-[#fa7517]/10 flex items-center gap-1.5"
              >
                <Shield className="w-4 h-4 text-[#fa7517]" />
                <span className="text-sm">My Passes</span>
              </motion.div>
            </Link>
          ) : null}

          {renderAuthButtons()}
        </div>
      </div>
    </div>
  );
};

export default AIThumbnailsHeader;
export type { AIThumbnailsHeaderProps };
