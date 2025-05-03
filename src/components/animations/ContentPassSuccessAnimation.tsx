import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Sparkles, DollarSign, Star, Rocket, Check, Zap, Award } from 'lucide-react';

interface ContentPassSuccessAnimationProps {
  onComplete: () => void;
  passTitle?: string;
  passPrice?: string;
}

const ContentPassSuccessAnimation: React.FC<ContentPassSuccessAnimationProps> = ({ 
  onComplete, 
  passTitle = "Premium Content Pass", 
  passPrice = "$15.00" 
}) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Progress through animation stages
    const stageTimers = [
      setTimeout(() => setStage(1), 800),
      setTimeout(() => setStage(2), 1700),
      setTimeout(() => setStage(3), 3500),
      setTimeout(() => onComplete(), 5500)
    ];

    return () => stageTimers.forEach(timer => clearTimeout(timer));
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden perspective-1000"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Background gradient animation */}
        <motion.div 
          className="absolute inset-0 bg-gradient-radial from-[#fa7517]/20 via-black to-black"
          animate={{ 
            opacity: [0, 0.3, 0.8, 1],
            scale: [0.5, 1.2, 1]
          }}
          transition={{ duration: 2.5 }}
        />
        
        {/* Warp speed lines effect */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={`warp-${i}`}
              className="absolute w-[2px] h-[100px] bg-gradient-to-b from-transparent via-[#fa7517]/40 to-transparent"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
              animate={{
                scaleY: [0, 15, 0],
                opacity: [0, 0.4, 0],
                y: [0, 1000]
              }}
              transition={{
                duration: 2,
                delay: Math.random() * 1.5,
                repeat: 1,
                repeatType: "loop"
              }}
            />
          ))}
        </div>

        {/* Main animation container - improved vertical spacing */}
        <motion.div 
          className="relative w-full max-w-2xl flex flex-col items-center justify-center z-10 px-4"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Success check mark - Stage 0 */}
          {stage === 0 && (
            <motion.div
              className="relative mb-8"
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring",
                damping: 10,
                stiffness: 100,
              }}
            >
              <motion.div
                className="w-28 h-28 rounded-full bg-gradient-to-br from-[#14b881] to-[#0c875e] flex items-center justify-center"
                animate={{
                  boxShadow: ["0 0 25px rgba(20, 184, 129, 0.3)", "0 0 50px rgba(20, 184, 129, 0.6)", "0 0 25px rgba(20, 184, 129, 0.3)"],
                }}
                transition={{
                  boxShadow: { duration: 1.2, repeat: 1, repeatType: "reverse" },
                }}
              >
                <Check className="w-16 h-16 text-white" strokeWidth={3} />
              </motion.div>
            </motion.div>
          )}

          {/* Crown animation with better spacing */}
          <div className={`flex flex-col items-center justify-center h-[50vh] min-h-[400px] ${stage >= 2 ? "pb-32" : ""}`}>
            {/* Explosion stage - Stage 1 */}
            {stage >= 1 && (
              <motion.div 
                className="relative"
                initial={{ opacity: stage === 1 ? 0 : 1, scale: stage === 1 ? 0.5 : 1 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                {/* Central crown exploding out */}
                <motion.div 
                  className="relative flex items-center justify-center"
                  animate={stage === 1 ? { rotate: 360 } : {}}
                  transition={{ duration: stage === 1 ? 15 : 0, ease: "linear" }}
                >
                  <motion.div
                    className="w-32 h-32 flex items-center justify-center"
                    animate={stage === 1 ? {
                      scale: [1, 1.8, 1],
                      rotateY: [0, 360],
                      rotateX: [0, 20, 0, -20, 0],
                    } : {}}
                    transition={{ duration: 2.5, ease: "easeInOut" }}
                  >
                    <div className="relative">
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-br from-[#FFD700] to-[#fa7517] rounded-full opacity-60 blur-md"
                        initial={{ scale: 0.7 }}
                        animate={{ scale: [0.7, 1.5, 0.9], opacity: [0.6, 0.8, 0.6] }}
                        transition={{ 
                          duration: 3, 
                          repeat: Infinity, 
                          repeatType: "reverse" 
                        }}
                      />
                      <motion.div
                        className="relative w-32 h-32 rounded-full bg-gradient-to-br from-[#fa7517] to-[#ff8c3a] flex items-center justify-center z-10"
                        animate={{
                          boxShadow: ["0 0 30px rgba(250, 117, 23, 0.4)", "0 0 60px rgba(250, 117, 23, 0.7)", "0 0 30px rgba(250, 117, 23, 0.4)"],
                        }}
                        transition={{
                          boxShadow: { duration: 2, repeat: Infinity, repeatType: "reverse" },
                        }}
                      >
                        <Crown className="w-16 h-16 text-white drop-shadow-lg" strokeWidth={1.5} />
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Orbiting elements - adjusted positioning radius */}
                  {stage >= 1 && [DollarSign, Star, Award, Zap].map((Icon, index) => (
                    <motion.div
                      key={index}
                      className="absolute w-14 h-14 rounded-full flex items-center justify-center"
                      style={{
                        background: "radial-gradient(circle, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.9) 100%)",
                        boxShadow: "0 0 15px rgba(250, 117, 23, 0.3)",
                        border: "2px solid rgba(250, 117, 23, 0.6)"
                      }}
                      initial={{ 
                        x: 0, 
                        y: 0, 
                        opacity: 0,
                        scale: 0.5
                      }}
                      animate={{ 
                        x: Math.cos((index * Math.PI * 2) / 4) * 140,
                        y: Math.sin((index * Math.PI * 2) / 4) * 140,
                        opacity: 1,
                        scale: 1,
                        rotate: 360 
                      }}
                      transition={{
                        x: { duration: 0.8, delay: 0.1 * index },
                        y: { duration: 0.8, delay: 0.1 * index },
                        opacity: { duration: 0.4, delay: 0.1 * index },
                        scale: { duration: 0.4, delay: 0.1 * index },
                        rotate: { duration: 8, repeat: Infinity, ease: "linear" }
                      }}
                    >
                      <Icon className="w-7 h-7 text-[#fa7517]" />
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )}

            {/* Success text animation - Stage 2+ - with better positioning */}
            {stage >= 2 && (
              <motion.div 
                className={`text-center ${stage >= 3 ? "mt-0" : "mt-64"}`}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.6,
                  staggerChildren: 0.1
                }}
              >
                <motion.h2
                  className="text-4xl md:text-5xl font-bold mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#fa7517] to-[#FFD700]">
                    Success!
                  </span>
                </motion.h2>
                
                <motion.div
                  className="text-xl md:text-2xl text-white mb-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Your Pass is Now Live
                </motion.div>
                
                <motion.div
                  className="mt-4 py-3 px-6 rounded-lg bg-black/40 border border-[#fa7517]/30 inline-block mx-auto mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="text-gray-300 text-lg">{passTitle}</div>
                  <div className="text-[#fa7517] font-bold text-2xl mt-1">{passPrice}</div>
                </motion.div>
              </motion.div>
            )}
          </div>

          {/* Final celebratory confetti - Stage 3 - adjusted for better visibility */}
          {stage >= 3 && (
            <>
              {/* Floating dollar signs */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={`dollar-${i}`}
                  className="absolute text-[#fa7517] font-bold flex items-center justify-center"
                  style={{
                    top: `${10 + Math.random() * 80}%`,
                    left: `${10 + Math.random() * 80}%`,
                    fontSize: `${Math.random() * 16 + 14}px`,
                    opacity: 0.8,
                    zIndex: 5,
                  }}
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ 
                    y: [100, -100],
                    x: [0, (Math.random() - 0.5) * 100],
                    opacity: [0, 1, 0],
                    rotate: [0, (Math.random() - 0.5) * 120],
                  }}
                  transition={{ 
                    duration: 4,
                    delay: Math.random() * 1,
                    ease: "easeOut"
                  }}
                >
                  <DollarSign className="w-5 h-5" />
                </motion.div>
              ))}

              {/* Celebratory circle bursts */}
              {[...Array(12)].map((_, i) => (
                <motion.div 
                  key={`burst-${i}`}
                  className="absolute rounded-full"
                  style={{
                    background: `radial-gradient(circle, rgb(250, 117, 23, ${Math.random() * 0.2 + 0.3}) 0%, rgba(250, 117, 23, 0) 70%)`,
                    top: '50%',
                    left: '50%',
                  }}
                  animate={{
                    width: ['0px', '300px'],
                    height: ['0px', '300px'],
                    x: ['-50%', '-50%'],
                    y: ['-50%', '-50%'],
                    opacity: [0, 0.7, 0],
                  }}
                  transition={{
                    duration: 1.2,
                    delay: 0.1 * i,
                    ease: "easeOut",
                  }}
                />
              ))}

              {/* Radial light streaks */}
              {[...Array(16)].map((_, i) => {
                const angle = (i / 16) * 360;
                const distance = 500;
                const x = Math.cos((angle * Math.PI) / 180) * distance;
                const y = Math.sin((angle * Math.PI) / 180) * distance;
                
                return (
                  <motion.div
                    key={`streak-${i}`}
                    className="absolute h-[1px] bg-gradient-to-r from-[#fa7517] to-transparent"
                    style={{
                      top: '50%',
                      left: '50%',
                      transformOrigin: '0 0',
                      transform: `rotate(${angle}deg)`,
                      width: '0px',
                    }}
                    animate={{
                      width: ['0px', `${distance}px`],
                      opacity: [0, 0.7, 0],
                    }}
                    transition={{
                      duration: 1.2,
                      delay: 0.5 + (i * 0.02),
                      ease: "easeOut",
                    }}
                  />
                );
              })}
            </>
          )}

          {/* Continue button - Stage 3 - fixed positioning at bottom */}
          {stage >= 3 && (
            <motion.button
              className="py-2.5 px-6 bg-gradient-to-r from-[#fa7517] to-[#ff8c3a] text-black rounded-lg font-semibold mt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              onClick={onComplete}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Continue
            </motion.button>
          )}

          {/* Spark particles with better distribution */}
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={`spark-${i}`}
              className="absolute w-1 h-1 rounded-full bg-[#FFD700]"
              style={{
                top: '50%',
                left: '50%',
                zIndex: 1,
              }}
              animate={{
                x: [0, (Math.random() - 0.5) * 500],
                y: [0, (Math.random() - 0.5) * 500],
                scale: [0, 1, 0],
                opacity: [0, 0.7, 0],
              }}
              transition={{
                duration: 2,
                delay: Math.random() * 3,
                repeat: Infinity,
                repeatDelay: Math.random() * 2 + 1,
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ContentPassSuccessAnimation; 