// src/components/pages/CTREngine/components/ScoreGauge.tsx
// Premium visual score indicator component

import React from 'react';
import { motion } from 'framer-motion';
import { getScoreColor, getScoreLabel } from '../../../../api/ctr';

interface ScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { width: 80, strokeWidth: 6, fontSize: 'text-lg', labelSize: 'text-xs' },
  md: { width: 120, strokeWidth: 8, fontSize: 'text-2xl', labelSize: 'text-sm' },
  lg: { width: 160, strokeWidth: 10, fontSize: 'text-4xl', labelSize: 'text-sm' },
};

// Premium color scheme matching ThumbnailLanding
const colorClasses = {
  green: {
    stroke: 'stroke-emerald-500',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/20',
    glow: 'drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]',
    border: 'border-emerald-500/30',
  },
  yellow: {
    stroke: 'stroke-[#fa7517]',
    text: 'text-[#fa7517]',
    bg: 'bg-[#fa7517]/20',
    glow: 'drop-shadow-[0_0_12px_rgba(250,117,23,0.5)]',
    border: 'border-[#fa7517]/30',
  },
  orange: {
    stroke: 'stroke-orange-500',
    text: 'text-orange-400',
    bg: 'bg-orange-500/20',
    glow: 'drop-shadow-[0_0_12px_rgba(249,115,22,0.5)]',
    border: 'border-orange-500/30',
  },
  red: {
    stroke: 'stroke-red-500',
    text: 'text-red-400',
    bg: 'bg-red-500/20',
    glow: 'drop-shadow-[0_0_12px_rgba(239,68,68,0.4)]',
    border: 'border-red-500/30',
  },
};

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  size = 'md',
  showLabel = true,
  animated = true,
  className = '',
}) => {
  const config = sizeConfig[size];
  const color = getScoreColor(score);
  const label = getScoreLabel(score);
  const colors = colorClasses[color];
  
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = (score / 10) * circumference;
  const offset = circumference - progress;
  
  const center = config.width / 2;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div 
        className={`relative ${colors.glow}`} 
        style={{ width: config.width, height: config.width }}
      >
        {/* Background glow effect */}
        <div 
          className="absolute inset-0 rounded-full opacity-30 blur-xl"
          style={{ 
            background: color === 'green' 
              ? 'radial-gradient(circle, rgba(16,185,129,0.4) 0%, transparent 70%)'
              : color === 'yellow' || color === 'orange'
              ? 'radial-gradient(circle, rgba(250,117,23,0.4) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(239,68,68,0.3) 0%, transparent 70%)'
          }} 
        />
        
        {/* Background circle */}
        <svg
          width={config.width}
          height={config.width}
          className="transform -rotate-90"
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={config.strokeWidth}
            className="stroke-white/10"
          />
          {/* Progress circle */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            className={colors.stroke}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: animated ? circumference : offset }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: animated ? 1.2 : 0, ease: 'easeOut' }}
          />
        </svg>
        
        {/* Score text in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={`font-bold ${config.fontSize} ${colors.text}`}
            initial={{ opacity: animated ? 0 : 1, scale: animated ? 0.8 : 1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: animated ? 0.5 : 0, duration: 0.3 }}
          >
            {score.toFixed(1)}
          </motion.span>
          <span className="text-xs text-gray-500">/10</span>
        </div>
      </div>
      
      {showLabel && (
        <motion.span
          className={`mt-3 ${config.labelSize} font-semibold ${colors.text}`}
          initial={{ opacity: animated ? 0 : 1, y: animated ? 10 : 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: animated ? 0.8 : 0 }}
        >
          {label}
        </motion.span>
      )}
    </div>
  );
};

// Compact inline score display
export const ScoreBadge: React.FC<{
  score: number;
  className?: string;
}> = ({ score, className = '' }) => {
  const color = getScoreColor(score);
  const colors = colorClasses[color];
  
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg backdrop-blur-sm border ${colors.bg} ${colors.text} ${colors.border} text-sm font-semibold ${className}`}
    >
      <span className="font-bold">{score.toFixed(1)}</span>
      <span className="text-xs opacity-70">/10</span>
    </span>
  );
};

export default ScoreGauge;
