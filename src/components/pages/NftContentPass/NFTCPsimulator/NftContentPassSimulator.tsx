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
  const calculateRiskLevel = (avgViews: number, nftSupply: number): RiskAssessment => {
    if (avgViews <= 0) {
      return {
        level: 'Undefined',
        description: 'No views entered, cannot assess risk.',
        color: 'text-gray-600'
      };
    }

    const supplyToViewsRatio = (nftSupply / avgViews) * 100;

    if (supplyToViewsRatio <= 20) {
      return {
        level: 'Low Risk',
        description: 'Supply is well within engagement capacity. High confidence in sellout.',
        color: 'text-green-600'
      };
    } else if (supplyToViewsRatio <= 50) {
      return {
        level: 'Medium Risk',
        description: 'Supply is moderate relative to engagement. Consider monitoring sales pace.',
        color: 'text-yellow-600'
      };
    } else {
      return {
        level: 'High Risk',
        description: 'Supply may be too high for current engagement levels. Consider reducing supply or improving marketing.',
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
  const calculateRecommendedSupply = (avgViews: number): RecommendedSupply => {
    // Use Math.floor for whole number pass counts
    return {
      conservative: Math.floor(avgViews * 0.1),
      moderate: Math.floor(avgViews * 0.2),
      aggressive: Math.floor(avgViews * 0.3)
    };
  };

  /**
   * Linear bonding curve revenue calculation, assuming the entire supply sells out.
   */
  const calculateRevenue = () => {
    const followers = parseInt(inputs.followers, 10) || 0;
    const avgViews = parseInt(inputs.avgViews, 10) || 0;
    const nftSupply = parseInt(inputs.nftSupply, 10) || 0;
    const startPrice = parseFloat(inputs.startPrice) || 0;
    const maxPrice = parseFloat(inputs.maxPrice) || 0;

    if (followers <= 0 || avgViews <= 0 || nftSupply <= 0 || startPrice <= 0 || maxPrice <= 0) {
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
    const riskAssessment = calculateRiskLevel(avgViews, nftSupply);
    const recommendedSupply = calculateRecommendedSupply(avgViews);

    setChartData(chartPoints);
    setResults({
      totalRevenue,
      creatorRevenue,
      platformRevenue,
      avgPrice,
      priceIncrement,
      riskAssessment,
      recommendedSupply
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
      {/* Header Section */}
      <div className="mb-14">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#fa7517] to-orange-400 mb-20">
          NFT Content Pass Simulator
        </h1>
        <p className="text-gray-400 text-lg">
          Estimate the potential revenue from a fully sold-out NFT Content Pass collection
        </p>
      </div>

      {/* Main Content */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm relative overflow-hidden"
      >
        {/* Disclaimer Alert */}
        <Alert className="mb-8">
          <AlertDescription>
            <p className="text-sm italic">
              This simulator assumes your entire NFT supply sells out. Actual outcomes depend on
              real user behavior, marketing efforts, and market conditions. Consider adjusting the
              supply if our recommendation suggests it might be too high or low for your average
              engagement.
            </p>
          </AlertDescription>
        </Alert>

        {/* Input Grid */}
        <div className="space-y-8">
          {/* Channel Metrics */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Channel Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Total Followers</label>
                <Input
                  type="number"
                  name="followers"
                  value={inputs.followers}
                  onChange={handleInputChange}
                  placeholder="e.g. 15000"
                  className="bg-black/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Average Views</label>
                <Input
                  type="number"
                  name="avgViews"
                  value={inputs.avgViews}
                  onChange={handleInputChange}
                  placeholder="e.g. 5000"
                  className="bg-black/50"
                />
              </div>
            </div>
          </div>

          {/* NFT Configuration */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">NFT Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">NFT Supply</label>
                <Input
                  type="number"
                  name="nftSupply"
                  value={inputs.nftSupply}
                  onChange={handleInputChange}
                  placeholder="e.g. 5000"
                  className="bg-black/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Starting Price ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  name="startPrice"
                  value={inputs.startPrice}
                  onChange={handleInputChange}
                  placeholder="e.g. 5"
                  className="bg-black/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Max Price ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  name="maxPrice"
                  value={inputs.maxPrice}
                  onChange={handleInputChange}
                  placeholder="e.g. 250"
                  className="bg-black/50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Calculate Button */}
        <div className="mt-8">
          <Button
            onClick={calculateRevenue}
            className="w-full bg-[#fa7517] hover:bg-[#fa7517]/90 text-white"
          >
            Calculate Revenue Potential
          </Button>
        </div>

        {/* Results Section */}
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 space-y-8"
          >
            {/* Risk Assessment */}
            <Alert className={`border-l-4 border-l-${results.riskAssessment.color}`}>
              <AlertDescription>
                <div className="space-y-2">
                  <p className={`font-medium ${results.riskAssessment.color}`}>
                    Risk Level: {results.riskAssessment.level}
                  </p>
                  <p>{results.riskAssessment.description}</p>
                </div>
              </AlertDescription>
            </Alert>

            {/* Recommended Supply */}
            <div className="p-6 rounded-xl bg-black/30 border border-gray-800/30">
              <h3 className="font-medium text-lg text-white mb-4">Recommended Supply Ranges</h3>
              <div className="space-y-3 text-gray-300">
                <p>
                  Conservative (10% of avg views):{' '}
                  <span className="text-white font-semibold">{results.recommendedSupply.conservative}</span>
                </p>
                <p>
                  Moderate (20% of avg views):{' '}
                  <span className="text-white font-semibold">{results.recommendedSupply.moderate}</span>
                </p>
                <p>
                  Aggressive (30% of avg views):{' '}
                  <span className="text-white font-semibold">{results.recommendedSupply.aggressive}</span>
                </p>
                <p className="text-sm italic text-gray-400 mt-2">
                  Tip: If your NFT supply exceeds these ranges, it may be difficult to sell out 
                  unless your community is exceptionally supportive or the content is highly exclusive.
                </p>
              </div>
            </div>

            {/* Revenue Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl bg-black/30 border border-gray-800/30">
                <h3 className="font-medium text-lg text-white mb-6">Revenue Projections</h3>
                <div className="space-y-6">
                  {/* Total Revenue - Primary Focus */}
                  <div className="p-4 rounded-lg bg-black/40 border border-[#fa7517]/20">
                    <p className="text-sm text-gray-400 mb-1">Total Revenue</p>
                    <p className="text-3xl font-bold text-[#fa7517]">
                      ${results.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                    <div className="h-1 w-full bg-[#fa7517]/10 rounded-full mt-3">
                      <div className="h-1 bg-[#fa7517] rounded-full w-full" />
                    </div>
                  </div>

                  {/* Split Details */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Creator Earnings */}
                    <div className="p-4 rounded-lg bg-black/20 border border-green-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-400">Creator Share</p>
                        <span className="text-xs font-medium text-green-500">90%</span>
                      </div>
                      <p className="text-xl font-semibold text-green-500">
                        ${results.creatorRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </p>
                    </div>

                    {/* Platform Earnings */}
                    <div className="p-4 rounded-lg bg-black/20 border border-blue-500/20">
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
              </div>

              <div className="p-6 rounded-xl bg-black/30 border border-gray-800/30">
                <h3 className="font-medium text-lg text-white mb-6">Price Analysis</h3>
                <div className="space-y-4">
                  {/* Average Price Card */}
                  <div className="p-4 rounded-lg bg-black/20 border border-purple-500/20">
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
                    <div className="p-4 rounded-lg bg-black/20 border border-gray-800/20">
                      <p className="text-sm text-gray-400 mb-1">Starting Price</p>
                      <p className="text-xl font-semibold text-white">
                        ${parseFloat(inputs.startPrice).toFixed(2)}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-black/20 border border-gray-800/20">
                      <p className="text-sm text-gray-400 mb-1">Final Price</p>
                      <p className="text-xl font-semibold text-white">
                        ${(parseFloat(inputs.startPrice) + results.priceIncrement * (parseInt(inputs.nftSupply, 10) - 1)).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Price Increment Info */}
                  <div className="p-4 rounded-lg bg-black/20 border border-gray-800/20">
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
              </div>
            </div>

            {/* Chart */}
            <div className="h-96 w-full p-6 rounded-xl bg-black/30 border border-gray-800/30">
              <h3 className="font-medium text-lg text-white mb-6">Revenue & Price Curve</h3>
              <ResponsiveContainer>
                <LineChart 
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
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
                    stroke="#fa7517"
                    strokeWidth={2}
                    name="Cumulative Revenue"
                    dot={false}
                    activeDot={{ 
                      r: 6, 
                      stroke: '#fa7517',
                      strokeWidth: 2,
                      fill: '#1F2937'
                    }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="price"
                    stroke="#10B981"
                    strokeWidth={2}
                    name="Pass Price"
                    dot={false}
                    activeDot={{ 
                      r: 6, 
                      stroke: '#10B981',
                      strokeWidth: 2,
                      fill: '#1F2937'
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-sm text-gray-400 mt-4 italic">
                Hover over the chart to see detailed values at each point. The orange line shows total revenue, 
                while the green line shows the price of each pass as they are sold.
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default NFTSimulator;
