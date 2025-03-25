import React, { useState, useRef } from 'react';
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import { useUserPoints } from '../../hooks/useUserPoints';
import {
  TimelineNode,
  MintButton,
  TimelineTrack,
} from './styles';
import Loader from '../../components/common/Loader';
import Error from '../../components/common/Error';
import RankAchievementAnimation from './RankAchievementAnimation';

const RANKS = [
  {
    title: "Rising Voyager",
    minPoints: 0,
    maxPoints: 49,
    description: "Every journey begins with a single step. Thanks for being a part of the Base.Tube community!"
  },
  {
    title: "Engaged Contributor",
    minPoints: 50,
    maxPoints: 249,
    description: "Your active participation is noticed. Keep engaging, and you'll soon climb the ranks!"
  },
  {
    title: "Community Builder",
    minPoints: 250,
    maxPoints: 499,
    description: "You're forging connections and making an impact in our community."
  },
  {
    title: "Platform Pioneer",
    minPoints: 500,
    maxPoints: 1249,
    description: "You're pushing boundaries and setting trends on Base.Tube."
  },
  {
    title: "Innovative Icon",
    minPoints: 1250,
    maxPoints: 2499,
    description: "Your contributions are truly exceptional, inspiring others across the platform."
  },
  {
    title: "Base.Tube Legend",
    minPoints: 2500,
    maxPoints: null,
    description: "The pinnacle of achievement—a status reserved for those whose impact transforms the ecosystem."
  }
];

const MomentNFTMintPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [minting, setMinting] = useState(false);
  const [minted, setMinted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showComingSoon, setShowComingSoon] = useState(false);

  // Scroll animations
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Get actual user points data
  const { data: pointsData, isLoading, error: pointsError } = useUserPoints();

  if (isLoading) return <Loader />;
  if (pointsError || !pointsData) return <Error message="Failed to load achievement data" />;

  // Find current rank index
  const currentRankIndex = RANKS.findIndex(rank => 
    pointsData.totalPoints >= rank.minPoints && 
    (rank.maxPoints === null || pointsData.totalPoints <= rank.maxPoints)
  );

  const handleMint = async () => {
    // Show the coming soon message instead of doing the actual minting
    setShowComingSoon(true);
    
    // Hide the message after 5 seconds
    setTimeout(() => {
      setShowComingSoon(false);
    }, 5000);
    
    // The below code is commented out as we're showing coming soon message instead
    /*
    setMinting(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setMinted(true);
    } catch (err) {
      setError('Failed to mint. Please try again.');
    } finally {
      setMinting(false);
    }
    */
  };

  return (
    <div className="min-h-screen bg-[#09090B]">
      <Header />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          {/* Hero Section */}
          <div className="min-h-screen flex items-center justify-center relative">
            <RankAchievementAnimation 
              rank={RANKS[currentRankIndex].title}
              points={pointsData.totalPoints}
              isFirstRank={currentRankIndex === 0}
              onAnimationComplete={() => setShowTimeline(true)}
            />
          </div>

          {/* Timeline Section */}
          <div ref={containerRef} className="relative">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: showTimeline ? 1 : 0 }}
              transition={{ duration: 0.5 }}
            >
              <TimelineTrack progress={smoothProgress}>
                {RANKS.map((rank, index) => (
                  <TimelineNode
                    key={rank.title}
                    title={rank.title}
                    description={rank.description}
                    points={`${rank.minPoints.toLocaleString()}${rank.maxPoints ? ` - ${rank.maxPoints.toLocaleString()}` : '+'} points`}
                    achieved={index <= currentRankIndex}
                    current={index === currentRankIndex}
                    scrollProgress={smoothProgress}
                    index={index}
                  >
                    {index === currentRankIndex && !minted && (
                      <>
                        <motion.div 
                          className="text-center text-gray-400 text-sm mb-6"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 }}
                        >
                          Base.Tube Epoch NFTs are achievement-based NFTs that recognize 
                          your activity and contributions. This NFT represents your 
                          current rank and serves as a permanent record of your journey.
                        </motion.div>
                        <MintButton
                          onClick={handleMint}
                          disabled={minting}
                          minting={minting}
                          isEpoch={true}
                        />
                      </>
                    )}
                  </TimelineNode>
                ))}
              </TimelineTrack>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Success/Error/Coming Soon Messages */}
      <AnimatePresence>
        {minted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-8 right-8 bg-green-500/20 backdrop-blur-sm 
              border border-green-500/30 rounded-lg p-4 text-green-400"
          >
            Successfully minted your Epoch NFT!
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-8 right-8 bg-red-500/20 backdrop-blur-sm 
              border border-red-500/30 rounded-lg p-4 text-red-400"
          >
            {error}
          </motion.div>
        )}
        {showComingSoon && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
              bg-black/80 backdrop-blur-lg border border-[#fa7517]/30 rounded-xl p-6 
              max-w-md w-full shadow-2xl text-center z-50"
          >
            <h3 className="text-2xl font-bold text-white mb-2">Coming Soon!</h3>
            <p className="text-gray-300 mb-4">
              Epoch NFTs are currently in development. The contract will be deployed soon.
              Stay tuned for announcements in our Discord community!
            </p>
            <button
              onClick={() => setShowComingSoon(false)}
              className="px-6 py-2 bg-[#fa7517] hover:bg-[#fa7517]/80 rounded-lg font-medium"
            >
              Got it
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MomentNFTMintPage; 