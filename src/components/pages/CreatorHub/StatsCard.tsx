// src/components/common/CreatorHub/StatsCard.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

interface StatsCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  /**
   * A REAL period-over-period percentage, or omitted for no badge at all.
   * Never pass a placeholder: a card with no trend must render no badge rather
   * than a decorative one (docs/ANALYTICS_REVIEW_2026-08-29.md findings 1, 6, 7).
   * Non-finite values (Infinity/NaN) are dropped defensively.
   */
  change?: number | null;
  loading?: boolean;
  subtitle?: string;
  className?: string;
  error?: string;
  /**
   * Optional second caption in small print: what the number includes or
   * leaves out ("Includes your own replies", "Measured accurately since …").
   */
  note?: string;
  /** The value is a short sentence ("Too few views for a rate"), not a number: smaller and grey. */
  valueMuted?: boolean;
  /** Optional last line under the note: a link to the people behind the number ("See who"). */
  footer?: React.ReactNode;
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  icon: Icon, 
  title, 
  value, 
  change, 
  loading = false, 
  subtitle, 
  className = '', 
  error,
  note,
  valueMuted = false,
  footer
}) => {
  const reduceMotion = useReducedMotion();
  const changeValue =
    typeof change === 'number' && Number.isFinite(change) && change !== 0 ? change : null;
  const isPositive = (changeValue ?? 0) >= 0;
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
      whileHover={reduceMotion ? undefined : { scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 10 }}
    >
      <div className="flex items-center justify-between mb-4">
        <Icon className={error ? "text-red-500" : iconClass} size={24} />
        {!error && !loading && changeValue !== null && (
           <div className={`px-2 py-1 rounded ${isPositive ? 'bg-green-500/20' : 'bg-red-500/20'} ${changeColor}`}>
             {changeIcon} {Math.abs(changeValue)}%
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
          <p className={valueMuted ? 'text-base font-medium text-gray-300' : `text-2xl font-bold ${isComingSoon ? 'text-gray-400' : 'text-white'}`}>{value}</p>
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
          {note && <p className="text-xs text-gray-500/80 mt-1">{note}</p>}
          {footer && <div className="text-sm mt-2">{footer}</div>}
        </>
      )}
    </motion.div>
  );
};

export default StatsCard;