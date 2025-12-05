// src/components/pages/CTREngine/AIThumbnailsLayout.tsx
// AI Thumbnails layout with sidebar - inspired by CreatorHubNav design

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CTRQuotaStatus } from '../../../types/ctr';
import AIThumbnailsSidebar from './components/AIThumbnailsSidebar';
import AIThumbnailsHeader from './components/AIThumbnailsHeader';
import HelpCard from './components/HelpCard';

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

export const AIThumbnailsLayout: React.FC<AIThumbnailsLayoutProps> = ({
  children,
  quota,
  isLoadingQuota,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(true);
  const isDesktop = useIsDesktop();

  return (
    <div className="min-h-screen bg-[#09090B]">
      {/* Header - sticky at top */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full">
        <div className="bg-gradient-to-b from-black via-black/95 to-black/80 backdrop-blur-md border-b border-white/5">
          <div className="max-w-[1920px] mx-auto px-3 sm:px-4">
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
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="md:hidden fixed left-0 top-16 bottom-0 w-[280px] sm:w-72 z-50 overflow-hidden"
                style={{ boxShadow: '0 0 20px 5px rgba(250, 117, 23, 0.08)' }}
              >
                <AIThumbnailsSidebar 
                  quota={quota} 
                  isLoadingQuota={isLoadingQuota}
                  isCollapsed={false}
                  className="h-full"
                  onLinkClick={() => setMobileMenuOpen(false)}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

          {/* Content Area - Main + Help Card */}
          <div className="flex-1 flex flex-col xl:flex-row gap-4 xl:gap-6 px-4 sm:px-6 py-4 sm:py-6 lg:py-8 overflow-x-hidden">
            {/* Main Content - closer to sidebar */}
            <main className="flex-1 min-w-0 w-full">
              <div className="max-w-5xl mx-auto">
                {children}
              </div>
            </main>

            {/* Help Card - Right side (hidden on mobile, shown on xl+) */}
            <HelpCard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIThumbnailsLayout;
