import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import CommandOrbNavItem from './CommandOrbNavItem';
import { isNavigationItemActive, navigationItems } from './navigationItems';

const PASSES_ENABLED = process.env.REACT_APP_SHOW_PASSES === 'true';

const FloatingSidebar: React.FC = () => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      setIsVisible(
        currentScrollY < lastScrollY ||
        currentScrollY < 100 ||
        currentScrollY > 300
      );

      setLastScrollY(currentScrollY);
    };

    let timeoutId: ReturnType<typeof setTimeout>;
    const throttledScroll = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, 100);
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
        <motion.nav
          aria-label="Primary navigation"
          className="pointer-events-none fixed bottom-5 left-0 right-0 z-[60] flex justify-center px-2"
          initial={{ opacity: 0, y: 80, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 80, scale: 0.96 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 22,
            duration: 0.3,
          }}
        >
          <div className="pointer-events-auto relative flex max-w-full items-center gap-2 overflow-x-auto px-2 py-3 [scrollbar-width:none] sm:gap-3 sm:px-3 [&::-webkit-scrollbar]:hidden">

            {navigationItems.map((item) => (
              <CommandOrbNavItem
                key={item.path}
                item={item}
                active={isNavigationItemActive(location.pathname, item.path)}
                disabled={item.passGated && !PASSES_ENABLED}
                tooltipPlacement="top"
              />
            ))}
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
};

export default FloatingSidebar;
