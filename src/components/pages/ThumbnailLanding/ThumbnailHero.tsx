import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, ArrowRight, Eye, TrendingUp, ArrowLeft } from 'lucide-react';
import Button from '../../common/Button';
import CollapsibleThumbnailGenerator from './CollapsibleThumbnailGenerator';

interface ThumbnailHeroProps {
  onSignUpClick: () => void;
}

const ThumbnailHero: React.FC<ThumbnailHeroProps> = ({ onSignUpClick }) => {
  const [isProfessionalMode, setIsProfessionalMode] = useState(false);

  const handleEnterProfessionalMode = () => {
    setIsProfessionalMode(true);
  };

  const handleExitProfessionalMode = () => {
    setIsProfessionalMode(false);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#09090B] via-[#111114] to-[#09090B] overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#fa7517]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fa7517' fill-opacity='0.05'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <AnimatePresence mode="wait">
          {isProfessionalMode ? (
            /* Professional Mode - Full Width Generator */
            <motion.div
              key="professional"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="min-h-screen flex flex-col"
            >
              {/* Back to Landing Button */}
              <motion.button
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                onClick={handleExitProfessionalMode}
                className="self-start mb-6 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 text-white transition-all duration-200 group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-sm">Back to Landing</span>
              </motion.button>

              {/* Full Width Professional Generator */}
              <div className="flex-1 flex items-center justify-center">
                <CollapsibleThumbnailGenerator 
                  className="w-full max-w-6xl"
                  isProfessionalMode={true}
                  onExitProfessionalMode={handleExitProfessionalMode}
                  onThumbnailGenerated={() => {
                    console.log('Thumbnail generated in professional mode');
                  }}
                />
              </div>
            </motion.div>
          ) : (
            /* Landing Mode - Two Column Layout */
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="grid lg:grid-cols-2 gap-12 items-center min-h-screen"
            >
              {/* Left Section - Copy & CTA */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.8 }}
                className="lg:pr-8"
              >
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#fa7517]/20 to-orange-400/20 rounded-full border border-[#fa7517]/30 mb-6"
                >
                  <Sparkles className="w-4 h-4 text-[#fa7517]" />
                  <span className="text-sm font-medium text-white">AI-Powered • Instant • Professional</span>
                </motion.div>

                {/* Main Headline */}
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
                >
                  <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Thumbnails That
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-[#fa7517] to-orange-400 bg-clip-text text-transparent">
                    Get Clicked
                  </span>
                </motion.h1>

                {/* Subheadline */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-xl text-gray-300 mb-8 leading-relaxed"
                >
                  Transform your video ideas into <span className="text-[#fa7517] font-semibold">scroll-stopping thumbnails</span> in seconds. 
                  No design skills needed. Just pure AI magic.
                </motion.p>

                {/* Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="grid grid-cols-3 gap-6 mb-8"
                >
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-2xl font-bold text-white mb-1">
                      <TrendingUp className="w-6 h-6 text-[#fa7517]" />
                      <span>3.2x</span>
                    </div>
                    <p className="text-sm text-gray-400">Higher CTR</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-2xl font-bold text-white mb-1">
                      <Zap className="w-6 h-6 text-[#fa7517]" />
                      <span>&lt;30s</span>
                    </div>
                    <p className="text-sm text-gray-400">Generation Time</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-2xl font-bold text-white mb-1">
                      <Eye className="w-6 h-6 text-[#fa7517]" />
                      <span>100%</span>
                    </div>
                    <p className="text-sm text-gray-400">Unique Designs</p>
                  </div>
                </motion.div>

                {/* CTA Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="mb-8"
                >
                  <Button
                    onClick={onSignUpClick}
                    className="group relative bg-gradient-to-r from-[#fa7517] to-orange-400 hover:from-[#fa7517]/90 hover:to-orange-400/90 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg shadow-[#fa7517]/25 hover:shadow-[#fa7517]/40 transition-all duration-300"
                  >
                    <span className="flex items-center gap-2">
                      Start Creating Free
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#fa7517] to-orange-400 rounded-full opacity-0 group-hover:opacity-100 blur transition-all duration-300" />
                  </Button>
                </motion.div>

                {/* Trust Indicators */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="flex items-center gap-4 text-sm text-gray-400"
                >
                  <span>✓ No credit card required</span>
                  <span>✓ 2 variations per generation</span>
                  <span>✓ HD 1536x1024 quality</span>
                </motion.div>
              </motion.div>

              {/* Right Section - Collapsible Thumbnail Generator */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="lg:pl-8"
              >
                <CollapsibleThumbnailGenerator 
                  className="w-full"
                  isProfessionalMode={false}
                  onEnterProfessionalMode={handleEnterProfessionalMode}
                  onThumbnailGenerated={() => {
                    console.log('Thumbnail generated in landing mode');
                  }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>


    </div>
  );
};

export default ThumbnailHero; 