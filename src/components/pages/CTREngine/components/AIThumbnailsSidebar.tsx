// src/components/pages/CTREngine/components/AIThumbnailsSidebar.tsx
// Sidebar navigation for AI Thumbnails

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useAuth as useWeb3Auth } from '../../../../contexts/AuthContext';
import ReferralPanel from './ReferralPanel';
import { 
  BarChart2, 
  Lock, 
  Zap,
  ChevronLeft,
  ChevronRight,
  Coins,
  UserPlus
} from 'lucide-react';
import { CTRUsageAccess } from '../../../../types/ctr';
import { formatQuotaLimit } from '../../../../api/ctr';
import { formatCreditCost } from '../../../../utils/usageAccess';
import { AI_THUMBNAILS_NAV_ITEMS, type AIThumbnailsNavItem } from './aiThumbnailsNav';
import { useStudioBalanceLoadFailure } from '../../../../hooks/useStudioBalance';
import { freeCreditsText, useWelcomeOffer, WELCOME_CREDITS_GIVEN_OUT } from '../../../../hooks/useWelcomeOffer';
import { startStudioAuth, STUDIO_SIGN_UP_PATH } from '../../../../utils/studioAuth';

export interface AIThumbnailsSidebarProps {
  usageAccess?: CTRUsageAccess | null;
  isLoadingQuota?: boolean;
  className?: string;
  items?: AIThumbnailsNavItem[];
  isCollapsed?: boolean;
  onToggle?: () => void;
  onLinkClick?: () => void; // Callback when a link is clicked (for mobile menu)
}

/**
 * A visitor's allowance: the free audits a day (GET /ctr/quota) and a free
 * account with its welcome credits (GET /tool/welcome-offer). Visitors cannot
 * generate, so no create allowance is shown.
 */
