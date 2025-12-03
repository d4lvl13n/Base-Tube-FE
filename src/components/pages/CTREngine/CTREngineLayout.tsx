// src/components/pages/CTREngine/CTREngineLayout.tsx
// Premium layout for CTR Engine pages - matching ThumbnailLanding aesthetic

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/clerk-react';
import { useAuth } from '../../../contexts/AuthContext';
import { AuthMethod } from '../../../types/auth';
import { BarChart2, ImageIcon, Settings, Lock, Sparkles, Home, ChevronRight, Palette, Images, History } from 'lucide-react';
import Header from '../../common/Header';
import { CTRQuotaDisplay } from './components/CTRQuotaDisplay';
import { CTRQuotaStatus } from '../../../types/ctr';

interface CTREngineLayoutProps {
  children: React.ReactNode;
  quota?: CTRQuotaStatus | null;
  isLoadingQuota?: boolean;
}

const navItems = [
  {
    path: '/ai-thumbnails/creative',
    label: 'Creative',
    icon: Palette,
    description: 'Free-form thumbnail generation',
    requiresAuth: false,
  },
  {
    path: '/ai-thumbnails/audit',
    label: 'Audit',
    icon: BarChart2,
    description: 'Analyze any thumbnail',
    requiresAuth: false,
  },
  {
    path: '/ai-thumbnails/generate',
    label: 'CTR Generate',
    icon: ImageIcon,
    description: 'Create CTR-optimized thumbnails',
    requiresAuth: true,
  },
  {
    path: '/ai-thumbnails/history',
    label: 'History',
    icon: History,
    description: 'View past audits & stats',
    requiresAuth: true,
  },
  {
    path: '/ai-thumbnails/gallery',
    label: 'My Gallery',
    icon: Images,
    description: 'View all your thumbnails',
    requiresAuth: true,
  },
  {
    path: '/ai-thumbnails/settings',
    label: 'Settings',
    icon: Settings,
    description: 'Face reference & preferences',
    requiresAuth: true,
  },
];

export const CTREngineLayout: React.FC<CTREngineLayoutProps> = ({
  children,
  quota,
  isLoadingQuota,
}) => {
  const location = useLocation();
  const { isSignedIn, isLoaded: isClerkLoaded } = useUser();
  const { isAuthenticated: isWeb3Authenticated } = useAuth();
  
  // Determine auth method and check both Clerk and Web3 auth
  const authMethod = typeof window !== 'undefined' 
    ? localStorage.getItem('auth_method') as AuthMethod 
    : null;
  const isSignedInAny = authMethod === AuthMethod.WEB3 
    ? isWeb3Authenticated 
    : (isClerkLoaded && isSignedIn);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#09090B] via-[#111114] to-[#09090B] overflow-hidden">
      <Header className="sticky top-0 z-50" />
      
      {/* Background Elements - matching ThumbnailHero */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#fa7517]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-orange-400/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-2/3 left-1/3 w-64 h-64 bg-[#fa7517]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fa7517' fill-opacity='0.03'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Breadcrumb & Page Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link to="/" className="hover:text-gray-300 transition-colors flex items-center gap-1">
              <Home className="w-3.5 h-3.5" />
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to="/ai-thumbnails" className="hover:text-gray-300 transition-colors">
              AI Thumbnails
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-300">CTR Engine</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-[#fa7517]/20 to-orange-400/20 rounded-full border border-[#fa7517]/30 mb-4"
              >
                <Sparkles className="w-4 h-4 text-[#fa7517]" />
                <span className="text-sm font-medium text-white">Pro Feature</span>
              </motion.div>
              
              <h1 className="text-3xl md:text-4xl font-bold">
                <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  CTR Thumbnail
                </span>{' '}
                <span className="bg-gradient-to-r from-[#fa7517] to-orange-400 bg-clip-text text-transparent">
                  Engine
                </span>
              </h1>
              <p className="text-gray-400 mt-2">
                Audit, optimize, and generate thumbnails that maximize clicks
              </p>
            </div>
            
            {/* Quota Display */}
            {!isLoadingQuota && quota && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <CTRQuotaDisplay quota={quota} variant="compact" />
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Navigation Tabs - matching ThumbnailHero AppNavBar style */}
        <motion.nav 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8"
        >
          <div className="flex items-center gap-1 p-1.5 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm w-fit">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const isDisabled = item.requiresAuth && !isSignedInAny;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.path}
                  to={isDisabled ? '#' : item.path}
                  onClick={(e) => isDisabled && e.preventDefault()}
                  className={`relative flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                             ${isDisabled ? 'cursor-not-allowed opacity-50' : ''}
                             ${isActive
                               ? 'bg-gradient-to-r from-[#fa7517] to-orange-500 text-white shadow-lg shadow-[#fa7517]/25'
                               : 'text-gray-400 hover:text-white hover:bg-white/5'
                             }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.requiresAuth && !isSignedInAny && (
                    <Lock className="w-3.5 h-3.5 text-gray-500" />
                  )}
                </Link>
              );
            })}
          </div>
        </motion.nav>

        {/* Main Content */}
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
};

export default CTREngineLayout;
