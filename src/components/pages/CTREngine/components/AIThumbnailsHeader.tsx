// src/components/pages/CTREngine/components/AIThumbnailsHeader.tsx
// Header for AI Thumbnails - Identical to Header.tsx but without search bar

import React, { useState } from 'react';
import { Layout, LayoutDashboard, UserCircle, LogIn, Wallet, Palette, Shield, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../../common/Button';
import { Link } from 'react-router-dom';
import { useUser, SignInButton, UserButton } from '@clerk/clerk-react';
import { useAuth } from '../../../../contexts/AuthContext';

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
  isNavOpen = true,
  onNavToggle,
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
      <div className="p-2 space-y-1">
        <Link to="/sign-in" className="block">
          <button className="w-full group relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#fa7517] to-orange-400 rounded-lg opacity-0 group-hover:opacity-100 blur transition-all duration-300" />
            <div className="relative flex items-center gap-3 p-3 rounded-lg bg-black hover:bg-black/90 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#fa7517] to-orange-400 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-[#fa7517]/20 transition-shadow duration-300">
                <LogIn className="w-4 h-4 text-white transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300" />
              </div>
              <div className="text-left transition-transform duration-300 group-hover:translate-x-1">
                <p className="text-white font-medium">Sign In with Email</p>
                <p className="text-white/50 text-xs group-hover:text-white/70 transition-colors duration-300">Use your email address</p>
              </div>
            </div>
          </button>
        </Link>
        
        <Link to="/sign-in-web3" className="block">
          <button className="w-full group relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#fa7517] to-orange-400 rounded-lg opacity-0 group-hover:opacity-100 blur transition-all duration-300" />
            <div className="relative flex items-center gap-3 p-3 rounded-lg bg-black hover:bg-black/90 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#fa7517] to-orange-400 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-[#fa7517]/20 transition-shadow duration-300">
                <Wallet className="w-4 h-4 text-white transform group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300" />
              </div>
              <div className="text-left transition-transform duration-300 group-hover:translate-x-1">
                <p className="text-white font-medium">Sign In with Wallet</p>
                <p className="text-white/50 text-xs group-hover:text-white/70 transition-colors duration-300">Connect your Web3 wallet</p>
              </div>
            </div>
          </button>
        </Link>
      </div>
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
    <div className={`max-w-[1920px] mx-auto ${className}`}>
      <div className="flex items-center justify-between h-16 relative">
        {/* Left Section */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
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

          {/* Desktop Sidebar Toggle Button */}
          {onNavToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onNavToggle}
              className="hidden md:flex hover:rotate-180 transition-transform duration-300 text-white/80 hover:text-white hover:bg-white/5"
            >
              {isNavOpen ? (
                <LayoutDashboard className="w-5 h-5" />
              ) : (
                <Layout className="w-5 h-5" />
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
                className="relative w-10 h-10 md:w-12 md:h-12"
              />
            </motion.div>
            <span className="block text-2xl font-bold bg-gradient-to-r from-[#fa7517] via-[#fa7517] to-white bg-clip-text text-transparent">
              Base.Tube
            </span>
          </Link>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <Link
            to="/creator-hub"
            className="relative text-white/80 hover:text-white hover:bg-white/5"
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
