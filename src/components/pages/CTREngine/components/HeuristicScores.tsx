// src/components/pages/CTREngine/components/HeuristicScores.tsx
// Premium detailed heuristic breakdown display

import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Sun, Palette, Layout, Type, Smile, Heart, BarChart3 } from 'lucide-react';
import { ThumbnailHeuristics } from '../../../../types/ctr';

interface HeuristicScoresProps {
  heuristics: ThumbnailHeuristics;
  className?: string;
}

interface HeuristicItemProps {
  label: string;
  value: number | boolean | string | null;
  type: 'score' | 'boolean' | 'text';
  icon: React.ReactNode;
  index: number;
}

const HeuristicItem: React.FC<HeuristicItemProps> = ({ label, value, type, icon, index }) => {
  const renderValue = () => {
    if (type === 'boolean') {
      return (
        <span className={`flex items-center gap-1.5 text-sm font-medium ${value ? 'text-emerald-400' : 'text-gray-500'}`}>
          {value ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Detected
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-gray-600" />
              Not found
            </>
          )}
        </span>
      );
    }
    
    if (type === 'text') {
      return (
        <span className={`text-sm font-medium ${value ? 'text-white' : 'text-gray-500'}`}>
          {value || 'None'}
        </span>
      );
    }
    
    // Score type
    const numValue = typeof value === 'number' ? value : 0;
    const percentage = numValue * 10;
    const color = numValue >= 7 ? 'emerald' : numValue >= 5 ? 'orange' : 'red';
    
    return (
      <div className="flex items-center gap-3 flex-1">
        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              color === 'emerald' ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
              color === 'orange' ? 'bg-gradient-to-r from-[#fa7517] to-orange-400' :
              'bg-gradient-to-r from-red-500 to-red-400'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ delay: index * 0.05, duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <span className={`text-sm font-bold min-w-[2.5rem] text-right ${
          color === 'emerald' ? 'text-emerald-400' :
          color === 'orange' ? 'text-[#fa7517]' :
          'text-red-400'
        }`}>
          {numValue.toFixed(1)}
        </span>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0"
    >
      <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400">
        {icon}
      </span>
      <span className="text-gray-300 text-sm font-medium min-w-[140px]">{label}</span>
      {renderValue()}
    </motion.div>
  );
};

export const HeuristicScores: React.FC<HeuristicScoresProps> = ({
  heuristics,
  className = '',
}) => {
  const items = [
    {
      label: 'Mobile Readability',
      value: heuristics.mobileReadability,
      type: 'score' as const,
      icon: <Smartphone className="w-4 h-4" />,
    },
    {
      label: 'Color Contrast',
      value: heuristics.colorContrast,
      type: 'score' as const,
      icon: <Sun className="w-4 h-4" />,
    },
    {
      label: 'Composition',
      value: heuristics.compositionScore,
      type: 'score' as const,
      icon: <Layout className="w-4 h-4" />,
    },
    {
      label: 'Brightness',
      value: heuristics.brightness,
      type: 'score' as const,
      icon: <Sun className="w-4 h-4" />,
    },
    {
      label: 'Colorfulness',
      value: heuristics.colorfulness,
      type: 'score' as const,
      icon: <Palette className="w-4 h-4" />,
    },
    {
      label: 'Face Present',
      value: heuristics.facePresence,
      type: 'boolean' as const,
      icon: <Smile className="w-4 h-4" />,
    },
    {
      label: 'Face Emotion',
      value: heuristics.faceEmotion,
      type: 'text' as const,
      icon: <Heart className="w-4 h-4" />,
    },
    {
      label: 'Text Overlay',
      value: heuristics.textOverlay,
      type: 'boolean' as const,
      icon: <Type className="w-4 h-4" />,
    },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={`bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm ${className}`}
    >
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#fa7517]/20 to-orange-500/20 flex items-center justify-center border border-[#fa7517]/30">
          <BarChart3 className="w-4 h-4 text-[#fa7517]" />
        </div>
        Detailed Metrics
      </h3>
      <div className="space-y-0">
        {items.map((item, index) => (
          <HeuristicItem key={item.label} {...item} index={index} />
        ))}
      </div>
    </motion.div>
  );
};

export default HeuristicScores;
