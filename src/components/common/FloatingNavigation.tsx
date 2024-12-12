import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface NavigationOption<T extends string> {
  key: T;
  icon: LucideIcon;
  label: string;
  description?: string;
}

interface FloatingNavigationProps<T extends string> {
  options: NavigationOption<T>[];
  activeOption: T;
  setActiveOption: (option: T) => void;
}

const FloatingNavigation = <T extends string>({ 
  options, 
  activeOption, 
  setActiveOption 
}: FloatingNavigationProps<T>) => {
  const [hoveredOption, setHoveredOption] = useState<T | null>(null);
  const [isCompact, setIsCompact] = useState(window.innerWidth < 768);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setIsCompact(window.innerWidth < 768);
    };

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

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', throttledScroll, { passive: true });
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', throttledScroll);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [lastScrollY]);

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          className={`fixed ${isCompact ? 'bottom-4 left-1/2 -translate-x-1/2' : 'right-8 top-1/3 -translate-y-1/3'} 
                     z-[60]`}
          initial={{ opacity: 0, x: isCompact ? 0 : 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: isCompact ? 0 : 100 }}
          transition={{ 
            type: 'spring', 
            stiffness: 260, 
            damping: 20,
            duration: 0.3 
          }}
        >
          <div className={`flex ${isCompact ? 'flex-row space-x-4' : 'flex-col space-y-4'}`}>
            {options.map(({ key, icon: Icon, label, description }) => (
              <motion.div
                key={key}
                className="relative group"
                onHoverStart={() => setHoveredOption(key)}
                onHoverEnd={() => setHoveredOption(null)}
              >
                <motion.button
                  className={`p-3 rounded-full transition-all duration-300 relative
                    ${activeOption === key 
                      ? 'bg-[#fa7517] text-black shadow-lg shadow-[#fa7517]/20' 
                      : 'bg-black/50 text-white hover:bg-black/70'
                    }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveOption(key)}
                >
                  <motion.div
                    animate={activeOption === key ? { rotate: 360 } : { rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  >
                    <Icon size={24} />
                  </motion.div>
                  
                  {activeOption === key && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-[#fa7517]"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </motion.button>

                <AnimatePresence>
                  {hoveredOption === key && (
                    <motion.div
                      className={`absolute ${
                        isCompact 
                          ? 'bottom-full mb-2 left-1/2 -translate-x-1/2' 
                          : 'right-full mr-2 top-1/2 -translate-y-1/2'
                      } bg-black/90 rounded-lg p-3 backdrop-blur-sm min-w-[200px]`}
                      initial={{ opacity: 0, x: isCompact ? 0 : 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: isCompact ? 0 : 20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="text-white">
                        <h3 className="font-semibold mb-1">{label}</h3>
                        {description && (
                          <p className="text-xs text-gray-300">{description}</p>
                        )}
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

export default FloatingNavigation;
