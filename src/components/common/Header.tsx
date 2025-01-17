// src/components/Header.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Layout, LayoutDashboard } from 'lucide-react';
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
        <Link to="/profile">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative group"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#fa7517] to-orange-400 rounded-full opacity-75 group-hover:opacity-100 blur transition duration-1000 group-hover:duration-200" />
            <img
              src={web3User.profile_image_url || '/assets/default-avatar.png'}
              alt="User Avatar"
              className="relative w-10 h-10 rounded-full border-2 border-[#fa7517]"
            />
          </motion.div>
        </Link>
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
      <div className="flex items-center gap-2 md:gap-4">
        <Link to="/sign-in" className="md:hidden">
          <Button 
            variant="ghost" 
            size="sm"
            className="min-w-[40px]"
          >
            Sign In
          </Button>
        </Link>

        <Link to="/sign-in" className="hidden md:block">
          <Button 
            variant="outline" 
            size="md"
            className="min-w-[100px]"
          >
            Sign In
          </Button>
        </Link>

        <ConnectWalletButton 
          className="min-w-[40px] md:min-w-[150px] h-10 bg-[#fa7517] hover:bg-[#fa7517]/90 text-white rounded-lg"
        />
      </div>
    );
  };

  return (
    <>
      <header
        className={`
          fixed top-0 left-0 right-0 bg-black/50 backdrop-blur-sm 
          border-b border-gray-800/30 p-4 flex justify-between items-center 
          w-full h-[4.5rem] md:h-20 z-40
          ${className}
        `}
      >
        <div className="flex items-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNavStyleToggle}
            className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors md:mr-4"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={navStyle}
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                transition={{ duration: 0.2 }}
              >
                {navStyle === 'classic' ? (
                  <LayoutDashboard className="w-5 h-5 text-gray-400 hover:text-[#fa7517] transition-colors" />
                ) : (
                  <Layout className="w-5 h-5 text-[#fa7517] transition-colors" />
                )}
              </motion.div>
            </AnimatePresence>
          </motion.button>

          <Link
            to="/"
            className="flex items-center space-x-2 transition-transform hover:scale-[1.02]"
          >
            <motion.img
              src="/assets/basetubelogo.png"
              alt="Base.Tube Logo"
              className="w-12 h-12 md:w-16 md:h-16"
              whileHover={{ rotate: 10 }}
            />
            <motion.span
              className="hidden md:block text-3xl font-bold bg-gradient-to-r from-[#fa7517] via-[#fa7517] to-white bg-clip-text text-transparent"
              style={{ textShadow: '0 1.2px 1.2px rgba(0,0,0,0.28)' }}
            >
              Base.Tube
            </motion.span>
          </Link>
        </div>

        <motion.div
          className="hidden md:block flex-1 max-w-2xl mx-4"
          animate={{ scale: isSearchFocused ? 1.02 : 1 }}
        >
          <div className="relative">
            <input
              className={`
                w-full bg-gray-900/50 rounded-full px-4 py-2 pl-10
                border border-gray-800/30 backdrop-blur-sm
                focus:outline-none focus:ring-2 focus:ring-[#fa7517] 
                focus:border-transparent text-white transition-all 
                duration-300
                ${isSearchFocused ? 'shadow-lg shadow-[#fa7517]/10' : ''}
              `}
              placeholder="Search or enter NFT Content Pass"
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
            <Search
              className={`
                absolute left-3 top-1/2 transform -translate-y-1/2
                transition-colors duration-300
                ${isSearchFocused ? 'text-[#fa7517]' : 'text-gray-400'}
              `}
            />
          </div>
        </motion.div>

        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="md:hidden p-2 hover:bg-gray-800/50 rounded-lg"
        >
          <Search className="w-5 h-5 text-gray-400" />
        </button>

        <div className="flex items-center gap-2 md:gap-4">
          {renderAuthButtons()}
        </div>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800/30 p-4 z-50"
            >
              <div className="relative mb-4">
                <input
                  className="w-full bg-gray-900/50 rounded-full px-4 py-3 pl-10
                    border border-gray-800/30 backdrop-blur-sm
                    focus:outline-none focus:ring-2 focus:ring-[#fa7517]
                    focus:border-transparent text-white"
                  placeholder="Search or enter NFT Content Pass"
                  autoFocus
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="h-[4.5rem] md:h-20 w-full" />

      <ConnectionStatus step={step} isCorrectNetwork={isAuthenticated} />
    </>
  );
};

export default Header;
