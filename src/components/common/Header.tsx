import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Menu, X } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';

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
  const { isSignedIn, user } = useUser();
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);

  return (
    <header className={`
      fixed top-0 left-0 right-0 bg-black/50 backdrop-blur-sm border-b border-gray-800/30
      p-4 flex justify-between items-center w-full h-16 z-50 ${className}
    `}>
      <div className="flex items-center space-x-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNavToggle}
          className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isNavOpen ? 'open' : 'closed'}
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              {isNavOpen ? (
                <X className="w-5 h-5 text-[#fa7517]" />
              ) : (
                <Menu className="w-5 h-5 text-gray-400 hover:text-[#fa7517] transition-colors" />
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
            className="w-16 h-16"
            whileHover={{ rotate: 10 }}
          />
          <motion.span 
            className="text-3xl font-bold bg-gradient-to-r from-[#fa7517] via-[#fa7517] to-white bg-clip-text text-transparent"
            style={{ textShadow: '0 1.2px 1.2px rgba(0,0,0,0.28)' }}
          >
            Base.Tube
          </motion.span>
        </Link>
      </div>

      <motion.div 
        className="flex-1 max-w-2xl mx-4"
        animate={{ scale: isSearchFocused ? 1.02 : 1 }}
      >
        <div className="relative">
          <input 
            className={`
              w-full bg-gray-900/50 rounded-full px-4 py-2 pl-10
              border border-gray-800/30 backdrop-blur-sm
              focus:outline-none focus:ring-2 focus:ring-[#fa7517] focus:border-transparent
              text-white transition-all duration-300
              ${isSearchFocused ? 'shadow-lg shadow-[#fa7517]/10' : ''}
            `}
            placeholder="Search or enter NFT Content Pass" 
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
          <Search className={`
            absolute left-3 top-1/2 transform -translate-y-1/2 
            transition-colors duration-300
            ${isSearchFocused ? 'text-[#fa7517]' : 'text-gray-400'}
          `} />
        </div>
      </motion.div>

      {isSignedIn && user ? (
        <Link to="/profile">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative group"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#fa7517] to-orange-400 rounded-full opacity-75 group-hover:opacity-100 blur transition duration-1000 group-hover:duration-200" />
            <img 
              src={user.imageUrl}
              alt="User Avatar" 
              className="relative w-10 h-10 rounded-full border-2 border-[#fa7517]"
            />
          </motion.div>
        </Link>
      ) : (
        <Link to="/sign-in">
          <Button>Sign In</Button>
        </Link>
      )}
    </header>
  );
};

export default Header;
