import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Alert, AlertDescription } from './Components/Alert';
import { Button } from './Components/button';
import { Input } from './Components/input';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Zap, 
  Users, 
  Eye, 
  Ticket, 
  DollarSign, 
  TrendingUp, 
  BarChart2, 
  Calculator, 
  BarChart, 
  PieChart, 
  RefreshCw 
} from 'lucide-react';

interface RiskAssessment {
  level: string;
  description: string;
  color: string;
}

interface RecommendedSupply {
  conservative: number;
  moderate: number;
  aggressive: number;
}

const NFTSimulator: React.FC = () => {
  // ==========================
  // State Management
  // ==========================
  const [inputs, setInputs] = useState({
    followers: '',
    avgViews: '',
    nftSupply: '1000',
    startPrice: '5',
    maxPrice: '250'
  });

  const [results, setResults] = useState<{
    totalRevenue: number;
    creatorRevenue: number;
    platformRevenue: number;
    avgPrice: number;
    priceIncrement: number;
    riskAssessment: RiskAssessment;
    recommendedSupply: RecommendedSupply;
    recommendations: string[];
  } | null>(null);

  const [chartData, setChartData] = useState<Array<{
    passes: number;
    price: number;
    revenue: number;
  }>>([]);

  // ==========================
  // Helper Functions
  // ==========================

  /**
   * Assess risk by comparing the entire NFT supply to the average video views.
   * The assumption is if supply is too large relative to typical engagement, 
   * it's high risk to expect a full sellout.
   */
  const calculateRiskLevel = (
    followers: number,
    avgViews: number,
    nftSupply: number
  ): RiskAssessment => {
    // If no usable metrics, we cannot assess risk
    if (followers <= 0 && avgViews <= 0) {
      return {
        level: 'Undefined',
        description: 'No followers or views entered, cannot assess risk.',
        color: 'text-gray-600'
      };
    }

    // Compute ratios based on whichever metrics are present and take the worst-case (highest %)
    const ratios: number[] = [];
    if (avgViews > 0) ratios.push((nftSupply / avgViews) * 100);
    if (followers > 0) ratios.push((nftSupply / followers) * 100);

    const worstRatio = Math.max(...ratios);

    if (worstRatio <= 20) {
      return {
        level: 'Low Risk',
        description: 'Supply is well within your audience capacity. High confidence in sell-out.',
        color: 'text-green-600'
      };
    } else if (worstRatio <= 50) {
      return {
        level: 'Medium Risk',
        description: 'Supply is moderate relative to audience. Monitor sales pace.',
        color: 'text-yellow-600'
      };
    } else {
      return {
        level: 'High Risk',
        description: 'Supply may be too high for current audience size. Consider reducing supply or boosting marketing.',
        color: 'text-red-600'
      };
    }
  };

  /**
   * Suggest a recommended supply range based on a fraction of average views.
   * - conservative: 10% of avgViews
   * - moderate: 20% of avgViews
   * - aggressive: 30% of avgViews
   */
  const calculateRecommendedSupply = (followers: number, avgViews: number): RecommendedSupply => {
    // Recommendations based on both metrics (use the lower to stay conservative)
    const cons = Math.floor(Math.min(avgViews * 0.1, followers * 0.02)); // 10% views OR 2% followers
    const mod = Math.floor(Math.min(avgViews * 0.2, followers * 0.05)); // 20% views OR 5% followers
    const aggr = Math.floor(Math.min(avgViews * 0.3, followers * 0.1)); // 30% views OR 10% followers

    return {
      conservative: cons,
      moderate: mod,
      aggressive: aggr
    };
  };

  /**
   * Simple heuristic to suggest start and max prices based on audience size.
   */
  const getSuggestedPriceRange = (
    followers: number,
    avgViews: number
  ): { start: number; max: number } => {
    const audience = Math.max(followers, avgViews);
    if (audience < 10000) {
      return { start: 5, max: 50 };
    } else if (audience < 50000) {
      return { start: 10, max: 100 };
    } else if (audience < 250000) {
      return { start: 20, max: 250 };
    } else {
      return { start: 30, max: 500 };
    }
  };

  /**
   * Generate actionable recommendations for the creator based on metrics.
   */
  const generateRecommendations = (
    followers: number,
    avgViews: number,
    nftSupply: number,
    startPrice: number,
    maxPrice: number,
    priceIncrement: number,
    risk: RiskAssessment,
    supplySuggestion: RecommendedSupply
  ): string[] => {
    const recs: string[] = [];

    // Supply vs recommendation
    if (nftSupply > supplySuggestion.aggressive) {
      recs.push(`Your current supply (${nftSupply.toLocaleString()}) is above the aggressive recommendation. Consider reducing to around ${supplySuggestion.moderate.toLocaleString()} passes.`);
    } else if (nftSupply < supplySuggestion.conservative) {
      recs.push(`Your supply (${nftSupply.toLocaleString()}) is below the conservative recommendation. You may leave money on the table; consider increasing to at least ${supplySuggestion.conservative.toLocaleString()} passes.`);
    }

    // Risk-based guidance
    if (risk.level === 'High Risk') {
      recs.push('High risk detected: lower supply or boost marketing efforts before launch.');
    } else if (risk.level === 'Medium Risk') {
      recs.push('Medium risk: monitor sales pace closely and be ready to adjust pricing or supply.');
    } else if (risk.level === 'Low Risk') {
      recs.push('Low risk: supply aligns well with your audience — great starting point!');
    }

    // Conversion requirement insight (followers)
    if (followers > 0) {
      const neededConv = (nftSupply / followers) * 100;
      recs.push(`You need roughly ${neededConv.toFixed(2)}% of your followers to buy a pass to sell out.`);
    }

    // Price increment sanity check
    const incPct = priceIncrement / startPrice;
    if (incPct > 0.5) {
      recs.push('Your price increases more than 50% of the starting price per step. Consider smoothing the curve or lowering the max price.');
    }

    // Pricing guidance
    const priceRange = getSuggestedPriceRange(followers, avgViews);
    if (startPrice < priceRange.start * 0.8) {
      recs.push(`Starting price ($${startPrice}) looks low for your audience size. A range around $${priceRange.start} may capture more value.`);
    } else if (startPrice > priceRange.start * 1.2) {
      recs.push(`Starting price ($${startPrice}) may be high for initial buyers. Consider reducing to ~$${priceRange.start}.`);
    }

    if (priceRange && priceRange.max) {
      if (maxPrice < priceRange.max * 0.8) {
        recs.push(`Max price ($${maxPrice}) is conservative. You could push up to ~$${priceRange.max} if demand is strong.`);
      } else if (maxPrice > priceRange.max * 1.5) {
        recs.push(`Max price ($${maxPrice}) may overshoot market tolerance. Consider capping near $${priceRange.max}.`);
      }
    }

    // Channel growth recommendation
    if (followers < 1000) {
      recs.push(`Your follower count (${followers.toLocaleString()}) is relatively low for an NFT launch. Consider focusing on growing your audience first to ensure sufficient demand for your passes.`);
    } else if (followers < 5000) {
      recs.push(`With ${followers.toLocaleString()} followers, your channel is growing but still early-stage. Consider a smaller initial NFT drop or building more community engagement before launching.`);
    }

    return recs;
  };

  /**
   * Linear bonding curve revenue calculation, assuming the entire supply sells out.
   */
  const calculateRevenue = () => {
    const followers = Number(inputs.followers) || 0;
    const avgViews = Number(inputs.avgViews) || 0;
    const nftSupply = Number(inputs.nftSupply) || 0;
    const startPrice = Number(inputs.startPrice) || 0;
    const maxPrice = Number(inputs.maxPrice) || 0;

    if (
      followers <= 0 ||
      avgViews <= 0 ||
      nftSupply <= 0 ||
      startPrice <= 0 ||
      maxPrice <= 0 ||
      maxPrice < startPrice
    ) {
      // Basic validation
      setResults(null);
      setChartData([]);
      return;
    }

    // 1) Price increment for each NFT sold
    const totalNFTs = nftSupply;
    let priceIncrement = 0;
    if (totalNFTs > 1) {
      priceIncrement = (maxPrice - startPrice) / (totalNFTs - 1);
    }

    // 2) Sum of prices across entire supply
    let totalRevenue = 0;
    const chartPoints = [];

    for (let i = 0; i < totalNFTs; i++) {
      const currentPrice = startPrice + priceIncrement * i;
      totalRevenue += currentPrice;

      // For chart sampling
      if (totalNFTs <= 50 || i % Math.max(1, Math.floor(totalNFTs / 50)) === 0) {
        chartPoints.push({
          passes: i + 1,
          price: currentPrice,
          revenue: totalRevenue
        });
      }
    }

    // 3) Basic 90/10 split
    const creatorRevenue = totalRevenue * 0.9;
    const platformRevenue = totalRevenue * 0.1;
    const avgPrice = totalRevenue / totalNFTs;

    // 4) Risk Assessment & Recommended Supply
    const riskAssessment = calculateRiskLevel(followers, avgViews, nftSupply);
    const recommendedSupply = calculateRecommendedSupply(followers, avgViews);

    const recommendations = generateRecommendations(
      followers,
      avgViews,
      nftSupply,
      startPrice,
      maxPrice,
      priceIncrement,
      riskAssessment,
      recommendedSupply
    );

    setChartData(chartPoints);
    setResults({
      totalRevenue,
      creatorRevenue,
      platformRevenue,
      avgPrice,
      priceIncrement,
      riskAssessment,
      recommendedSupply,
      recommendations
    });
  };

  // ==========================
  // Handlers
  // ==========================
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  // ==========================
  // Render
  // ==========================
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 max-w-7xl mx-auto mt-16"
    >
      {/* Enhanced Header Section with Icon */}
      <div className="mb-14">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gradient-to-br from-[#fa7517] to-[#ff8c3a] rounded-xl shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#fa7517] via-[#ff8c3a] to-[#fa7517] bg-[length:200%_200%] animate-[gradient_8s_ease_infinite]">
            NFT Content Pass Simulator
          </h1>
        </div>
        <p className="text-gray-400 text-lg">
          Forecast potential revenue and analyze market fit for your NFT Content Pass collection
        </p>
      </div>

      {/* Enhanced Main Content */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm relative overflow-hidden shadow-xl"
        style={{
          boxShadow: '0 10px 30px -15px rgba(250, 117, 23, 0.15)'
        }}
      >
        {/* Disclaimer Alert with Icon */}
        <Alert className="mb-8 bg-[#fa7517]/5 border-[#fa7517]/20">
          <AlertDescription>
            <div className="flex gap-2">
              <Zap className="w-5 h-5 text-[#fa7517] shrink-0 mt-0.5" />
              <p className="text-sm">
                <span className="font-medium text-[#fa7517]">Important:</span> This simulator assumes your entire NFT supply sells out. Actual outcomes depend on
                real user behavior, marketing efforts, and market conditions. Consider adjusting the
                supply if our recommendation suggests it might be too high or low for your average
                engagement.
              </p>
            </div>
          </AlertDescription>
        </Alert>

        {/* Enhanced Input Grid */}
        <div className="space-y-8">
          {/* Channel Metrics with Icons */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-blue-500/20 rounded-lg">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Channel Metrics</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  Total Followers
                </label>
                <Input
                  type="number"
                  name="followers"
                  value={inputs.followers}
                  onChange={handleInputChange}
                  placeholder="Enter your follower count (e.g. 15000)"
                  className="bg-black/50 border-gray-800/50 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-gray-400" />
                  Average Views
                </label>
                <Input
                  type="number"
                  name="avgViews"
                  value={inputs.avgViews}
                  onChange={handleInputChange}
                  placeholder="Average views per video (e.g. 5000)"
                  className="bg-black/50 border-gray-800/50 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* NFT Configuration with Icons */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-[#fa7517]/20 rounded-lg">
                <Ticket className="w-5 h-5 text-[#fa7517]" />
              </div>
              <h3 className="text-lg font-semibold text-white">NFT Configuration</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <BarChart className="w-4 h-4 text-gray-400" />
                  NFT Supply
                </label>
                <Input
                  type="number"
                  name="nftSupply"
                  value={inputs.nftSupply}
                  onChange={handleInputChange}
                  placeholder="Number of passes (e.g. 1000)"
                  className="bg-black/50 border-gray-800/50 focus:border-[#fa7517]/50 focus:ring-[#fa7517]/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  Starting Price ($)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  name="startPrice"
                  value={inputs.startPrice}
                  onChange={handleInputChange}
                  placeholder="First pass price (e.g. 5)"
                  className="bg-black/50 border-gray-800/50 focus:border-[#fa7517]/50 focus:ring-[#fa7517]/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  Max Price ($)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  name="maxPrice"
                  value={inputs.maxPrice}
                  onChange={handleInputChange}
                  placeholder="Last pass price (e.g. 250)"
                  className="bg-black/50 border-gray-800/50 focus:border-[#fa7517]/50 focus:ring-[#fa7517]/20 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Calculate Button */}
        <div className="mt-8">
          <motion.button
            onClick={calculateRevenue}
            whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(250, 117, 23, 0.3)' }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-gradient-to-r from-[#fa7517] to-[#ff8c3a] hover:from-[#ff8c3a] hover:to-[#fa7517] text-black 
                       rounded-lg font-medium text-lg transition-all
                       flex items-center justify-center gap-3 shadow-lg shadow-[#fa7517]/20"
          >
            <Calculator className="w-5 h-5" />
            Calculate Revenue Potential
          </motion.button>
        </div>

        {/* Enhanced Results Section */}
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              type: "spring",
              damping: 30,
              stiffness: 300,
              duration: 0.4,
              ease: [0.22, 1, 0.36, 1]
            }}
            className="mt-12 space-y-8"
          >
            {/* Risk Assessment */}
            <Alert className="border-l-4 overflow-hidden relative" 
                   style={{ borderLeftColor: results.riskAssessment.level === 'Low Risk' ? '#16a34a' : 
                                            results.riskAssessment.level === 'Medium Risk' ? '#ca8a04' : 
                                            results.riskAssessment.level === 'High Risk' ? '#dc2626' : '#6b7280' }}>
              <div className="absolute inset-0 bg-gradient-to-r opacity-10"
                   style={{ 
                     background: results.riskAssessment.level === 'Low Risk' ? 'linear-gradient(90deg, rgba(22, 163, 74, 0.2), transparent)' : 
                               results.riskAssessment.level === 'Medium Risk' ? 'linear-gradient(90deg, rgba(202, 138, 4, 0.2), transparent)' : 
                               results.riskAssessment.level === 'High Risk' ? 'linear-gradient(90deg, rgba(220, 38, 38, 0.2), transparent)' : 
                                                                             'linear-gradient(90deg, rgba(107, 114, 128, 0.2), transparent)'
                   }}></div>
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium text-lg" 
                     style={{ 
                       color: results.riskAssessment.level === 'Low Risk' ? '#16a34a' : 
                              results.riskAssessment.level === 'Medium Risk' ? '#ca8a04' : 
                              results.riskAssessment.level === 'High Risk' ? '#dc2626' : '#6b7280' 
                     }}>
                    <span className="flex items-center gap-2">
                      {results.riskAssessment.level === 'Low Risk' && <Zap className="w-5 h-5" />}
                      {results.riskAssessment.level === 'Medium Risk' && <BarChart2 className="w-5 h-5" />}
                      {results.riskAssessment.level === 'High Risk' && <Zap className="w-5 h-5" />}
                      Risk Level: {results.riskAssessment.level}
                    </span>
                  </p>
                  <p>{results.riskAssessment.description}</p>
                </div>
              </AlertDescription>
            </Alert>

            {/* Recommended Supply - with improved styling */}
            <motion.div
              whileHover={{ boxShadow: '0 0 15px rgba(250, 117, 23, 0.1)' }}
              className="p-6 rounded-xl bg-gradient-to-br from-black/40 to-black/20 border border-gray-800/30 backdrop-blur-sm"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-purple-500/20 rounded-lg">
                  <BarChart className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="font-medium text-lg text-white">Recommended Supply Ranges</h3>
              </div>
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-black/20 border border-purple-500/10">
                    <div className="text-xs text-gray-400 mb-1">Conservative</div>
                    <div className="text-lg font-semibold text-white">{results.recommendedSupply.conservative}</div>
                    <div className="text-xs text-gray-500 mt-1">10% views / 2% followers</div>
                  </div>
                  <div className="p-3 rounded-lg bg-black/20 border border-purple-500/20">
                    <div className="text-xs text-gray-400 mb-1">Moderate</div>
                    <div className="text-lg font-semibold text-purple-400">{results.recommendedSupply.moderate}</div>
                    <div className="text-xs text-gray-500 mt-1">20% views / 5% followers</div>
                  </div>
                  <div className="p-3 rounded-lg bg-black/20 border border-purple-500/10">
                    <div className="text-xs text-gray-400 mb-1">Aggressive</div>
                    <div className="text-lg font-semibold text-white">{results.recommendedSupply.aggressive}</div>
                    <div className="text-xs text-gray-500 mt-1">30% views / 10% followers</div>
                  </div>
                </div>
                <p className="text-sm italic text-gray-400 mt-2">
                  Tip: If your NFT supply exceeds these ranges, it may be difficult to sell out unless your community is exceptionally supportive or the content is highly exclusive.
                </p>
              </div>
            </motion.div>

            {/* Actionable Recommendations */}
            {results.recommendations.length > 0 && (
              <motion.div
                whileHover={{ boxShadow: '0 0 15px rgba(250, 117, 23, 0.1)' }}
                className="p-6 rounded-xl bg-gradient-to-br from-black/40 to-black/20 border border-gray-800/30 backdrop-blur-sm"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-[#fa7517]/20 rounded-lg">
                    <Sparkles className="w-5 h-5 text-[#fa7517]" />
                  </div>
                  <h3 className="font-medium text-lg text-white">Actionable Recommendations</h3>
                </div>
                <div className="space-y-3 mt-4">
                  {results.recommendations.map((rec, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ x: -5, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-start gap-3 p-3 bg-[#fa7517]/5 rounded-lg border border-[#fa7517]/10"
                    >
                      <Zap className="w-4 h-4 text-[#fa7517] mt-1 shrink-0" />
                      <p className="text-gray-300">{rec}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Revenue Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                whileHover={{ boxShadow: '0 0 15px rgba(250, 117, 23, 0.1)' }}
                className="p-6 rounded-xl bg-gradient-to-br from-black/40 to-black/20 border border-gray-800/30 backdrop-blur-sm"
              >
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-1.5 bg-[#fa7517]/20 rounded-lg">
                    <DollarSign className="w-5 h-5 text-[#fa7517]" />
                  </div>
                  <h3 className="font-medium text-lg text-white">Revenue Projections</h3>
                </div>
                <div className="space-y-6">
                  {/* Total Revenue - Primary Focus */}
                  <div className="p-4 rounded-lg bg-black/40 border border-[#fa7517]/20 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#fa7517]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <p className="text-sm text-gray-400 mb-1">Total Revenue</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-[#fa7517] to-[#ff8c3a] text-transparent bg-clip-text">
                      ${results.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                    <div className="h-1 w-full bg-[#fa7517]/10 rounded-full mt-3">
                      <div className="h-1 bg-[#fa7517] rounded-full w-full" />
                    </div>
                  </div>

                  {/* Split Details */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Creator Earnings */}
                    <div className="p-4 rounded-lg bg-black/20 border border-green-500/20 hover:bg-black/30 hover:border-green-500/30 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-400">Creator Share</p>
                        <span className="text-xs font-medium text-green-500">90%</span>
                      </div>
                      <p className="text-xl font-semibold text-green-500">
                        ${results.creatorRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </p>
                    </div>

                    {/* Platform Earnings */}
                    <div className="p-4 rounded-lg bg-black/20 border border-blue-500/20 hover:bg-black/30 hover:border-blue-500/30 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-400">Platform Share</p>
                        <span className="text-xs font-medium text-blue-500">10%</span>
                      </div>
                      <p className="text-xl font-semibold text-blue-500">
                        ${results.platformRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ boxShadow: '0 0 15px rgba(250, 117, 23, 0.1)' }}
                className="p-6 rounded-xl bg-gradient-to-br from-black/40 to-black/20 border border-gray-800/30 backdrop-blur-sm"
              >
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-1.5 bg-purple-500/20 rounded-lg">
                    <PieChart className="w-5 h-5 text-purple-400" />
                  </div>
                  <h3 className="font-medium text-lg text-white">Price Analysis</h3>
                </div>
                <div className="space-y-4">
                  {/* Average Price Card */}
                  <div className="p-4 rounded-lg bg-black/20 border border-purple-500/20 hover:bg-black/30 hover:border-purple-500/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Average Price per Pass</p>
                        <p className="text-2xl font-semibold text-purple-500">
                          ${results.avgPrice.toFixed(2)}
                        </p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                        <span className="text-purple-500 text-xs font-medium">AVG</span>
                      </div>
                    </div>
                  </div>

                  {/* Price Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-black/20 border border-gray-800/20 hover:bg-black/30 hover:border-gray-700/30 transition-colors">
                      <p className="text-sm text-gray-400 mb-1">Starting Price</p>
                      <p className="text-xl font-semibold text-white">
                        ${Number(inputs.startPrice).toFixed(2)}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-black/20 border border-gray-800/20 hover:bg-black/30 hover:border-gray-700/30 transition-colors">
                      <p className="text-sm text-gray-400 mb-1">Final Price</p>
                      <p className="text-xl font-semibold text-white">
                        ${(Number(inputs.startPrice) + results.priceIncrement * (parseInt(inputs.nftSupply, 10) - 1)).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Price Increment Info */}
                  <div className="p-4 rounded-lg bg-black/20 border border-gray-800/20 hover:bg-black/30 hover:border-gray-700/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Price Increment</p>
                        <p className="text-xl font-semibold text-white">
                          ${results.priceIncrement.toFixed(2)}
                          <span className="text-sm text-gray-400 ml-1">per pass</span>
                        </p>
                      </div>
                      <div className="text-xs text-gray-500 italic">
                        Linear increase
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Chart with enhanced styling */}
            <motion.div
              whileHover={{ boxShadow: '0 0 15px rgba(250, 117, 23, 0.1)' }}
              className="h-96 w-full p-6 rounded-xl bg-gradient-to-br from-black/40 to-black/20 border border-gray-800/30 backdrop-blur-sm"
            >
              <div className="flex items-center gap-2 mb-6">
                <div className="p-1.5 bg-blue-500/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="font-medium text-lg text-white">Revenue & Price Curve</h3>
              </div>
              <ResponsiveContainer>
                <LineChart 
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ff8c3a" />
                      <stop offset="100%" stopColor="#fa7517" />
                    </linearGradient>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                      <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="glow" />
                      <feComposite in="SourceGraphic" in2="glow" operator="over" />
                    </filter>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="#374151" 
                    opacity={0.3}
                  />
                  <XAxis
                    dataKey="passes"
                    label={{ 
                      value: 'Passes Sold', 
                      position: 'bottom', 
                      fill: '#9CA3AF',
                      offset: -10
                    }}
                    stroke="#9CA3AF"
                    tickFormatter={(value) => value.toLocaleString()}
                    fontSize={12}
                  />
                  <YAxis
                    yAxisId="left"
                    label={{ 
                      value: 'Revenue ($)', 
                      angle: -90, 
                      position: 'insideLeft', 
                      fill: '#9CA3AF',
                      offset: 10
                    }}
                    stroke="#9CA3AF"
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                    fontSize={12}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    label={{ 
                      value: 'Pass Price ($)', 
                      angle: 90, 
                      position: 'insideRight', 
                      fill: '#9CA3AF',
                      offset: 10
                    }}
                    stroke="#9CA3AF"
                    tickFormatter={(value) => `$${value}`}
                    fontSize={12}
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      padding: '12px'
                    }}
                    labelStyle={{ color: '#9CA3AF', marginBottom: '8px' }}
                    formatter={(value: number, name: string) => [
                      `$${value.toLocaleString(undefined, { 
                        maximumFractionDigits: 2 
                      })}`,
                      name === "Cumulative Revenue" ? "Total Revenue" : "Pass Price"
                    ]}
                    labelFormatter={(label) => `Pass #${label.toLocaleString()}`}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={36}
                    formatter={(value) => (
                      <span className="text-gray-300">
                        {value === "Cumulative Revenue" ? "Total Revenue" : "Pass Price"}
                      </span>
                    )}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stroke="url(#revenueGradient)"
                    strokeWidth={3}
                    name="Cumulative Revenue"
                    dot={false}
                    filter="url(#glow)"
                    activeDot={{ 
                      r: 6, 
                      stroke: '#ff8c3a',
                      strokeWidth: 2,
                      fill: '#1F2937'
                    }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="price"
                    stroke="url(#priceGradient)"
                    strokeWidth={3}
                    name="Pass Price"
                    dot={false}
                    filter="url(#glow)"
                    activeDot={{ 
                      r: 6, 
                      stroke: '#a855f7',
                      strokeWidth: 2,
                      fill: '#1F2937'
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-sm text-gray-400 mt-4 italic border-t border-gray-800/30 pt-4">
                Hover over the chart to see detailed values at each point. The orange line shows total revenue, 
                while the green line shows the price of each pass as they are sold.
              </p>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default NFTSimulator;
