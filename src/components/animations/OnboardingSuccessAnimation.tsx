import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Rocket, Sparkles, Shield } from 'lucide-react';

interface OnboardingSuccessAnimationProps {
  onComplete: () => void;
}

const OnboardingSuccessAnimation: React.FC<OnboardingSuccessAnimationProps> = ({ onComplete }) => {
  useEffect(() => {
    // Wait for animation duration then call onComplete
    const timer = setTimeout(() => {
      onComplete();
    }, 3000); // Match this with your animation duration

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="relative w-full h-full"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        {/* Central animated icon */}
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ duration: 1.5, times: [0, 0.6, 1] }}
        >
          {/* Three rotating circles with icons */}
          <div className="relative">
            {/* Main center circle */}
            <motion.div
              className="w-40 h-40 bg-gradient-to-r from-[#fa7517] to-[#ff8c3a] rounded-full flex items-center justify-center"
              animate={{
                rotate: 360,
                boxShadow: [
                  "0 0 25px rgba(250, 117, 23, 0.3)",
                  "0 0 50px rgba(250, 117, 23, 0.6)",
                  "0 0 25px rgba(250, 117, 23, 0.3)",
                ],
              }}
              transition={{
                rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                boxShadow: { duration: 2, repeat: Infinity, repeatType: "reverse" },
              }}
            >
              <Rocket className="w-16 h-16 text-black" />
            </motion.div>

            {/* Orbiting icons */}
            {[Sparkles, Shield].map((Icon, index) => (
              <motion.div
                key={index}
                className="absolute w-20 h-20 bg-black rounded-full flex items-center justify-center border-2 border-[#fa7517]"
                style={{
                  left: "50%",
                  top: "50%",
                }}
                animate={{
                  x: Math.cos((index * Math.PI * 2) / 2 + Math.PI / 4) * 80,
                  y: Math.sin((index * Math.PI * 2) / 2 + Math.PI / 4) * 80,
                  rotate: 360,
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  repeatType: "loop",
                  ease: "linear",
                  delay: index * 0.5,
                }}
              >
                <Icon className="w-8 h-8 text-[#fa7517]" />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Welcome text */}
        <motion.div
          className="absolute top-2/3 left-1/2 transform -translate-x-1/2 text-center"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          <motion.h2
            className="text-5xl font-bold bg-gradient-to-r from-[#fa7517] to-[#ff8c3a] text-transparent bg-clip-text mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.7, duration: 0.5 }}
          >
            Welcome to Base.Tube!
          </motion.h2>
          <motion.p
            className="text-white text-2xl mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.9, duration: 0.5 }}
          >
            Your Web3 journey begins now
          </motion.p>
        </motion.div>

        {/* Animated particles */}
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-[#fa7517] rounded-full"
            initial={{
              x: "50%",
              y: "50%",
              opacity: 0,
            }}
            animate={{
              x: `${Math.random() * 100}%`,
              y: `${Math.random() * 100}%`,
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3,
              delay: 2 + Math.random() * 0.5,
              repeat: Infinity,
              repeatType: "loop",
            }}
          />
        ))}

        {/* Multiple pulsating rings */}
        {[64, 80, 96].map((size, i) => (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-4 border-[#fa7517] rounded-full"
            style={{ width: size, height: size }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{
              scale: [0, 1.5, 2],
              opacity: [1, 0.5, 0],
            }}
            transition={{
              duration: 3,
              delay: i * 0.2,
              repeat: Infinity,
              repeatType: "loop",
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
};

export default OnboardingSuccessAnimation; 