import React, { useState } from 'react';
import { Search, Layout, LayoutDashboard, UserCircle, X, Palette, LogIn, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '../../contexts/NavigationContext';
import ConnectWalletButton from './WalletWrapper/ConnectWalletButton';

interface HeaderProps {
  className?: string;
  isNavOpen?: boolean;
  onNavToggle?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  className = '',
  isNavOpen = false,
  onNavToggle
}) => {
  const { isSignedIn, user: clerkUser } = useUser();
  const { isAuthenticated, user: web3User } = useAuth();
  const { navStyle, setNavStyle } = useNavigation();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSignInOptions, setShowSignInOptions] = useState(false);

  const handleNavStyleToggle = () => {
    if (onNavToggle) onNavToggle();
    setNavStyle(navStyle === 'classic' ? 'floating' : 'classic');
  };

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
        <ConnectWalletButton 
          className="h-10 min-w-[40px] md:min-w-[140px]"
        />
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
    <header className="fixed top-0 left-0 right-0 z-50 w-full">
      <div className="bg-gradient-to-b from-black via-black/95 to-black/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-[1920px] mx-auto px-4">
          <div className="flex items-center justify-between h-16 relative">
            {/* Left Section */}
            <div className="flex items-center gap-4 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNavStyleToggle}
                className="hover:rotate-180 transition-transform duration-300 text-white/80 hover:text-white hover:bg-white/5"
              >
                {navStyle === 'floating' ? (
                  <LayoutDashboard className="w-5 h-5" />
                ) : (
                  <Layout className="w-5 h-5" />
                )}
              </Button>

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

            {/* Center Section - Search */}
            <div className="flex-1 max-w-2xl mx-6 block">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#fa7517]/20 to-orange-400/20 rounded-full opacity-0 group-hover:opacity-100 blur transition duration-300" />
                <input
                  className="w-full bg-white/5 rounded-full px-4 py-2.5 pl-10
                    border border-white/10 group-hover:border-[#fa7517]/30
                    backdrop-blur-xl focus:outline-none focus:border-[#fa7517]/30
                    focus:bg-white/10 text-white transition-all duration-300
                    placeholder:text-white/50"
                  placeholder="Search videos or enter NFT Content Pass"
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                />
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2
                  w-5 h-5 transition-colors duration-300
                  ${isSearchFocused ? 'text-[#fa7517]' : 'text-white/50'}`} 
                />
              </div>
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

              {renderAuthButtons()}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search Modal */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-0 p-4 bg-black/95 border-b border-white/10 z-50"
          >
            <div className="relative max-w-md mx-auto">
              <input
                className="w-full bg-white/5 rounded-full px-4 py-2 pl-10
                  border border-white/10 focus:border-[#fa7517]/30
                  text-white placeholder-white/50"
                placeholder="Search videos..."
                autoFocus
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;