import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Trophy, ChevronDown } from 'lucide-react';
import { ScrollPrompt, AnimatedParticles, PulsatingRings } from './styles';

interface RankAchievementAnimationProps {
  rank: string;
  points: number;
  isFirstRank: boolean;
  onAnimationComplete: () => void;
}

const RankAchievementAnimation: React.FC<RankAchievementAnimationProps> = ({ 
  rank, 
  points,
  isFirstRank,
  onAnimationComplete
}) => {
  const [animationPhase, setAnimationPhase] = useState<'initial' | 'complete'>('initial');
  const count = useMotionValue(0);
  const rounded = useTransform(count, latest => Math.round(latest));

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationPhase('complete');
      onAnimationComplete();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  useEffect(() => {
    const controls = animate(count, points, {
      duration: 2,
      delay: 1.8, // Start after trophy animation
      ease: "easeOut",
    });

    return controls.stop;
  }, [points, count]);

  return (
    <>
      <motion.div
        className="relative z-50 flex items-center justify-center min-h-screen"
        animate={{
          height: animationPhase === 'complete' ? '70vh' : '100vh',
        }}
        transition={{ duration: 1, ease: "easeInOut" }}
      >
        <motion.div
          className="relative w-full flex flex-col items-center justify-center"
          initial={{ scale: 0.8 }}
          animate={{ 
            scale: 1,
            y: animationPhase === 'complete' ? -50 : 0 
          }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          {/* Trophy Animation */}
          <motion.div
            className="relative mb-8"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ duration: 1.5, times: [0, 0.6, 1] }}
          >
            <motion.div
              className="w-40 h-40 bg-[#fa7517] rounded-full flex items-center justify-center"
              animate={{
                borderRadius: ["50%", "20%"],
              }}
              transition={{ duration: 1, delay: 1 }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1.2 }}
              >
                <Trophy className="w-20 h-20 text-black" />
              </motion.div>
            </motion.div>
            <PulsatingRings />
          </motion.div>

          {/* Welcome Messages */}
          <motion.div
            className="text-center space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
          >
            <motion.h1 
              className="text-5xl font-bold bg-gradient-to-r from-[#fa7517] to-[#ff8c3a] 
                text-transparent bg-clip-text"
            >
              {isFirstRank ? "Congratulations!" : "New Rank Achieved!"}
            </motion.h1>
            
            <motion.div className="space-y-4">
              <p className="text-2xl text-gray-300">
                You've reached {rank} Status
              </p>
              <div className="relative">
                <motion.div 
                  className="text-7xl font-bold text-[#fa7517]"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 1.8, duration: 0.5 }}
                >
                  <motion.span>{rounded}</motion.span>
                  <div className="text-2xl text-white mt-2">
                    Total Points
                  </div>
                </motion.div>
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ scale: 1.5, opacity: 0 }}
                  animate={{ scale: [1.5, 2], opacity: [0.5, 0] }}
                  transition={{
                    delay: 1.8,
                    duration: 0.8,
                    ease: "easeOut"
                  }}
                >
                  <div className="text-7xl font-bold text-[#fa7517]">{points}</div>
                </motion.div>
              </div>
              <p className="text-2xl text-gray-300">
                Thanks for being a part of the Base.Tube community!
              </p>
            </motion.div>
          </motion.div>

          <AnimatedParticles />
        </motion.div>
      </motion.div>

      {/* Separated ScrollPrompt to maintain fixed position */}
      <ScrollPrompt>
        <motion.div
          animate={{
            opacity: animationPhase === 'complete' ? 1 : 0.7,
          }}
          transition={{ duration: 0.5 }}
        >
          <ChevronDown className="w-8 h-8 text-[#fa7517] animate-bounce" />
          <span className="text-gray-400">Scroll to explore the ranks</span>
        </motion.div>
      </ScrollPrompt>
    </>
  );
};

export default RankAchievementAnimation;