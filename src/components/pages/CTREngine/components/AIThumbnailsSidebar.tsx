// src/components/pages/CTREngine/components/AIThumbnailsSidebar.tsx
// Sidebar navigation for AI Thumbnails

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useAuth as useWeb3Auth } from '../../../../contexts/AuthContext';
import { 
  BarChart2, 
  Lock, 
  Zap,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { CTRQuotaStatus } from '../../../../types/ctr';
import { formatQuotaLimit } from '../../../../api/ctr';
import { AI_THUMBNAILS_NAV_ITEMS, type AIThumbnailsNavItem } from './aiThumbnailsNav';

export interface AIThumbnailsSidebarProps {
  quota?: CTRQuotaStatus | null;
  isLoadingQuota?: boolean;
  className?: string;
  items?: AIThumbnailsNavItem[];
  isCollapsed?: boolean;
  onToggle?: () => void;
  onLinkClick?: () => void; // Callback when a link is clicked (for mobile menu)
}

const AIThumbnailsSidebar: React.FC<AIThumbnailsSidebarProps> = ({
  quota,
  isLoadingQuota,
  className = '',
  items = AI_THUMBNAILS_NAV_ITEMS,
  isCollapsed = false,
  onToggle,
  onLinkClick,
}) => {
  const location = useLocation();
  
  // Unified auth check - same pattern as useRequireAuth and useTokenGate
  const { isSignedIn } = useClerkAuth();
  const { isAuthenticated: isWeb3Authenticated } = useWeb3Auth();
  const isSignedInAny = isSignedIn || isWeb3Authenticated;

  // Quota calculations
  const auditProgress = quota?.audit ? (quota.audit.used / quota.audit.limit) * 100 : 0;
  const genProgress = quota?.generate ? (quota.generate.used / quota.generate.limit) * 100 : 0;

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 256 }}
      className={`h-screen flex flex-col bg-black/50 border-r border-gray-800/30 backdrop-blur-sm overflow-hidden flex-shrink-0 ${className}`}
      style={{
        boxShadow: `
          0 0 20px 5px rgba(250, 117, 23, 0.1),
          0 0 40px 10px rgba(250, 117, 23, 0.05),
          inset 0 0 60px 15px rgba(250, 117, 23, 0.03)
        `,
        position: 'sticky',
        top: 0,
        zIndex: 40
      }}
    >
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          const isDisabled = item.requiresAuth && !isSignedInAny;
          const Icon = item.icon;
          
          return (
            <motion.div
              key={item.path}
              whileHover={{ x: 4 }}
              className={`
                relative group cursor-pointer
                ${isActive ? 'bg-[#fa7517]/10' : 'hover:bg-gray-800/30'}
                rounded-lg transition-colors
                ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}
              `}
            >
              <Link
                to={isDisabled ? '#' : item.path}
                onClick={(e) => {
                  if (isDisabled) {
                    e.preventDefault();
                  } else if (onLinkClick) {
                    // Close mobile menu when clicking a link
                    onLinkClick();
                  }
                }}
                className={`
                  flex items-center px-4 py-2.5
                  ${isActive ? 'text-[#fa7517]' : 'text-gray-400 hover:text-white'}
                `}
              >
                <Icon className="w-5 h-5 min-w-[20px]" />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="flex-1 overflow-hidden ml-3"
                  >
                    <span className="font-medium whitespace-nowrap">{item.label}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {item.requiresAuth && !isSignedInAny && !isCollapsed && (
                <Lock className="w-3.5 h-3.5 ml-auto text-gray-600" />
              )}
            </Link>

            {/* Active Indicator */}
            {isActive && (
              <motion.div
                layoutId="activeIndicator"
                className="absolute left-0 top-0 w-1 h-full bg-[#fa7517] rounded-r"
              />
            )}

            {/* Tooltip for collapsed state */}
            {isCollapsed && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-black/90 border border-gray-800 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 whitespace-nowrap">
                  <p className="text-sm text-white font-medium">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
              )}
            </motion.div>
          );
        })}
      </nav>

      {/* Quota Section */}
      {!isLoadingQuota && quota && (
        <div className={`px-4 pb-4 border-t border-gray-800/30 ${isCollapsed ? 'px-2' : ''}`}>
          {isCollapsed ? (
            // Collapsed: Mini quota indicators
            <div className="flex flex-col gap-2 items-center">
              <div className="relative w-10 h-10 rounded-full bg-black/60 border border-gray-800/50 flex items-center justify-center group">
                <Zap className="w-4 h-4 text-[#fa7517]" />
                <div className="absolute inset-0 rounded-full">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-800" />
                    <circle 
                      cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="2" 
                      className="text-[#fa7517]"
                      strokeDasharray={`${genProgress} 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                {/* Tooltip */}
                <div className="absolute left-full ml-2 px-3 py-2 bg-black/90 border border-gray-800 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 whitespace-nowrap">
                  <p className="text-xs text-gray-400">Creates: {quota.generate.used}/{formatQuotaLimit(quota.generate.limit)}</p>
                  <p className="text-xs text-gray-400">Audits: {quota.audit.used}/{formatQuotaLimit(quota.audit.limit)}</p>
                </div>
              </div>
            </div>
          ) : (
            // Expanded: Full quota display
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Today's Progress</span>
              </div>
              
              {/* Creates */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-[#fa7517]" />
                    Creates
                  </span>
                  <span className="text-gray-500">{quota.generate.used}/{formatQuotaLimit(quota.generate.limit)}</span>
                </div>
                <div className="h-1.5 bg-black/60 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-[#fa7517] to-orange-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(genProgress, 100)}%` }}
                  />
                </div>
              </div>

              {/* Audits */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <BarChart2 className="w-3 h-3 text-blue-400" />
                    Audits
                  </span>
                  <span className="text-gray-500">{quota.audit.used}/{formatQuotaLimit(quota.audit.limit)}</span>
                </div>
                <div className="h-1.5 bg-black/60 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(auditProgress, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Collapse Button */}
      {onToggle && (
        <button
          onClick={onToggle}
          className="p-3 border-t border-gray-800/30 text-gray-500 hover:text-white hover:bg-gray-800/30 transition-colors flex items-center justify-center"
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      )}
    </motion.aside>
  );
};

export default AIThumbnailsSidebar;

export type { AIThumbnailsNavItem };
