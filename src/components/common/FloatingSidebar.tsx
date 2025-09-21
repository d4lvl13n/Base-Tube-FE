import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Home, Flame, Compass, PlayCircle, User, Tv, Palette, Trophy } from 'lucide-react';

const PASSES_ENABLED = process.env.REACT_APP_SHOW_PASSES === 'true';

interface NavigationItem {
  path: string;
  icon: React.ReactNode;
  label: string;
  description: string;
}

const navigationItems: NavigationItem[] = [
  {
    path: '/',
    icon: <Home size={24} />,
    label: 'Home',
    description: 'Return to homepage'
  },
  {
    path: '/discover',
    icon: <Flame size={24} />,
    label: 'Discover',
    description: 'Explore trending content'
  },
  {
    path: '/nft-marketplace',
    icon: <Compass size={24} />,
    label: 'NFT Marketplace',
    description: 'Browse NFT content'
  },
  {
    path: '/subscribed',
    icon: <PlayCircle size={24} />,
    label: 'Subscriptions',
    description: 'View your subscribed content'
  },
  {
    path: '/channel',
    icon: <Tv size={24} />,
    label: 'Channel',
    description: 'Manage your channel'
  },
  {
    path: '/profile',
    icon: <User size={24} />,
    label: 'Profile',
    description: 'View your profile'
  },
  {
    path: '/creator-hub',
    icon: <Palette size={24} />,
    label: 'Creator Hub',
    description: 'Access creator tools'
  },
  {
    path: '/leaderboard',
    icon: <Trophy size={24} />,
    label: 'Leaderboard',
    description: 'See the top performers'
  }
];

const FloatingSidebar: React.FC = () => {
  const location = useLocation();
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      setIsVisible(
        currentScrollY < lastScrollY || // Scrolling up
        currentScrollY < 100 || // Near top
        currentScrollY > 300 // Scrolled down
      );
      
      setLastScrollY(currentScrollY);
    };

    // Add throttling to prevent too many updates
    let timeoutId: ReturnType<typeof setTimeout>;
    const throttledScroll = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        handleScroll();
      }, 100);
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', throttledScroll);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [lastScrollY]);

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          className="fixed bottom-4 left-[35%] -translate-x-[35%] z-[60]"
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ 
            type: 'spring', 
            stiffness: 260, 
            damping: 20,
            duration: 0.3 
          }}
        >
          <div className="flex flex-row space-x-4">
            {navigationItems.map(({ path, icon, label, description }) => (
              <motion.div
                key={path}
                className="relative group"
                onHoverStart={() => setHoveredPath(path)}
                onHoverEnd={() => setHoveredPath(null)}
              >
                <Link to={path}>
                  <motion.button
                    className={`p-3 rounded-full transition-all duration-300 relative
                      ${location.pathname === path 
                        ? 'bg-[#fa7517] text-black shadow-lg shadow-[#fa7517]/20' 
                        : (!PASSES_ENABLED && path === '/nft-marketplace' 
                            ? 'bg-black/30 text-white/50' 
                            : 'bg-black/50 text-white hover:bg-black/70')
                      }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.div
                      animate={location.pathname === path ? { rotate: 360 } : { rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    >
                      {icon}
                    </motion.div>
                    
                    {location.pathname === path && (
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-[#fa7517]"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </motion.button>
                </Link>

                <AnimatePresence>
                  {hoveredPath === path && (
                    <motion.div
                      className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 
                               bg-black/90 rounded-lg p-3 backdrop-blur-sm min-w-[200px]"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="text-white">
                        <h3 className="font-semibold mb-1">{label}</h3>
                        <p className="text-xs text-gray-300">{description}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FloatingSidebar; 