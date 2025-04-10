// src/components/common/CreatorHub/StatsCard.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatsCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  change: number;
  loading?: boolean;
  subtitle?: string;
  className?: string;
  error?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  icon: Icon, 
  title, 
  value, 
  change, 
  loading = false, 
  subtitle, 
  className = '', 
  error
}) => {
  const isPositive = change >= 0;
  const changeColor = isPositive ? 'text-green-500' : 'text-red-500';
  const changeIcon = isPositive ? '↑' : '↓';
  
  // Check if this is a "coming soon" card
  const isComingSoon = value === "Coming Soon";
  const iconClass = isComingSoon ? "text-gray-500" : "text-[#fa7517]";

  // Extract the number from subtitle if it starts with a + or -
  const subtitleMatch = subtitle?.match(/^([+-]\d+)/);
  const hasGrowthIndicator = subtitleMatch !== null;

  return (
    <motion.div 
      className={`bg-black/50 rounded-xl p-6 border border-gray-800/30 ${className}`}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 10 }}
    >
      <div className="flex items-center justify-between mb-4">
        <Icon className={error ? "text-red-500" : iconClass} size={24} />
        {!error && !loading && change !== 0 && (
           <div className={`px-2 py-1 rounded ${isPositive ? 'bg-green-500/20' : 'bg-red-500/20'} ${changeColor}`}>
             {changeIcon} {Math.abs(change)}%
           </div>
        )}
      </div>
      <h3 className="text-gray-400 text-sm mb-1">{title}</h3>
      {loading ? (
        <div className="h-8 bg-gray-700 animate-pulse rounded" />
      ) : error ? (
        <p className="text-red-400 text-sm">{error}</p>
      ) : (
        <>
          <p className={`text-2xl font-bold ${isComingSoon ? 'text-gray-400' : 'text-white'}`}>{value}</p>
          {subtitle && (
            <p className="text-sm mt-1">
              {hasGrowthIndicator ? (
                <>
                  <span className={changeColor}>{subtitleMatch![0]}</span>
                  <span className="text-gray-500">{subtitle.slice(subtitleMatch![0].length)}</span>
                </>
              ) : (
                <span className="text-gray-500">{subtitle}</span>
              )}
            </p>
          )}
        </>
      )}
    </motion.div>
  );
};

export default StatsCard;