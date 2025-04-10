import React, { useState } from 'react';
import { Brain, Clock, Lightbulb, BarChart2, Users, Zap, RefreshCw, TrendingUp, X, Sparkles } from 'lucide-react';
import { useAnalyticsInsights } from '../../../../../hooks/useAnalyticsData';
import { Select } from '../../../../ui/Select';
import { motion } from 'framer-motion';
import StatsCard from '../../../CreatorHub/StatsCard';

// Define available periods
const PERIODS = {
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
  '90d': 'Last 90 Days',
  'all': 'All Time'
} as const;

type PeriodKey = keyof typeof PERIODS;

export const AIInsightsTab: React.FC<{ channelId: string }> = ({ channelId }) => {
  // Now we store an array of selected periods instead of a single period
  const [selectedPeriods, setSelectedPeriods] = useState<PeriodKey[]>(['7d', '30d', '90d', 'all']);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { 
    insights, 
    isLoading, 
    error, 
    refreshInsights 
  } = useAnalyticsInsights(selectedPeriods, channelId);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshInsights();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Toggle a period selection
  const togglePeriod = (period: PeriodKey) => {
    if (selectedPeriods.includes(period)) {
      // Don't allow removing if it's the last period
      if (selectedPeriods.length > 1) {
        setSelectedPeriods(selectedPeriods.filter(p => p !== period));
      }
    } else {
      setSelectedPeriods([...selectedPeriods, period]);
    }
  };

  // Set selection to a specific preset
  const setSelectionPreset = (preset: 'all' | 'recent' | 'single-30d') => {
    switch (preset) {
      case 'all':
        setSelectedPeriods(['7d', '30d', '90d', 'all']);
        break;
      case 'recent':
        setSelectedPeriods(['7d', '30d']);
        break;
      case 'single-30d':
        setSelectedPeriods(['30d']);
        break;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#fa7517]/20 rounded-full">
            <Sparkles className="w-6 h-6 text-[#fa7517]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">AI-Powered Insights</h2>
            <p className="text-gray-400">Smart analysis of your channel performance</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {(isLoading || isRefreshing) && (
            <div className="animate-spin">
              <Clock className="w-4 h-4 text-[#fa7517]" />
            </div>
          )}
          <button 
            onClick={handleRefresh}
            className="p-2 rounded-full hover:bg-gray-800 transition-colors"
            disabled={isLoading || isRefreshing}
          >
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </button>
          
          {/* Simplified period selector */}
          <Select
            value={
              selectedPeriods.length === 4 ? "all-periods" :
              selectedPeriods.length === 2 && selectedPeriods.includes('7d') && selectedPeriods.includes('30d') ? "recent" :
              selectedPeriods.length === 1 && selectedPeriods[0] === '30d' ? "single-30d" :
              "custom"
            }
            onValueChange={(value) => {
              if (value === "all-periods") setSelectionPreset('all');
              else if (value === "recent") setSelectionPreset('recent');
              else if (value === "single-30d") setSelectionPreset('single-30d');
            }}
            options={[
              { value: "all-periods", label: "All Periods" },
              { value: "recent", label: "Recent (7d & 30d)" },
              { value: "single-30d", label: "Last 30 Days Only" },
              { value: "custom", label: "Custom Selection" }
            ]}
          />
        </div>
      </div>

      {/* Period Selector Pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(PERIODS).map(([period, label]) => (
          <div 
            key={period}
            className={`
              inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium
              transition-colors cursor-pointer
              ${selectedPeriods.includes(period as PeriodKey) 
                ? 'bg-[#fa7517]/20 text-[#fa7517] border border-[#fa7517]/30' 
                : 'bg-gray-800/50 text-gray-400 border border-gray-700/30 hover:bg-gray-800'}
            `}
            onClick={() => togglePeriod(period as PeriodKey)}
          >
            {label}
            {selectedPeriods.includes(period as PeriodKey) && selectedPeriods.length > 1 && (
              <X className="w-3.5 h-3.5 ml-2 opacity-70" />
            )}
          </div>
        ))}
      </div>

      {/* Loading State - Creative "AI Thinking" Animation */}
      {isLoading && !error && (
        <motion.div 
          className="p-12 rounded-xl bg-black/30 border border-[#fa7517]/20 backdrop-blur-sm relative overflow-hidden text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <div className="flex flex-col items-center justify-center">
            {/* Pulsing Brain Animation */}
            <div className="relative mb-6">
              <motion.div 
                className="absolute inset-0 rounded-full bg-[#fa7517]/10"
                animate={{ 
                  scale: [1, 1.5, 1], 
                  opacity: [0.3, 0.5, 0.3] 
                }}
                transition={{ 
                  duration:
                  3, 
                  repeat: Infinity,
                  ease: "easeInOut" 
                }}
              />
              <Brain className="w-16 h-16 text-[#fa7517] relative z-10" />
              
              {/* Orbiting Sparks */}
              {[...Array(3)].map((_, i) => (
                <motion.div 
                  key={i}
                  className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full bg-[#fa7517]"
                  animate={{ 
                    x: Math.cos(i * (Math.PI * 2 / 3)) * 50, 
                    y: Math.sin(i * (Math.PI * 2 / 3)) * 50,
                    scale: [1, 1.5, 1],
                    opacity: [0.7, 1, 0.7]
                  }}
                  transition={{ 
                    duration: 2 + i * 0.3, 
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut" 
                  }}
                />
              ))}
            </div>
            
            <h3 className="text-xl font-bold text-[#fa7517] mb-2">AI is analyzing your data</h3>
            <p className="text-gray-300 mb-6">Cooking up insights across {selectedPeriods.length} time periods...</p>
            
            {/* Progress Bar */}
            <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-[#fa7517] to-[#fa751799]"
                animate={{ width: ["0%", "100%", "0%"] }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut" 
                }}
              />
            </div>
            
            <div className="mt-4 text-gray-400 text-sm">
              This might take a minute as our AI crafts personalized recommendations
            </div>
          </div>
        </motion.div>
      )}

      {error ? (
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
          <p className="text-red-400">
            {error.message || 'Failed to load AI insights. Please try again later.'}
          </p>
        </div>
      ) : !isLoading && (
        <div className="space-y-8">
          {/* Period Comparison Section (only show when multiple periods selected) */}
          {selectedPeriods.length > 1 && insights?.periodComparison && (
            <motion.div 
              className="p-6 rounded-xl bg-black/50 border border-blue-400/20 backdrop-blur-sm relative overflow-hidden"
              animate={{ opacity: isLoading ? 0.6 : 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-start gap-3 mb-4">
                <TrendingUp className="w-6 h-6 text-blue-400" />
                <div>
                  <h3 className="text-xl font-semibold">Comparative Analysis</h3>
                  <p className="text-gray-300">Across {selectedPeriods.map(p => PERIODS[p]).join(', ')}</p>
                </div>
              </div>
              <div className="pl-9">
                {isLoading ? (
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-700 animate-pulse rounded w-full" />
                    <div className="h-4 bg-gray-700 animate-pulse rounded w-3/4" />
                    <div className="h-4 bg-gray-700 animate-pulse rounded w-5/6" />
                  </div>
                ) : (
                  <>
                    <p className="text-gray-200 leading-relaxed mb-4">
                      {insights.periodComparison.comparativeInsights}
                    </p>
                    
                    {/* Key trends across time periods */}
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-blue-400 mb-2">KEY TRENDS ACROSS PERIODS</h4>
                      {insights.periodComparison.trends.length > 0 ? (
                        <ul className="space-y-2">
                          {insights.periodComparison.trends.map((trend, index) => (
                            <li key={index} className="flex items-start gap-2 bg-blue-400/10 p-2 rounded">
                              <span className="text-blue-400 mt-1">•</span>
                              <span className="text-gray-200">{trend}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-400">No significant trends identified.</p>
                      )}
                    </div>
                    
                    {/* Most representative period */}
                    <div className="mt-4 bg-gray-800/50 p-3 rounded-lg inline-block">
                      <span className="text-sm text-gray-400">Most representative period:</span>{' '}
                      <span className="text-blue-400 font-medium">{PERIODS[insights.periodComparison.representativePeriod]}</span>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* Summary Card */}
          <motion.div 
            className="p-6 rounded-xl bg-black/50 border border-[#fa7517]/20 backdrop-blur-sm relative overflow-hidden"
            animate={{ opacity: isLoading ? 0.6 : 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-start gap-3 mb-4">
              <Brain className="w-6 h-6 text-[#fa7517]" />
              <div>
                <h3 className="text-xl font-semibold">Performance Summary</h3>
                <p className="text-gray-300">
                  {selectedPeriods.length === 1 
                    ? `For ${PERIODS[selectedPeriods[0]]}` 
                    : `For selected periods (${selectedPeriods.length})`}
                </p>
              </div>
            </div>
            <div className="pl-9">
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-gray-700 animate-pulse rounded w-full" />
                  <div className="h-4 bg-gray-700 animate-pulse rounded w-3/4" />
                  <div className="h-4 bg-gray-700 animate-pulse rounded w-5/6" />
                </div>
              ) : (
                <p className="text-gray-200 leading-relaxed">
                  {insights?.insights || 'No insights available for the selected period. Try changing the time range or check back later.'}
                </p>
              )}
            </div>
          </motion.div>

          {/* Strengths & Areas for Improvement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <motion.div 
              className="p-6 rounded-xl bg-black/50 border border-green-500/20 backdrop-blur-sm"
              animate={{ opacity: isLoading ? 0.6 : 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-5 h-5 text-green-500" />
                <h3 className="text-lg font-semibold">Channel Strengths</h3>
              </div>
              
              {isLoading ? (
                <div className="space-y-3">
                  <div className="h-4 bg-gray-700 animate-pulse rounded w-full" />
                  <div className="h-4 bg-gray-700 animate-pulse rounded w-3/4" />
                  <div className="h-4 bg-gray-700 animate-pulse rounded w-5/6" />
                </div>
              ) : insights?.performanceSummary?.strengths?.length ? (
                <ul className="space-y-2">
                  {insights.performanceSummary.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      <span className="text-gray-200">{strength}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400">No specific strengths identified in this period.</p>
              )}
            </motion.div>
            
            {/* Areas for Improvement */}
            <motion.div 
              className="p-6 rounded-xl bg-black/50 border border-blue-500/20 backdrop-blur-sm"
              animate={{ opacity: isLoading ? 0.6 : 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <BarChart2 className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-semibold">Areas for Improvement</h3>
              </div>
              
              {isLoading ? (
                <div className="space-y-3">
                  <div className="h-4 bg-gray-700 animate-pulse rounded w-full" />
                  <div className="h-4 bg-gray-700 animate-pulse rounded w-5/6" />
                  <div className="h-4 bg-gray-700 animate-pulse rounded w-3/4" />
                </div>
              ) : insights?.performanceSummary?.areasForImprovement?.length ? (
                <ul className="space-y-2">
                  {insights.performanceSummary.areasForImprovement.map((area, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span className="text-gray-200">{area}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400">No specific areas for improvement identified in this period.</p>
              )}
            </motion.div>
          </div>

          {/* Audience Insights */}
          <motion.div 
            className="p-6 rounded-xl bg-black/50 border border-purple-500/20 backdrop-blur-sm"
            animate={{ opacity: isLoading ? 0.6 : 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-5 h-5 text-purple-500" />
              <h3 className="text-lg font-semibold">Audience Insights</h3>
            </div>
            
            {isLoading ? (
              <div className="space-y-3">
                <div className="h-4 bg-gray-700 animate-pulse rounded w-full" />
                <div className="h-4 bg-gray-700 animate-pulse rounded w-4/5" />
                <div className="h-4 bg-gray-700 animate-pulse rounded w-3/4" />
              </div>
            ) : insights?.audienceInsights ? (
              <p className="text-gray-200 leading-relaxed">{insights.audienceInsights}</p>
            ) : (
              <p className="text-gray-400">No audience insights available for this period.</p>
            )}
          </motion.div>

          {/* Content Strategy Recommendations */}
          <motion.div 
            className="p-6 rounded-xl bg-black/50 border border-[#fa7517]/20 backdrop-blur-sm"
            animate={{ opacity: isLoading ? 0.6 : 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Lightbulb className="w-5 h-5 text-[#fa7517]" />
              <h3 className="text-lg font-semibold">Content Strategy Recommendations</h3>
            </div>
            
            {isLoading ? (
              <div className="space-y-3">
                <div className="h-4 bg-gray-700 animate-pulse rounded w-full" />
                <div className="h-4 bg-gray-700 animate-pulse rounded w-5/6" />
                <div className="h-4 bg-gray-700 animate-pulse rounded w-4/5" />
              </div>
            ) : insights?.contentStrategySuggestions?.length ? (
              <ul className="space-y-3">
                {insights.contentStrategySuggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-3 p-3 bg-[#fa7517]/10 rounded-lg">
                    <span className="text-[#fa7517] font-bold mt-1">{index + 1}.</span>
                    <span className="text-gray-200">{suggestion}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400">No content strategy recommendations available for this period.</p>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}; 