// src/components/pages/CTREngine/SettingsPage.tsx
// Premium Face Reference Settings Page

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SignInButton } from '@clerk/clerk-react';
import { 
  Lock, 
  Sparkles, 
  AlertCircle, 
  X, 
  Image, 
  BarChart2, 
  User, 
  Shield, 
  ArrowRight, 
  Info,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AIThumbnailsLayout from './AIThumbnailsLayout';
import { FaceReferenceUploader } from './components/FaceReferenceUploader';
import { CTRQuotaDisplay } from './components/CTRQuotaDisplay';
import useCTREngine from '../../../hooks/useCTREngine';
import { cardStyles } from './styles/cardTokens';

const SettingsPage: React.FC = () => {
  // Auth is handled inside useCTREngine which checks both Clerk and Web3
  const {
    quota,
    isLoadingQuota,
    faceReference,
    isLoadingFaceReference,
    isUploadingFaceReference,
    uploadFaceReference,
    deleteFaceReference,
    error,
    clearError,
    isAuthenticated,
  } = useCTREngine();

  // Auth gate for anonymous users (checks both Clerk and Web3)
  if (!isAuthenticated) {
    return (
      <AIThumbnailsLayout quota={quota} isLoadingQuota={isLoadingQuota}>
        <div className="max-w-xl mx-auto text-center py-16">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-[#fa7517]/20 to-orange-500/20 flex items-center justify-center border border-[#fa7517]/30"
          >
            <Lock className="w-10 h-10 text-[#fa7517]" />
          </motion.div>
          
          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold text-white mb-4"
          >
            Sign In Required
          </motion.h2>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-gray-400 mb-8 max-w-md mx-auto"
          >
            Face reference settings require an account. Sign in to upload your face and create personalized thumbnails.
          </motion.p>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <SignInButton mode="modal">
              <button className="py-3.5 px-6 bg-gradient-to-r from-[#fa7517] to-orange-500 hover:from-[#fa7517]/90 hover:to-orange-500/90 text-white rounded-xl font-semibold transition-all shadow-lg shadow-[#fa7517]/25 flex items-center justify-center gap-2 mx-auto">
                <Sparkles className="w-5 h-5" />
                Sign In to Continue
              </button>
            </SignInButton>
          </motion.div>
        </div>
      </AIThumbnailsLayout>
    );
  }

  return (
    <AIThumbnailsLayout quota={quota} isLoadingQuota={isLoadingQuota}>
      <div className="max-w-5xl mx-auto">
        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 backdrop-blur-sm"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="flex-1 text-red-400">{error}</p>
              <button
                onClick={clearError}
                className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <FaceReferenceUploader
              faceReference={faceReference}
              isLoading={isLoadingFaceReference}
              isUploading={isUploadingFaceReference}
              onUpload={uploadFaceReference}
              onDelete={deleteFaceReference}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quota Display */}
            {quota && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <CTRQuotaDisplay quota={quota} variant="full" />
              </motion.div>
            )}

            {/* Info Card */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className={`${cardStyles.elevated} rounded-2xl p-5`}
            >
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#fa7517]/20 flex items-center justify-center border border-[#fa7517]/30">
                  <Zap className="w-4 h-4 text-[#fa7517]" />
                </div>
                How It Works
              </h3>
              <ol className="space-y-3">
                {[
                  'Upload a clear photo of your face',
                  'Enable "Include my face" when generating',
                  'AI incorporates your likeness',
                  'Build consistent branding',
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                    <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg bg-gradient-to-br from-[#fa7517]/20 to-orange-500/20 text-[#fa7517] text-xs font-bold border border-[#fa7517]/30">
                      {i + 1}
                    </span>
                    {text}
                  </li>
                ))}
              </ol>
            </motion.div>

            {/* Privacy Note */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className={`${cardStyles.base} rounded-2xl p-5 border-[#fa7517]/20`}
            >
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#fa7517]/10 flex items-center justify-center border border-[#fa7517]/20">
                  <Shield className="w-4 h-4 text-[#fa7517]" />
                </div>
                Your Privacy
              </h3>
              <ul className="space-y-2">
                {[
                  'Stored securely on our servers',
                  'Only used for your generations',
                  'Delete anytime with one click',
                  'Never shared with third parties',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-400">
                    <CheckCircle2 className="w-4 h-4 text-[#fa7517]" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Quick Links */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className={`${cardStyles.base} rounded-2xl p-5`}
            >
              <h3 className="text-sm font-semibold text-white mb-4">Quick Links</h3>
              <div className="space-y-1">
                {[
                  { href: '/ai-thumbnails/generate', icon: Sparkles, label: 'Generate Thumbnails', color: 'text-[#fa7517]' },
                  { href: '/ai-thumbnails/audit', icon: BarChart2, label: 'Audit Thumbnails', color: 'text-[#fa7517]' },
                  { href: '/ai-thumbnails/gallery', icon: Image, label: 'My Gallery', color: 'text-[#fa7517]' },
                ].map((link, i) => (
                  <Link
                    key={i}
                    to={link.href}
                    className="group flex items-center justify-between gap-2 text-sm text-gray-400 hover:text-white transition-all p-3 -mx-1 rounded-xl hover:bg-[#fa7517]/10 border border-transparent hover:border-[#fa7517]/20"
                  >
                    <span className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#fa7517]/10 flex items-center justify-center group-hover:bg-[#fa7517]/20 transition-colors">
                        <link.icon className={`w-4 h-4 ${link.color}`} />
                      </div>
                      {link.label}
                    </span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-[#fa7517]" />
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </AIThumbnailsLayout>
  );
};

export default SettingsPage;
