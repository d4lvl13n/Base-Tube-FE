import React from 'react';
import { motion, MotionValue, useTransform } from 'framer-motion';
import { Trophy, Star, Shield } from 'lucide-react';
import { UserPointsData } from '../../types/userPoints';

export const Container = React.forwardRef<HTMLDivElement, { children: React.ReactNode }>(
  ({ children }, ref) => (
    <div 
      ref={ref}
      className="flex-1 relative overflow-x-hidden"
      style={{ perspective: "1000px" }}
    >
      {children}
    </div>
  )
);

export const ParallaxWrapper: React.FC<{
  children: React.ReactNode;
  scrollProgress: MotionValue<number>;
  offset: number;
}> = ({ children, scrollProgress, offset }) => {
  const y = useTransform(
    scrollProgress,
    [0, 1],
    [offset, offset - 100]
  );

  return (
    <motion.div style={{ y }} className="relative z-10">
      {children}
    </motion.div>
  );
};

export const TimelineTrack: React.FC<{
  children: React.ReactNode;
  progress: MotionValue<number>;
}> = ({ children, progress }) => {
  const scaleY = useTransform(
    progress,
    [0, 0.8],
    [0, 1]
  );

  return (
    <div className="relative flex flex-col items-center">
      {/* Vertical timeline bar - positioned absolutely within the timeline section */}
      <motion.div
        className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 bg-gradient-to-b from-[#fa7517] to-[#ff8c3a]/30 z-0"
        style={{ 
          scaleY, 
          originY: 0,
          height: '100%'
        }}
      />
      {children}
    </div>
  );
};

export const TimelineNode: React.FC<{
  title: string;
  description: string;
  points: string;
  achieved: boolean;
  current?: boolean;
  children?: React.ReactNode;
  scrollProgress: MotionValue<number>;
  index: number;
}> = ({ title, description, points, achieved, current, children, scrollProgress, index }) => {
  const opacity = useTransform(
    scrollProgress,
    [(index * 0.2) - 0.1, index * 0.2, (index * 0.2) + 0.1],
    [0, 1, 1]
  );

  const scale = useTransform(
    scrollProgress,
    [(index * 0.2) - 0.1, index * 0.2, (index * 0.2) + 0.1],
    [0.8, 1, 1]
  );

  return (
    <motion.div
      style={{ opacity, scale }}
      className="relative min-h-screen flex items-center"
    >
      {/* This container helps position everything */}
      <div className="w-full max-w-7xl mx-auto grid grid-cols-[1fr,auto,1fr] gap-12">
        {/* Empty space on the left */}
        <div />

        {/* Timeline Node (stays centered) */}
        <div className="relative">
          <motion.div
            className={`
              w-16 h-16 rounded-full flex items-center justify-center
              ${achieved 
                ? 'bg-gradient-to-r from-[#fa7517] to-[#ff8c3a]' 
                : 'bg-gray-800'
              }
              ${current ? 'ring-4 ring-[#fa7517]/30' : ''}
            `}
            animate={current ? {
              boxShadow: [
                "0 0 20px rgba(250, 117, 23, 0.3)",
                "0 0 40px rgba(250, 117, 23, 0.6)",
                "0 0 20px rgba(250, 117, 23, 0.3)",
              ]
            } : undefined}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Trophy className={`w-8 h-8 ${achieved ? 'text-white' : 'text-gray-500'}`} />
          </motion.div>
        </div>

        {/* Content Card (always on the right) */}
        <div className="max-w-xl">
          <motion.div 
            className={`
              p-6 rounded-xl backdrop-blur-sm
              ${current 
                ? 'bg-black/50 border border-[#fa7517]/30' 
                : achieved 
                  ? 'bg-black/30' 
                  : 'bg-black/20'
              }
            `}
            whileHover={achieved ? { scale: 1.02 } : undefined}
          >
            <h3 className={`text-2xl font-bold mb-2 
              ${achieved ? 'text-white' : 'text-gray-500'}`}
            >
              {title}
            </h3>
            <p className={`${achieved ? 'text-[#fa7517]' : 'text-gray-500'} mb-3`}>
              {points}
            </p>
            <p className={`text-sm ${achieved ? 'text-gray-300' : 'text-gray-600'}`}>
              {description}
            </p>

            {/* Stats Panel and Mint Button for current rank */}
            {children && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-6 pt-6 border-t border-[#fa7517]/20"
              >
                {children}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export const StatsPanel: React.FC<{ pointsData: UserPointsData }> = ({ pointsData }) => (
  <div className="grid grid-cols-2 gap-4">
    {[
      { label: "Total Points", value: pointsData.totalPoints, icon: Star },
      { label: "Video Points", value: pointsData.videoUploadPoints, icon: Trophy },
      { label: "Engagement", value: pointsData.commentPoints + pointsData.likePoints, icon: Shield }
    ].map((stat, index) => (
      <motion.div
        key={stat.label}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-[#fa7517]/20"
      >
        <stat.icon className="w-5 h-5 text-[#fa7517] mb-2" />
        <p className="text-sm text-gray-400">{stat.label}</p>
        <p className="text-lg font-semibold text-white">
          {stat.value.toLocaleString()}
        </p>
      </motion.div>
    ))}
  </div>
);

export const Title: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h1 className="text-4xl font-bold text-center text-white mb-4">{children}</h1>
);

export const Message: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-xl text-gray-300 text-center mb-8">{children}</div>
);

export const MintCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-black/50 backdrop-blur-sm rounded-xl p-6 relative overflow-hidden">
    {children}
  </div>
);

export const NFTPreview: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-gray-900 to-black flex items-center justify-center mb-6">
    {children}
  </div>
);

export const RankBadge: React.FC<{ rank: string }> = ({ rank }) => (
  <motion.div
    className="relative"
    animate={{
      rotateY: [0, 360],
    }}
    transition={{
      duration: 20,
      repeat: Infinity,
      ease: "linear",
    }}
  >
    <div className="w-48 h-48 rounded-full bg-gradient-to-r from-[#fa7517] to-[#ff8c3a] 
      flex items-center justify-center transform preserve-3d">
      <Trophy className="w-24 h-24 text-white" />
    </div>
    <motion.div
      className="absolute inset-0 rounded-full"
      animate={{
        boxShadow: [
          "0 0 30px rgba(250, 117, 23, 0.3)",
          "0 0 60px rgba(250, 117, 23, 0.6)",
          "0 0 30px rgba(250, 117, 23, 0.3)",
        ],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        repeatType: "reverse",
      }}
    />
  </motion.div>
);

export const StatsGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="grid grid-cols-2 gap-4 mb-6">{children}</div>
);

export const RotatingBorder: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative rounded-xl p-[1px] overflow-hidden">
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-[#fa7517] via-[#ff8c3a] to-[#fa7517]"
      animate={{
        backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
      }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: "linear",
      }}
    />
    <div className="relative bg-black/90 rounded-xl">{children}</div>
  </div>
);

