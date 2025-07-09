import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Video, Eye, Upload, DollarSign, TrendingUp, RefreshCw, Ticket, Play, Coins } from 'lucide-react';

interface OnboardingModalUIProps {
  currentScreen: number;
  userPath: 'creator' | 'collector' | null;
  onSelectPath: (path: 'creator' | 'collector') => void;
  onNext: () => void;
  onBack: () => void;
  onComplete: () => void;
}

// Custom SVG Components
const RevolutionSVG = () => (
  <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
    <motion.circle
      cx="60"
      cy="60"
      r="50"
      stroke="url(#gradient1)"
      strokeWidth="2"
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 2, ease: "easeInOut" }}
    />
    <motion.circle
      cx="60"
      cy="60"
      r="35"
      stroke="url(#gradient2)"
      strokeWidth="1.5"
      fill="none"
      initial={{ pathLength: 0, rotate: 0 }}
      animate={{ pathLength: 1, rotate: 360 }}
      transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}
    />
    <motion.path
      d="M60 30 L70 50 L95 50 L75 65 L85 85 L60 70 L35 85 L45 65 L25 50 L50 50 Z"
      fill="url(#gradient3)"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 1, delay: 0.5 }}
    />
    <defs>
      <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fa7517" />
        <stop offset="100%" stopColor="#FFA500" />
      </linearGradient>
      <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFD700" />
        <stop offset="100%" stopColor="#fa7517" />
      </linearGradient>
      <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fa7517" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#FFD700" stopOpacity="0.8" />
      </linearGradient>
    </defs>
  </svg>
);

