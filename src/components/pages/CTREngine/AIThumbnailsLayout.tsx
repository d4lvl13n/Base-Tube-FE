// src/components/pages/CTREngine/AIThumbnailsLayout.tsx
// AI Thumbnails layout with sidebar - inspired by CreatorHubNav design

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/clerk-react';
import { useAuth } from '../../../contexts/AuthContext';
import { AuthMethod } from '../../../types/auth';
import { Lock, Zap, BarChart2 } from 'lucide-react';
import { CTRQuotaStatus } from '../../../types/ctr';
import { formatQuotaLimit } from '../../../api/ctr';
import AIThumbnailsSidebar from './components/AIThumbnailsSidebar';
import AIThumbnailsHeader from './components/AIThumbnailsHeader';
import HelpCard from './components/HelpCard';
import { AI_THUMBNAILS_NAV_ITEMS, type AIThumbnailsNavItem } from './components/aiThumbnailsNav';

// Hook for responsive sidebar visibility
const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isDesktop;
};

interface AIThumbnailsLayoutProps {
  children: React.ReactNode;
  quota?: CTRQuotaStatus | null;
  isLoadingQuota?: boolean;
}

const NAV_ITEMS: AIThumbnailsNavItem[] = AI_THUMBNAILS_NAV_ITEMS;

export const AIThumbnailsLayout: React.FC<AIThumbnailsLayoutProps> = ({
  children,
  quota,
  isLoadingQuota,
}) => {
  const location = useLocation();
  const { isSignedIn, isLoaded: isClerkLoaded } = useUser();
  const { isAuthenticated: isWeb3Authenticated } = useAuth();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(true);
  
  const authMethod = typeof window !== 'undefined' ? localStorage.getItem('auth_method') as AuthMethod : null;
  const isSignedInAny = authMethod === AuthMethod.WEB3 ? isWeb3Authenticated : (isClerkLoaded && isSignedIn);
  const genProgress = quota?.generate ? Math.min((quota.generate.used / quota.generate.limit) * 100, 100) : 0;
  const auditProgress = quota?.audit ? Math.min((quota.audit.used / quota.audit.limit) * 100, 100) : 0;
  const isDesktop = useIsDesktop();

  return (
    <div className="min-h-screen bg-[#09090B]">
      {/* Header - sticky at top */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full">
        <div className="bg-gradient-to-b from-black via-black/95 to-black/80 backdrop-blur-md border-b border-white/5">
          <div className="max-w-[1920px] mx-auto px-4">
            <AIThumbnailsHeader 
              isMobileMenuOpen={mobileMenuOpen}
              onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
              isNavOpen={isNavOpen}
              onNavToggle={() => setIsNavOpen((prev) => !prev)}
            />
          </div>
        </div>
      </header>

      {/* Sidebar and Main Content */}
      <div className="flex pt-16">
        {/* Sidebar - visible on desktop only */}
        {isDesktop && (
          <AIThumbnailsSidebar 
            quota={quota} 
            isLoadingQuota={isLoadingQuota}
            isCollapsed={!isNavOpen}
            onToggle={() => setIsNavOpen((prev) => !prev)}
          />
        )}

        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile navigation drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="md:hidden fixed inset-0 bg-black/60 z-40"
              />
              <motion.div
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                className="md:hidden fixed left-0 top-14 bottom-0 w-72 bg-[#09090B] z-50 p-4 overflow-y-auto"
                style={{ boxShadow: '0 0 20px 5px rgba(250, 117, 23, 0.08)' }}
              >
                <nav className="space-y-1">
                  {NAV_ITEMS.map((item: AIThumbnailsNavItem) => {
                    const isActive = location.pathname === item.path;
                    const isDisabled = item.requiresAuth && !isSignedInAny;
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.path}
                        to={isDisabled ? '#' : item.path}
                        onClick={(e) => {
                          if (isDisabled) {
                            e.preventDefault();
                          } else {
                            setMobileMenuOpen(false);
                          }
                        }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                          ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}
                          ${isActive ? 'bg-[#fa7517]/10 text-[#fa7517]' : 'text-gray-400 hover:text-white hover:bg-gray-800/30'}`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{item.label}</span>
                        {item.requiresAuth && !isSignedInAny && (
                          <Lock className="w-3.5 h-3.5 ml-auto text-gray-600" />
                        )}
                      </Link>
                    );
                  })}
                </nav>

                {!isLoadingQuota && quota && (
                  <div className="mt-6 border-t border-white/5 pt-4 space-y-3">
                    <div>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span className="flex items-center gap-1.5">
                          <Zap className="w-3 h-3 text-[#fa7517]" /> Creates
                        </span>
                        <span className="text-gray-500">
                          {quota.generate.used}/{formatQuotaLimit(quota.generate.limit)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-black/60 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-[#fa7517] to-orange-400"
                          initial={{ width: 0 }}
                          animate={{ width: `${genProgress}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span className="flex items-center gap-1.5">
                          <BarChart2 className="w-3 h-3 text-blue-400" /> Audits
                        </span>
                        <span className="text-gray-500">
                          {quota.audit.used}/{formatQuotaLimit(quota.audit.limit)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-black/60 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
                          initial={{ width: 0 }}
                          animate={{ width: `${auditProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

          {/* Content Area - Main + Help Card */}
          <div className="flex-1 flex gap-6 pl-4 pr-6 py-6 lg:py-8 overflow-x-hidden">
            {/* Main Content - closer to sidebar */}
            <main className="flex-1 min-w-0">
              <div className="max-w-5xl">
                {children}
              </div>
            </main>

            {/* Help Card - Right side */}
            <HelpCard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIThumbnailsLayout;
