// src/components/Header.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Layout, LayoutDashboard, UserCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/clerk-react'; 
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '../../contexts/NavigationContext';
import Button from './Button';
import ConnectionStatus from './ConnectionStatus';
import { ConnectWalletButton } from './WalletWrapper';

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
  const { step, isAuthenticated, user: web3User } = useAuth();
  const { navStyle, setNavStyle } = useNavigation();
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleNavStyleToggle = () => {
    if (onNavToggle) onNavToggle();
    setNavStyle(navStyle === 'classic' ? 'floating' : 'classic');
  };

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
            whileHover={{ scale: 1.05 }}
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
        {/* Mobile Sign In Button */}
        <div className="block md:hidden">
          <Link to="/sign-in">
            <Button 
              variant="sign-in"
              size="sm"
              iconOnly
            >
              <UserCircle className="w-5 h-5" />
            </Button>
          </Link>
        </div>

        {/* Desktop Sign In Button */}
        <div className="hidden md:block">
          <Link to="/sign-in">
            <Button 
              variant="sign-in"
              size="md"
              className="min-w-[120px]"
            >
              <span>Sign In</span>
            </Button>
          </Link>
        </div>

        <ConnectWalletButton 
          className="h-10 min-w-[40px] md:min-w-[140px]"
        />
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
              {/* Menu Toggle Button */}
              <Button
                variant="icon"
                size="md"
                onClick={handleNavStyleToggle}
                className="hover:rotate-180 transition-transform duration-300"
              >
                {navStyle === 'classic' ? (
                  <LayoutDashboard className="w-5 h-5" />
                ) : (
                  <Layout className="w-5 h-5" />
                )}
              </Button>

              <Link to="/" className="flex items-center gap-2 group">
                <img 
                  src="/assets/basetubelogo.png" 
                  alt="Base.Tube Logo" 
                  className="w-10 h-10 md:w-12 md:h-12"
                />
                <span className="hidden md:block text-2xl font-bold 
                  bg-gradient-to-r from-[#fa7517] via-[#fa7517] to-white 
                  bg-clip-text text-transparent"
                >
                  Base.Tube
                </span>
              </Link>
            </div>

            {/* Center Section - Search */}
            <div className="flex-1 max-w-2xl mx-6 hidden md:block">
              <div className="relative w-full">
                <input
                  className={`
                    w-full bg-black/50 rounded-full 
                    px-4 py-2.5 pl-10
                    border border-white/10
                    backdrop-blur-xl
                    focus:outline-none
                    focus:border-[#fa7517]/30
                    focus:bg-black/70
                    text-white 
                    transition-all duration-300
                    placeholder:text-white/50
                    ${isSearchFocused ? 'shadow-[0_0_20px_-5px] shadow-[#fa7517]/20' : ''}
                  `}
                  placeholder="Search videos or enter NFT Content Pass"
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                />
                <Search className={`
                  absolute left-3 top-1/2 transform -translate-y-1/2
                  w-5 h-5 transition-colors duration-300
                  ${isSearchFocused ? 'text-[#fa7517]' : 'text-white/50'}
                `} />
              </div>
            </div>

            {/* Mobile Search Button */}
            <div className="block md:hidden">
              <Button
                variant="icon"
                size="md"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Open search"
              >
                <Search className="w-5 h-5" />
              </Button>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3">
              <div className="block md:hidden">
                <Link to="/sign-in">
                  <Button 
                    variant="sign-in"
                    size="sm"
                    iconOnly
                  >
                    <UserCircle className="w-5 h-5" />
                  </Button>
                </Link>
              </div>

              <div className="hidden md:block">
                <Link to="/sign-in">
                  <Button 
                    variant="sign-in"
                    size="md"
                    className="min-w-[120px]"
                  >
                    <span>Sign In</span>
                  </Button>
                </Link>
              </div>

              <ConnectWalletButton 
                className="h-10 min-w-[40px] md:min-w-[140px]"
              />
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
                className="w-full bg-black/70 rounded-full px-4 py-2 pl-10
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

      <ConnectionStatus step={step} isCorrectNetwork={isAuthenticated} />
    </header>
  );
};

export default Header;
