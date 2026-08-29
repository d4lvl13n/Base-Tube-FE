import React from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigation } from '../../contexts/NavigationContext';
import CommandOrbNavItem from './CommandOrbNavItem';
import FloatingSidebar from './FloatingSidebar';
import { isNavigationItemActive, navigationItems } from './navigationItems';

const PASSES_ENABLED = process.env.REACT_APP_SHOW_PASSES === 'true';

const Sidebar: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { navStyle } = useNavigation();
  const location = useLocation();

  if (navStyle === 'floating') {
    return <FloatingSidebar />;
  }

  return (
    <nav
      aria-label="Primary navigation"
      className={`relative h-full w-16 overflow-visible bg-black flex flex-col items-center py-12 ${className}`}
    >
      <div className="pointer-events-none absolute left-1/2 top-12 bottom-12 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[rgba(214,235,253,0.12)] to-transparent" />
      <div className="pointer-events-none absolute left-1/2 top-20 h-24 w-px -translate-x-1/2 bg-gradient-to-b from-[#fa7517]/0 via-[#fa7517]/35 to-[#fa7517]/0 blur-[1px]" />

      <div className="relative flex flex-1 flex-col items-center gap-5">
        {navigationItems.map((item) => (
          <CommandOrbNavItem
            key={item.path}
            item={item}
            active={isNavigationItemActive(location.pathname, item.path)}
            disabled={item.passGated && !PASSES_ENABLED}
            tooltipPlacement="right"
          />
        ))}
      </div>
    </nav>
  );
};

export default Sidebar;
