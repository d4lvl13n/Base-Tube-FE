import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Sparkles, Lock } from 'lucide-react';

interface ContentPassAnimationProps {
  onComplete: () => void;
}

const ContentPassAnimation: React.FC<ContentPassAnimationProps> = ({ onComplete }) => {
  useEffect(() => {
    // Shorter animation duration
    const timer = setTimeout(() => {
      onComplete();
    }, 1800); // 1.8 seconds total

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="relative w-full max-w-lg h-64 flex flex-col items-center justify-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Main animated icon */}
          <motion.div 
            className="relative mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
            transition={{ 
              scale: { duration: 0.5, ease: "backOut" },
              rotate: { duration: 0.6, times: [0, 0.3, 0.6, 1], delay: 0.4 }
            }}
          >
            <motion.div
              className="w-24 h-24 rounded-full bg-gradient-to-br from-[#fa7517] to-[#ff8c3a] flex items-center justify-center"
              animate={{
                boxShadow: ["0 0 15px rgba(250, 117, 23, 0.3)", "0 0 30px rgba(250, 117, 23, 0.6)", "0 0 15px rgba(250, 117, 23, 0.3)"],
              }}
              transition={{
                boxShadow: { duration: 1.5, repeat: 1, repeatType: "reverse" },
              }}
            >
              <Crown className="w-12 h-12 text-black" />
            </motion.div>
            
            {/* Orbiting mini icons */}
            {[Lock, Sparkles].map((Icon, index) => (
              <motion.div
                key={index}
                className="absolute w-10 h-10 rounded-full bg-black border border-[#fa7517]/50 flex items-center justify-center"
                initial={{ 
                  x: 0, 
                  y: 0, 
                  opacity: 0 
                }}
                animate={{ 
                  x: Math.cos((index * Math.PI * 2) / 2 + Math.PI / 4) * 40,
                  y: Math.sin((index * Math.PI * 2) / 2 + Math.PI / 4) * 40,
                  opacity: 1,
                  rotate: 360 
                }}
                transition={{
                  x: { duration: 0.5, delay: 0.3 },
                  y: { duration: 0.5, delay: 0.3 },
                  opacity: { duration: 0.3, delay: 0.3 },
                  rotate: { duration: 1.5, repeat: 1, ease: "linear" }
                }}
              >
                <Icon className="w-5 h-5 text-[#fa7517]" />
              </motion.div>
            ))}
          </motion.div>

          {/* Text animation */}
          <motion.h2
            className="text-2xl font-bold text-white mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            Creating your <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#fa7517] to-[#ff8c3a]">Content Pass</span>
          </motion.h2>
          
          <motion.p
            className="text-gray-300 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.4 }}
          >
            Get ready to unlock new revenue streams
          </motion.p>

          {/* Particles */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 bg-[#fa7517] rounded-full"
              initial={{
                x: "50%",
                y: "50%",
                opacity: 0,
              }}
              animate={{
                x: `calc(50% + ${(Math.random() - 0.5) * 200}px)`,
                y: `calc(50% + ${(Math.random() - 0.5) * 200}px)`,
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 1.2,
                delay: 0.3 + Math.random() * 0.5,
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ContentPassAnimation; 