function VisitorAllowance({ usageAccess, isLoadingQuota, isCollapsed, onLinkClick }: {
  usageAccess?: CTRUsageAccess | null;
  isLoadingQuota?: boolean;
  isCollapsed: boolean;
  onLinkClick?: () => void;
}) {
  const location = useLocation();
  const offer = useWelcomeOffer();
  const audit = !isLoadingQuota && usageAccess?.mode === 'quota' && usageAccess.quota.audit.limit > 0
    ? usageAccess.quota.audit
    : null;
  const auditsLine = audit ? `${audit.limit} free audit${audit.limit === 1 ? '' : 's'} a day` : '';
  const leftLine = audit ? `${Math.max(audit.remaining, 0)} left today` : '';
  const auditProgress = audit ? Math.min((audit.used / audit.limit) * 100, 100) : 0;
  const accountLine = offer.available
    ? `Create a free account — ${freeCreditsText(offer.credits)}`
    : 'Create a free account';
  const signUp = () => {
    startStudioAuth('sign-up', location.pathname + location.search);
    onLinkClick?.();
  };

  if (isCollapsed) {
    return (
      <div className="flex flex-col gap-2 items-center">
        {audit && (
          <div className="relative w-10 h-10 rounded-full bg-black/60 border border-gray-800/50 flex items-center justify-center group">
            <BarChart2 className="w-4 h-4 text-blue-400" />
            <div className="absolute inset-0 rounded-full">
              <svg className="w-full h-full -rotate-90">
                <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-800" />
                <circle
                  cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="2"
                  className="text-blue-400"
                  strokeDasharray={`${auditProgress} 100`}
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="absolute left-full ml-2 px-3 py-2 bg-black/90 border border-gray-800 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 whitespace-nowrap">
              <p className="text-xs text-gray-300">{auditsLine}</p>
              <p className="text-xs text-gray-400">{leftLine}</p>
            </div>
          </div>
        )}
        <Link
          to={STUDIO_SIGN_UP_PATH}
          onClick={signUp}
          aria-label={accountLine}
          title={accountLine}
          className="w-10 h-10 rounded-full bg-black/60 border border-[#fa7517]/40 flex items-center justify-center text-[#fa7517] hover:bg-[#fa7517]/10"
        >
          <UserPlus className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {audit && (
        <div className="space-y-1">
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <BarChart2 className="w-3 h-3 text-blue-400" />
            {auditsLine}
          </p>
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 bg-black/60 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${auditProgress}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap">{leftLine}</span>
          </div>
        </div>
      )}
      <div className="space-y-1">
        <Link
          to={STUDIO_SIGN_UP_PATH}
          onClick={signUp}
          className="flex items-start gap-1.5 text-xs font-medium text-[#fb923c] hover:text-orange-300"
        >
          <UserPlus className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>{accountLine}</span>
        </Link>
        {!offer.available && <p className="text-xs text-gray-500">{WELCOME_CREDITS_GIVEN_OUT}</p>}
      </div>
    </div>
  );
}

const AIThumbnailsSidebar: React.FC<AIThumbnailsSidebarProps> = ({
  usageAccess,
  isLoadingQuota,
  className = '',
  items = AI_THUMBNAILS_NAV_ITEMS,
  isCollapsed = false,
  onToggle,
  onLinkClick,
}) => {
  const location = useLocation();
  
  // Unified auth check - same pattern as useRequireAuth and useTokenGate
  const { isSignedIn, isLoaded: isClerkLoaded } = useClerkAuth();
  const { isAuthenticated: isWeb3Authenticated, isRestoring: isWeb3Restoring } = useWeb3Auth();
  const isSignedInAny = isSignedIn || isWeb3Authenticated;
  // Signed out once both sign-ins are known, so an account never sees the visitor offer while loading.
  const isVisitor = !isSignedInAny && isClerkLoaded === true && !isWeb3Restoring;
  // Only a failed first read is reported; background refresh failures stay silent.
  const balanceLoad = useStudioBalanceLoadFailure();
  const balanceUnavailable = !isLoadingQuota && !usageAccess && balanceLoad.failed;

  // Quota calculations
  const auditProgress = usageAccess?.mode === 'quota' && usageAccess.quota.audit.limit > 0
    ? (usageAccess.quota.audit.used / usageAccess.quota.audit.limit) * 100
    : 0;
  const genProgress = usageAccess?.mode === 'quota' && usageAccess.quota.generate.limit > 0
    ? (usageAccess.quota.generate.used / usageAccess.quota.generate.limit) * 100
    : 0;

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 72 : 224 }}
      className={`ai-studio-sidebar h-screen flex flex-col bg-[#0d0d0f] border-r border-white/[0.08] overflow-hidden flex-shrink-0 ${className}`}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40
      }}
    >
      <Link
        to="/"
        onClick={onLinkClick}
        className={`flex h-[68px] flex-shrink-0 items-center border-b border-white/[0.06] ${
          isCollapsed ? 'justify-center px-3' : 'gap-2.5 px-5'
        }`}
      >
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-[#fa7517]/30 bg-[#fa7517]/10">
          <img src="/assets/basetubelogo.png" alt="" className="h-6 w-6" />
        </span>
        {!isCollapsed && (
          <span className="whitespace-nowrap text-[15px] font-semibold tracking-tight text-zinc-100">
            Base.Tube
          </span>
        )}
      </Link>

      {/* Navigation */}
      <nav className={`flex-1 space-y-1 overflow-y-auto custom-scrollbar ${isCollapsed ? 'p-3' : 'px-3 py-5'}`}>
        {items.map((item) => {
          const isActive =
            location.pathname === item.path ||
            // Projects and the settings hub own their sub-pages (a project, a settings section).
            ((item.path === '/ai-thumbnails/projects' || item.path === '/ai-thumbnails/settings') &&
              location.pathname.startsWith(`${item.path}/`));
          const isDisabled = item.requiresAuth && !isSignedInAny;
          const Icon = item.icon;
          
          return (
            <motion.div
              key={item.path}
              whileHover={{ x: isDisabled ? 0 : 2 }}
              className={`
                relative group cursor-pointer
                ${isActive ? 'bg-[#fa7517]/10' : 'hover:bg-white/[0.04]'}
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
                  flex items-center py-2.5 text-sm
                  ${isCollapsed ? 'justify-center px-2' : 'px-3'}
                  ${isActive ? 'text-[#fb923c]' : 'text-zinc-500 hover:text-zinc-200'}
                `}
              >
                <Icon className="w-4 h-4 min-w-[16px]" />
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
                className="absolute left-0 top-1 bottom-1 w-0.5 bg-[#fa7517] rounded-r"
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

      {/* Referral — self-fetches and self-hides when unauthenticated; only render expanded + signed-in */}
      {isSignedInAny && !isCollapsed && (
        <div className="px-4 pb-2">
          <ReferralPanel />
        </div>
      )}

      {/* Balance that could not be loaded */}
      {balanceUnavailable && (
        <div className={`mx-3 px-1 py-4 border-t border-white/[0.07] ${isCollapsed ? 'flex justify-center px-0' : ''}`}>
          {isCollapsed ? (
            <button
              type="button"
              onClick={balanceLoad.retry}
              disabled={balanceLoad.retrying}
              aria-label="Couldn't load your credit balance. Retry"
              title="Couldn't load your credit balance. Retry"
              className="w-10 h-10 rounded-full bg-black/60 border border-amber-500/40 flex items-center justify-center text-amber-300 disabled:opacity-50"
            >
              <Coins className="w-4 h-4" />
            </button>
          ) : (
            <p role="status" className="text-xs text-amber-200">
              Couldn't load your credit balance.{' '}
              <button
                type="button"
                onClick={balanceLoad.retry}
                disabled={balanceLoad.retrying}
                className="underline disabled:opacity-50"
              >
                {balanceLoad.retrying ? 'Retrying…' : 'Retry'}
              </button>
            </p>
          )}
        </div>
      )}

      {/* Visitor: free audits and a free account (no create allowance) */}
      {isVisitor && (
        <div className={`mx-3 px-1 py-4 border-t border-white/[0.07] ${isCollapsed ? 'px-0' : ''}`}>
          <VisitorAllowance
            usageAccess={usageAccess}
            isLoadingQuota={isLoadingQuota}
            isCollapsed={isCollapsed}
            onLinkClick={onLinkClick}
          />
        </div>
      )}

      {/* Quota Section */}
      {isSignedInAny && !isLoadingQuota && usageAccess && (
        <div className={`mx-3 px-1 py-4 border-t border-white/[0.07] ${isCollapsed ? 'px-0' : ''}`}>
          {usageAccess.mode === 'credits' ? (
            isCollapsed ? (
              <div className="flex flex-col gap-2 items-center">
                <div className="relative w-10 h-10 rounded-full bg-black/60 border border-gray-800/50 flex items-center justify-center group">
                  <Coins className="w-4 h-4 text-[#fa7517]" />
                  <div className="absolute left-full ml-2 px-3 py-2 bg-black/90 border border-gray-800 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 whitespace-nowrap">
                    <p className="text-xs text-gray-300">Available: {usageAccess.creditInfo.available}</p>
                    <p className="text-xs text-gray-400">CTR generate: {formatCreditCost(usageAccess.pricing?.ctr.generatePerConcept ?? 0)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Link
                  to="/ai-thumbnails/settings/credits"
                  onClick={onLinkClick}
                  className="flex items-center justify-between rounded-md text-xs hover:text-zinc-200"
                >
                  <span className="text-gray-500">Available Credits</span>
                  <span className="text-[#fa7517] font-semibold">{usageAccess.creditInfo.available}</span>
                </Link>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl border border-gray-800/50 bg-black/40 p-3">
                    <p className="text-gray-500">Generate</p>
                    <p className="mt-1 text-white">{formatCreditCost(usageAccess.pricing?.ctr.generatePerConcept ?? 0)}</p>
                  </div>
                  <div className="rounded-xl border border-gray-800/50 bg-black/40 p-3">
                    <p className="text-gray-500">Audit</p>
                    <p className="mt-1 text-white">{formatCreditCost(usageAccess.pricing?.ctr.audit ?? 0)}</p>
                  </div>
                </div>
              </div>
            )
          ) : isCollapsed ? (
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
                  <p className="text-xs text-gray-400">Creates: {usageAccess.quota.generate.used}/{formatQuotaLimit(usageAccess.quota.generate.limit)}</p>
                  <p className="text-xs text-gray-400">Audits: {usageAccess.quota.audit.used}/{formatQuotaLimit(usageAccess.quota.audit.limit)}</p>
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
                  <span className="text-gray-500">{usageAccess.quota.generate.used}/{formatQuotaLimit(usageAccess.quota.generate.limit)}</span>
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
                  <span className="text-gray-500">{usageAccess.quota.audit.used}/{formatQuotaLimit(usageAccess.quota.audit.limit)}</span>
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
          className="p-3 border-t border-white/[0.07] text-zinc-600 hover:text-zinc-200 hover:bg-white/[0.03] transition-colors flex items-center justify-center"
          aria-label={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      )}
    </motion.aside>
  );
};

export default AIThumbnailsSidebar;

export type { AIThumbnailsNavItem };