const CreatorPathSVG = () => (
  <div className="flex justify-center items-center gap-8">
    {/* Upload */}
    <motion.div
      initial={{ scale: 0, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center"
    >
      <div className="w-20 h-20 bg-[#fa7517]/20 rounded-full flex items-center justify-center mb-2 border-2 border-[#fa7517]/30">
        <Upload className="w-10 h-10 text-[#fa7517]" />
      </div>
      <p className="text-sm text-gray-400">Upload</p>
    </motion.div>

    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      <ArrowRight className="w-6 h-6 text-[#fa7517]" />
    </motion.div>

    {/* Price */}
    <motion.div
      initial={{ scale: 0, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="text-center"
    >
      <div className="w-20 h-20 bg-[#fa7517]/20 rounded-full flex items-center justify-center mb-2 border-2 border-[#fa7517]/30">
        <DollarSign className="w-10 h-10 text-[#fa7517]" />
      </div>
      <p className="text-sm text-gray-400">Price</p>
    </motion.div>

    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3, delay: 0.5 }}
    >
      <ArrowRight className="w-6 h-6 text-[#fa7517]" />
    </motion.div>

    {/* Profit */}
    <motion.div
      initial={{ scale: 0, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="text-center"
    >
      <div className="w-20 h-20 bg-[#fa7517]/20 rounded-full flex items-center justify-center mb-2 border-2 border-[#fa7517]/30">
        <TrendingUp className="w-10 h-10 text-[#fa7517]" />
      </div>
      <p className="text-sm text-gray-400">Profit</p>
    </motion.div>

    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3, delay: 0.7 }}
    >
      <ArrowRight className="w-6 h-6 text-[#fa7517]" />
    </motion.div>

    {/* Forever */}
    <motion.div
      initial={{ scale: 0, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="text-center"
    >
      <motion.div 
        className="w-20 h-20 bg-[#fa7517]/20 rounded-full flex items-center justify-center mb-2 border-2 border-[#fa7517]/30"
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      >
        <RefreshCw className="w-10 h-10 text-[#fa7517]" />
      </motion.div>
      <p className="text-sm text-gray-400">Forever</p>
    </motion.div>
  </div>
);

const CollectorPathSVG = () => (
  <div className="flex justify-center items-center gap-8">
    {/* Pass */}
    <motion.div
      initial={{ scale: 0, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center"
    >
      <div className="w-20 h-20 bg-[#fa7517]/20 rounded-full flex items-center justify-center mb-2 border-2 border-[#fa7517]/30">
        <Ticket className="w-10 h-10 text-[#fa7517]" />
      </div>
      <p className="text-sm text-gray-400">Pass</p>
    </motion.div>

    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      <ArrowRight className="w-6 h-6 text-[#fa7517]" />
    </motion.div>

    {/* Watch */}
    <motion.div
      initial={{ scale: 0, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="text-center"
    >
      <div className="w-20 h-20 bg-[#fa7517]/20 rounded-full flex items-center justify-center mb-2 border-2 border-[#fa7517]/30">
        <Play className="w-10 h-10 text-[#fa7517]" />
      </div>
      <p className="text-sm text-gray-400">Watch</p>
    </motion.div>

    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3, delay: 0.5 }}
    >
      <ArrowRight className="w-6 h-6 text-[#fa7517]" />
    </motion.div>

    {/* Resell */}
    <motion.div
      initial={{ scale: 0, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="text-center"
    >
      <motion.div 
        className="w-20 h-20 bg-[#fa7517]/20 rounded-full flex items-center justify-center mb-2 border-2 border-[#fa7517]/30"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Coins className="w-10 h-10 text-[#fa7517]" />
      </motion.div>
      <p className="text-sm text-gray-400">Resell</p>
    </motion.div>
  </div>
);

export const OnboardingModalUI: React.FC<OnboardingModalUIProps> = ({
  currentScreen,
  userPath,
  onSelectPath,
  onNext,
  onBack,
  onComplete
}) => {
  const renderScreen = () => {
    switch (currentScreen) {
      case 0:
        // Screen 1: Welcome
        return (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center space-y-8 p-12"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
                filter: ["blur(0px)", "blur(2px)", "blur(0px)"]
              }}
              transition={{ duration: 4, repeat: Infinity }}
              className="inline-block relative"
            >
              <RevolutionSVG />
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  className="w-32 h-32 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, rgba(250,117,23,0.4) 0%, rgba(250,117,23,0) 70%)',
                    filter: 'blur(40px)',
                  }}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.6, 0.3, 0.6],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              </div>
            </motion.div>
            
            <div className="space-y-4">
              <motion.h2 
                className="text-5xl font-bold"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#fa7517] via-[#FFA500] to-[#FFD700]">
                  Welcome to the Revolution
                </span>
              </motion.h2>
              <motion.p 
                className="text-gray-400 text-xl max-w-md mx-auto"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                You're one of the first 500 to experience the platform that changes everything.
              </motion.p>
            </div>
          </motion.div>
        );

      case 1:
        // Screen 2: The Choice
        return (
          <motion.div
            key="choice"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-12 space-y-8"
          >
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold text-white">
                Are You a Creator or a Collector?
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.button
                onClick={() => onSelectPath('creator')}
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className={`relative p-8 rounded-2xl transition-all duration-300 overflow-hidden ${
                  userPath === 'creator'
                    ? 'bg-black/50'
                    : 'bg-black/30 hover:bg-black/40'
                }`}
                style={{
                  border: userPath === 'creator' ? '2px solid transparent' : '2px solid rgba(250,117,23,0.2)',
                  borderImage: userPath === 'creator' ? 'linear-gradient(135deg, #fa7517, #FFA500) 1' : 'none',
                  boxShadow: userPath === 'creator' 
                    ? '0 0 30px rgba(250,117,23,0.4), inset 0 0 30px rgba(250,117,23,0.1)'
                    : '0 0 20px rgba(0,0,0,0.5)'
                }}
              >
                {userPath === 'creator' && (
                  <motion.div
                    className="absolute inset-0 opacity-30"
                    initial={{ backgroundPosition: '0% 0%' }}
                    animate={{ backgroundPosition: '100% 100%' }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    style={{
                      background: 'linear-gradient(45deg, transparent 30%, rgba(250,117,23,0.1) 50%, transparent 70%)',
                      backgroundSize: '200% 200%',
                    }}
                  />
                )}
                <div className="relative z-10">
                  <div className="mb-4 flex justify-center">
                    <Video className="w-16 h-16 text-[#fa7517]" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-2 text-white">Creator</h3>
                  <p className="text-gray-400">I make content</p>
                </div>
              </motion.button>

              <motion.button
                onClick={() => onSelectPath('collector')}
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className={`relative p-8 rounded-2xl transition-all duration-300 overflow-hidden ${
                  userPath === 'collector'
                    ? 'bg-black/50'
                    : 'bg-black/30 hover:bg-black/40'
                }`}
                style={{
                  border: userPath === 'collector' ? '2px solid transparent' : '2px solid rgba(250,117,23,0.2)',
                  borderImage: userPath === 'collector' ? 'linear-gradient(135deg, #fa7517, #FFA500) 1' : 'none',
                  boxShadow: userPath === 'collector' 
                    ? '0 0 30px rgba(250,117,23,0.4), inset 0 0 30px rgba(250,117,23,0.1)'
                    : '0 0 20px rgba(0,0,0,0.5)'
                }}
              >
                {userPath === 'collector' && (
                  <motion.div
                    className="absolute inset-0 opacity-30"
                    initial={{ backgroundPosition: '0% 0%' }}
                    animate={{ backgroundPosition: '100% 100%' }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    style={{
                      background: 'linear-gradient(45deg, transparent 30%, rgba(250,117,23,0.1) 50%, transparent 70%)',
                      backgroundSize: '200% 200%',
                    }}
                  />
                )}
                <div className="relative z-10">
                  <div className="mb-4 flex justify-center">
                    <Eye className="w-16 h-16 text-[#fa7517]" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-2 text-white">Collector</h3>
                  <p className="text-gray-400">I watch content</p>
                </div>
              </motion.button>
            </div>
          </motion.div>
        );

      case 2:
        // Screen 3A/3B: Path-specific content
        return userPath === 'creator' ? (
          <motion.div
            key="creator-path"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-12 space-y-8"
          >
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#fa7517] to-[#FFA500]">
                Your Content Becomes Currency
              </h2>
              <p className="text-gray-400 text-xl max-w-2xl mx-auto">
                Upload. Price. Profit. Your fans buy passes to access your content. When they resell, you earn again. Forever.
              </p>
            </div>

            <div className="py-8">
              <CreatorPathSVG />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="collector-path"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-12 space-y-8"
          >
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#fa7517] to-[#FFA500]">
                Own What You Watch
              </h2>
              <p className="text-gray-400 text-xl max-w-2xl mx-auto">
                Buy Content Passes from your favorite creators. Watch forever. Sell when you want. Your entertainment finally has value.
              </p>
            </div>

            <div className="py-8">
              <CollectorPathSVG />
            </div>
          </motion.div>
        );

      case 3:
        // Screen 4: Beta Benefits
        return (
          <motion.div
            key="benefits"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="p-12 space-y-8"
          >
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FFD700] via-[#fa7517] to-[#FFA500]">
                  You're Not Just Early. You're First.
                </span>
              </h2>
            </div>

            <div className="space-y-4 max-w-2xl mx-auto">
              {[
                { text: "Genesis Pass holder (access all content)", delay: 0.2 },
                { text: "Shape features with direct founder access", delay: 0.4 },
                { text: "Lock in 90% creator revenue forever", delay: 0.6 }
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: benefit.delay }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-black/30 border border-gray-800/30"
                  style={{
                    boxShadow: '0 0 20px rgba(250,117,23,0.1)'
                  }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: benefit.delay + 0.2, type: "spring" }}
                    className="w-6 h-6 rounded-full bg-gradient-to-r from-[#fa7517] to-[#FFA500] flex items-center justify-center flex-shrink-0 mt-0.5"
                  >
                    <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                      <path d="M1 5L5 9L13 1" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </motion.div>
                  <p className="text-gray-300 text-lg">{benefit.text}</p>
                </motion.div>
              ))}
            </div>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center text-gray-500 text-sm"
            >
              Some features still brewing. Your feedback makes them better.
            </motion.p>
          </motion.div>
        );

      case 4:
        // Screen 5: The Promise - Mind-blowing version
        return (
          <motion.div
            key="promise"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-12 space-y-8 relative overflow-hidden"
          >
            {/* Animated background particles */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-[#fa7517] rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: [-20, -100],
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeOut",
                  }}
                />
              ))}
            </div>

            <div className="text-center space-y-8 relative z-10">
              {/* Animated centerpiece */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.8, type: "spring" }}
                className="inline-block relative"
              >
                {/* Main circle with pulsing glow */}
                <motion.div
                  className="w-32 h-32 rounded-full relative"
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(250,117,23,0.5), 0 0 40px rgba(250,117,23,0.3), 0 0 60px rgba(250,117,23,0.1)',
                      '0 0 40px rgba(250,117,23,0.8), 0 0 80px rgba(250,117,23,0.5), 0 0 120px rgba(250,117,23,0.3)',
                      '0 0 20px rgba(250,117,23,0.5), 0 0 40px rgba(250,117,23,0.3), 0 0 60px rgba(250,117,23,0.1)',
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-[#fa7517] to-[#FFD700] p-[2px]">
                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                      {/* Custom SVG icon */}
                      <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                        <motion.path
                          d="M30 5 L35 20 L50 20 L38 30 L43 45 L30 35 L17 45 L22 30 L10 20 L25 20 Z"
                          fill="url(#starGradient)"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ duration: 1, delay: 0.5, type: "spring" }}
                        />
                        <motion.circle
                          cx="30"
                          cy="30"
                          r="25"
                          stroke="url(#circleGradient)"
                          strokeWidth="2"
                          fill="none"
                          strokeDasharray="4 6"
                          initial={{ strokeDashoffset: 0 }}
                          animate={{ strokeDashoffset: -157 }}
                          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        />
                        <defs>
                          <linearGradient id="starGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#FFD700" />
                            <stop offset="100%" stopColor="#fa7517" />
                          </linearGradient>
                          <linearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#fa7517" stopOpacity="0.5" />
                            <stop offset="50%" stopColor="#FFD700" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#fa7517" stopOpacity="0.5" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  </div>
                </motion.div>

                {/* Orbiting elements */}
                <motion.div
                  className="absolute inset-0"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 w-2 h-2 bg-[#FFD700] rounded-full" />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-4 w-2 h-2 bg-[#fa7517] rounded-full" />
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-2 h-2 bg-[#FFA500] rounded-full" />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-2 h-2 bg-[#FFD700] rounded-full" />
                </motion.div>
              </motion.div>
              
              <div className="space-y-4">
                <motion.h2 
                  className="text-5xl font-bold text-white"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  One Last Thing...
                </motion.h2>
                
                <div className="space-y-2">
                  <motion.p 
                    className="text-gray-400 text-xl max-w-2xl mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    The old platforms made{" "}
                    <motion.span
                      className="text-gray-300 font-semibold"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8, type: "spring" }}
                    >
                      billions
                    </motion.span>{" "}
                    from creators.
                  </motion.p>
                  
                  <motion.p 
                    className="text-gray-400 text-xl max-w-2xl mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    We're building the{" "}
                    <motion.span
                      className="text-white font-semibold"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1, type: "spring" }}
                    >
                      first one
                    </motion.span>{" "}
                    that{" "}
                    <motion.span
                      className="bg-gradient-to-r from-[#fa7517] to-[#FFD700] bg-clip-text text-transparent font-bold"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.2, type: "spring" }}
                    >
                      pays them.
                    </motion.span>
                  </motion.p>
                </div>
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.4 }}
                  className="relative inline-block"
                >
                  <motion.p 
                    className="text-2xl font-bold bg-gradient-to-r from-[#fa7517] via-[#FFA500] to-[#FFD700] bg-clip-text text-transparent"
                    animate={{
                      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                    }}
                    transition={{ duration: 5, repeat: Infinity }}
                    style={{ 
                      backgroundSize: '200% 200%',
                    }}
                  >
                    Welcome to the right side of history.
                  </motion.p>
                  
                  {/* Underline effect */}
                  <motion.div
                    className="absolute -bottom-2 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#fa7517] to-transparent"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 1.8, duration: 0.8 }}
                  />
                </motion.div>
              </div>
            </div>

            {/* Bottom glow effect */}
            <motion.div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-32 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              transition={{ delay: 2 }}
              style={{
                background: 'radial-gradient(ellipse at center, rgba(250,117,23,0.5) 0%, transparent 70%)',
                filter: 'blur(40px)',
              }}
            />
          </motion.div>
        );

      default:
        return null;
    }
  };

  const getButtonText = () => {
    switch (currentScreen) {
      case 0: return "I'm Ready";
      case 1: return userPath ? "Continue" : "Select One";
      case 2: return userPath === 'creator' ? "Show Me How" : "I Want This";
      case 3: return "Claim My Genesis Pass";
      case 4: return "Let's Begin";
      default: return "Next";
    }
  };

  const canProceed = () => {
    if (currentScreen === 1 && !userPath) return false;
    return true;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-black/80 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-gray-800/30 relative"
          style={{
            boxShadow: `
              0 0 50px 10px rgba(250, 117, 23, 0.15),
              0 0 100px 20px rgba(250, 117, 23, 0.1),
              inset 0 0 120px 30px rgba(250, 117, 23, 0.05)
            `,
          }}
        >
          {/* Ambient glow effect */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#fa7517] opacity-10 blur-[100px] rounded-full" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#FFD700] opacity-10 blur-[100px] rounded-full" />
          </div>

          {/* Content */}
          <div className="relative min-h-[500px]">
            <AnimatePresence mode="wait">
              {renderScreen()}
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="p-8 bg-black/50 backdrop-blur-sm border-t border-gray-800/30 flex items-center justify-between relative">
            <div className="flex gap-2">
              {[...Array(5)].map((_, index) => (
                <motion.div
                  key={index}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    currentScreen === index 
                      ? 'w-12 bg-gradient-to-r from-[#fa7517] to-[#FFA500]' 
                      : 'w-1 bg-gray-700'
                  }`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                />
              ))}
            </div>

            <div className="flex gap-4">
              {currentScreen > 0 && (
                <motion.button
                  onClick={onBack}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </motion.button>
              )}
              
              <motion.button
                onClick={currentScreen === 4 ? onComplete : onNext}
                disabled={!canProceed()}
                whileHover={canProceed() ? { scale: 1.05 } : {}}
                whileTap={canProceed() ? { scale: 0.95 } : {}}
                className={`relative px-8 py-3 flex items-center gap-2 rounded-xl transition-all duration-300 font-semibold overflow-hidden ${
                  canProceed()
                    ? 'text-black'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
                style={canProceed() ? {
                  background: 'linear-gradient(135deg, #fa7517, #FFA500)',
                  boxShadow: '0 4px 20px rgba(250, 117, 23, 0.4)',
                } : {}}
              >
                {canProceed() && (
                  <motion.div
                    className="absolute inset-0"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    }}
                  />
                )}
                <span className="relative">{getButtonText()}</span>
                <ArrowRight className="w-4 h-4 relative" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}; 