export const ScrollPrompt: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    className="fixed bottom-12 right-12 flex flex-col items-center gap-2"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 2.5 }}
  >
    {children}
  </motion.div>
);

export const AchievementEcho: React.FC = () => (
  <>
    {[1, 2, 3].map((index) => (
      <motion.div
        key={index}
        className="absolute inset-0 border-2 border-[#fa7517] rounded-xl"
        initial={{ scale: 1, opacity: 0.3 }}
        animate={{
          scale: [1, 1.5, 2],
          opacity: [0.3, 0.1, 0],
        }}
        transition={{
          duration: 2,
          delay: index * 0.4,
          repeat: Infinity,
          repeatType: "loop",
        }}
      />
    ))}
  </>
);

export const MintButton: React.FC<{
  onClick: () => void;
  disabled: boolean;
  minting: boolean;
  isEpoch?: boolean;
}> = ({ onClick, disabled, minting, isEpoch = false }) => (
  <motion.button
    onClick={onClick}
    disabled={disabled}
    className={`
      relative overflow-hidden px-8 py-4 rounded-lg font-bold text-lg mt-8 w-full
      ${disabled 
        ? 'bg-gray-700 cursor-not-allowed' 
        : 'bg-gradient-to-r from-[#fa7517] to-[#ff8c3a] hover:from-[#ff8c3a] hover:to-[#fa7517]'
      }
    `}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    <span className="relative z-10">
      {minting ? 'Minting...' : `Mint Your ${isEpoch ? 'Epoch' : 'Moment'} NFT`}
    </span>
    
    {minting && (
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-[#fa7517] to-[#ff8c3a]"
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    )}
  </motion.button>
);

export const AnimatedParticles: React.FC = () => (
  <>
    {[...Array(30)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 bg-[#fa7517] rounded-full"
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
          delay: Math.random() * 2,
          repeat: Infinity,
          repeatType: "loop",
        }}
      />
    ))}
  </>
);

export const PulsatingRings: React.FC = () => (
  <>
    {[64, 80, 96].map((size, i) => (
      <motion.div
        key={i}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
          border-2 border-[#fa7517] rounded-full"
        style={{ width: size, height: size }}
        initial={{ scale: 0, opacity: 1 }}
        animate={{
          scale: [1, 1.5, 2],
          opacity: [0.3, 0.2, 0],
        }}
        transition={{
          duration: 2,
          delay: i * 0.2,
          repeat: Infinity,
          repeatType: "loop",
        }}
      />
    ))}
  </>
); 