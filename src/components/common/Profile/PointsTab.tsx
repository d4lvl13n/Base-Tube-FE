import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, 
  Play, 
  MessageSquare, 
  Clock, 
  Heart,
  Eye,
  Trophy,
  Star,
  HelpCircle
} from 'lucide-react';
import { useUserPoints, useUserPointsHistory, hasRankData } from '../../../hooks/useUserPoints';
import { LineChart } from '../../../components/pages/CreatorHub/Analytics/charts/LineChart';
import { format } from 'date-fns';
import Loader from '../Loader';
import Error from '../Error';
import { Link } from 'react-router-dom';

const PointsTab: React.FC = () => {
  const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('7d');
  const [showComingSoon, setShowComingSoon] = useState(false);
  
  const { 
    data: points, 
    isLoading: isPointsLoading, 
    error: pointsError 
  } = useUserPoints();
  
  const { 
    data: history, 
    isLoading: isHistoryLoading, 
    error: historyError 
  } = useUserPointsHistory(period);

  if (isPointsLoading || isHistoryLoading) return <Loader />;
  if (pointsError || historyError) return <Error message="Failed to load points data" />;

  const chartData = history?.map(item => ({
    date: format(new Date(item.calculatedAt), 'MMM d'),
    points: item.totalPoints,
  })) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* FAQ Link Card */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="p-4 rounded-xl bg-[#fa7517]/10 border border-[#fa7517]/20 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#fa7517]/10 rounded-lg">
              <HelpCircle className="w-5 h-5 text-[#fa7517]" />
            </div>
            <p className="text-gray-300">
              Learn more about Points and Epoch NFTs in our FAQ
            </p>
          </div>
          <Link
            to="/faq/moment-nfts"
            className="px-4 py-2 rounded-lg bg-[#fa7517]/20 hover:bg-[#fa7517]/30 
              text-[#fa7517] font-semibold transition-colors duration-200"
          >
            View FAQ
          </Link>
        </div>
      </motion.div>

      {/* Top Section - Points Summary and Rank Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Points Summary Card */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm relative overflow-hidden"
          style={{
            boxShadow: `
              0 0 20px 5px rgba(250, 117, 23, 0.1),
              0 0 40px 10px rgba(250, 117, 23, 0.05),
              inset 0 0 60px 15px rgba(250, 117, 23, 0.03)
            `
          }}
        >
          <div className="relative z-10">
            {/* Header with Total Points Badge */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-900/50 rounded-lg">
                  <Award className="w-5 h-5 text-[#fa7517]" />
                </div>
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                  Total Points
                </h2>
              </div>
              
              {/* Total Points Badge */}
              <div className="flex justify-end mb-6">
                <div className="flex items-center gap-2 px-4 py-2 bg-[#fa7517]/10 rounded-full border border-[#fa7517]/20">
                  <Trophy className="w-5 h-5 text-[#fa7517]" />
                  <div className="flex flex-col">
                    
                    <span className="text-lg font-bold text-[#fa7517]">
                      {points?.totalPoints.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Points Categories Grid */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { 
                  label: 'Video Upload Points', 
                  value: points?.videoUploadPoints || 0, 
                  icon: <Play className="w-6 h-6" />,
                  description: 'Points earned from uploading videos'
                },
                { 
                  label: 'Comment Points', 
                  value: points?.commentPoints || 0, 
                  icon: <MessageSquare className="w-6 h-6" />,
                  description: 'Points earned from engaging on videos'
                },
                { 
                  label: 'View Points', 
                  value: points?.videoViewPoints || 0, 
                  icon: <Eye className="w-6 h-6" />,
                  description: 'Points earned from video views'
                },
                { 
                  label: 'Watch Time Points', 
                  value: points?.watchTimePoints || 0, 
                  icon: <Clock className="w-6 h-6" />,
                  description: 'Points calculated from time passed watching videos'
                },
                { 
                  label: 'Like Points', 
                  value: points?.likePoints || 0, 
                  icon: <Heart className="w-6 h-6 fill-current" />,
                  description: 'Points earned when you like a video'
                },
                { 
                  label: 'Creator Bonus Points', 
                  value: points?.uploaderBonusPoints || 0, 
                  icon: <Award className="w-6 h-6" />,
                  description: 'Creator Bonus points are earned when your videos are watched'
                },
              ].map((item) => (
                <motion.div 
                  key={item.label}
                  className="relative group"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="p-4 rounded-xl bg-black/50 border border-gray-800/30
                      backdrop-blur-sm flex flex-col items-center justify-center gap-2
                      aspect-square relative overflow-hidden"
                  >
                    <div className="p-3 bg-gray-900/50 rounded-lg">
                      <span className="text-[#fa7517]">{item.icon}</span>
                    </div>
                    <span className="text-lg font-semibold text-white">
                      {item.value.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-400 text-center">
                      {item.label}
                    </span>

                    <motion.div
                      className="absolute inset-0 bg-[#fa7517] opacity-0 blur-2xl transition-opacity duration-300"
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 0.03 }}
                    />
                  </motion.div>

                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 
                        hidden group-hover:block z-50"
                    >
                      <div className="bg-black/90 backdrop-blur-sm rounded-lg p-3 
                        shadow-lg border border-gray-800/30 min-w-[200px]"
                      >
                        <p className="text-white text-sm">{item.description}</p>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="absolute inset-0 bg-gradient-to-br from-[#fa751708] to-transparent" />
          <motion.div
            className="absolute inset-0 bg-[#fa7517] opacity-0 blur-2xl transition-opacity duration-300"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 0.03 }}
          />
        </motion.div>

        {/* Rank Card */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm relative overflow-hidden"
          style={{
            boxShadow: `
              0 0 20px 5px rgba(250, 117, 23, 0.1),
              0 0 40px 10px rgba(250, 117, 23, 0.05),
              inset 0 0 60px 15px rgba(250, 117, 23, 0.03)
            `
          }}
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              
            </div>

            {hasRankData(points!) && (
              <div className="space-y-6">
                {/* Current Rank Display */}
                <div className="flex items-center justify-between p-4 bg-gray-900/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-[#fa7517]/10 rounded-lg">
                      <Trophy className="w-8 h-8 text-[#fa7517]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Current Rank</p>
                      <p className="text-2xl font-bold text-white">{points?.rank.rank}</p>
                    </div>
                  </div>
                </div>

                {/* Progress to Next Rank */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Progress to {points?.rank.nextRank || 'Max Rank'}</span>
                    <span className="text-[#fa7517]">{Math.round(points?.progressToNextRank || 0)}%</span>
                  </div>
                  <div className="h-2 bg-gray-900/50 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-[#fa7517]"
                      initial={{ width: 0 }}
                      animate={{ width: `${points?.progressToNextRank}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{points?.rank.minPoints} pts</span>
                    <span>{points?.rank.nextRankPoints || 'Max'} pts</span>
                  </div>
                </div>

                {/* Points to Next Rank & NFT Claim Button */}
                {points?.rank.pointsToNextRank && points?.rank.pointsToNextRank > 0 && (
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-[#fa7517]/10 rounded-lg">
                      <p className="text-sm text-gray-400">Points needed for next rank</p>
                      <p className="text-2xl font-bold text-[#fa7517]">
                        {points?.rank.pointsToNextRank.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </p>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowComingSoon(true)}
                      className="w-full py-3 px-4 rounded-lg 
                        bg-gradient-to-r from-[#fa7517] to-[#fa9517]
                        hover:from-[#fa8517] hover:to-[#faa517]
                        transition-all duration-300 relative group overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-black/20 opacity-0 
                        group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <div className="relative flex items-center justify-center gap-2">
                        <Star className="w-5 h-5 text-white" />
                        <span className="font-semibold text-white">
                          Claim your Epoch NFTs
                        </span>
                      </div>

                      <motion.div
                        className="absolute inset-0 bg-white opacity-0 blur-2xl transition-opacity duration-300"
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 0.1 }}
                      />
                    </motion.button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="absolute inset-0 bg-gradient-to-br from-[#fa751708] to-transparent" />
          <motion.div
            className="absolute inset-0 bg-[#fa7517] opacity-0 blur-2xl transition-opacity duration-300"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 0.03 }}
          />
        </motion.div>
      </div>

      {/* Points History Chart */}
      <motion.div 
        whileHover={{ scale: 1.02 }}
        className="p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm relative overflow-hidden"
        style={{
          boxShadow: `
            0 0 20px 5px rgba(250, 117, 23, 0.1),
            0 0 40px 10px rgba(250, 117, 23, 0.05),
            inset 0 0 60px 15px rgba(250, 117, 23, 0.03)
          `
        }}
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-900/50 rounded-lg">
                <Award className="w-5 h-5 text-[#fa7517]" />
              </div>
              <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                Points History
              </h2>
            </div>
            <div className="flex gap-2">
              {(['24h', '7d', '30d'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    period === p
                      ? 'bg-[#fa7517] text-white'
                      : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {chartData.length > 0 ? (
            <LineChart
              data={chartData}
              xKey="date"
              yKey="points"
              color="#fa7517"
            />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              No points history available for this period
            </div>
          )}
        </div>

        <div className="absolute inset-0 bg-gradient-to-br from-[#fa751708] to-transparent" />
        
        <motion.div
          className="absolute inset-0 bg-[#fa7517] opacity-0 blur-2xl transition-opacity duration-300"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 0.03 }}
        />
      </motion.div>

      {/* Coming Soon Modal */}
      <AnimatePresence>
        {showComingSoon && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowComingSoon(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                z-50 w-full max-w-md p-6 rounded-xl
                bg-black/90 border border-gray-800/30 backdrop-blur-sm"
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-[#fa7517]/10 rounded-full 
                  flex items-center justify-center">
                  <Star className="w-8 h-8 text-[#fa7517]" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Coming Soon!
                </h3>
                <p className="text-gray-400">
                  NFT claiming feature is under development. Stay tuned for updates!
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowComingSoon(false)}
                  className="px-6 py-2 bg-gray-800 hover:bg-gray-700 
                    rounded-lg text-white transition-colors"
                >
                  Got it
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PointsTab;