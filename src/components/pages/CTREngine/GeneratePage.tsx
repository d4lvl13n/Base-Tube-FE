// src/components/pages/CTREngine/GeneratePage.tsx
// Premium CTR-Optimized Thumbnail Generation Page

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SignInButton } from '@clerk/clerk-react';
import { Lock, Sparkles, Image, Wand2, Palette, AlertCircle, X, ArrowLeft } from 'lucide-react';
import CTREngineLayout from './CTREngineLayout';
import { CTRGeneratorForm } from './components/CTRGeneratorForm';
import { GeneratedConceptsGrid } from './components/GeneratedConceptsGrid';
import useCTREngine from '../../../hooks/useCTREngine';

const GeneratePage: React.FC = () => {
  // Auth is handled inside useCTREngine which checks both Clerk and Web3
  const {
    generateThumbnails,
    generatedConcepts,
    detectedNiche,
    generationTime,
    generationProgress,
    clearGeneratedConcepts,
    niches,
    isLoadingNiches,
    faceReference,
    quota,
    isLoadingQuota,
    error,
    clearError,
    isAuthenticated,
  } = useCTREngine();

  // Auth gate for anonymous users (checks both Clerk and Web3)
  if (!isAuthenticated) {
    return (
      <CTREngineLayout quota={quota} isLoadingQuota={isLoadingQuota}>
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
            Sign In to Generate
          </motion.h2>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-gray-400 mb-8 max-w-md mx-auto"
          >
            Creating CTR-optimized thumbnails requires an account to ensure your generated content is saved and accessible.
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

          {/* Feature Preview */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-12 p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm"
          >
            <h3 className="text-lg font-semibold text-white mb-4">What you'll get:</h3>
            <div className="grid sm:grid-cols-3 gap-4 text-left">
              {[
                { icon: Wand2, title: 'AI Generation', desc: 'CTR-optimized concepts' },
                { icon: Image, title: 'Face Integration', desc: 'Your face in thumbnails' },
                { icon: Palette, title: 'Niche Styling', desc: 'Genre-specific designs' },
              ].map((feature) => (
                <div key={feature.title} className="flex items-start gap-3">
                  <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-[#fa7517]/10 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-[#fa7517]" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium text-sm">{feature.title}</h4>
                    <p className="text-gray-500 text-xs">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </CTREngineLayout>
    );
  }

  return (
    <CTREngineLayout quota={quota} isLoadingQuota={isLoadingQuota}>
      {/* Page Header */}
      {generatedConcepts.length === 0 && (
        <div className="text-center mb-10">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#fa7517]/10 border border-[#fa7517]/30 rounded-full text-[#fa7517] text-sm font-medium mb-4"
          >
            <Sparkles className="w-4 h-4" />
            AI-Powered Generator
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-3xl md:text-4xl font-bold text-white mb-3"
          >
            Generate{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fa7517] to-orange-400">
              Click-Worthy
            </span>{' '}
            Thumbnails
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 max-w-lg mx-auto"
          >
            Create high-converting thumbnails optimized for your niche and audience
          </motion.p>
        </div>
      )}

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-3xl mx-auto mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 backdrop-blur-sm"
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

      <AnimatePresence mode="wait">
        {generatedConcepts.length > 0 ? (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Back Button */}
            <div className="mb-6">
              <motion.button
                onClick={clearGeneratedConcepts}
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Generate New Thumbnails
              </motion.button>
            </div>

            <GeneratedConceptsGrid 
              concepts={generatedConcepts}
              detectedNiche={detectedNiche}
              generationTime={generationTime}
              onClear={clearGeneratedConcepts}
            />
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="max-w-3xl mx-auto">
              <CTRGeneratorForm
                onGenerate={generateThumbnails}
                generationProgress={generationProgress}
                niches={niches}
                isLoadingNiches={isLoadingNiches}
                faceReference={faceReference}
                quotaRemaining={quota?.generate?.remaining}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </CTREngineLayout>
  );
};

export default GeneratePage;
