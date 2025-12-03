// src/components/pages/CTREngine/components/NicheSelector.tsx
// Premium niche selection component

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Gamepad2, Monitor, DollarSign, Dumbbell, ChefHat, Video, BookOpen, Newspaper, Film, Music, Brush, Plane } from 'lucide-react';
import { NicheOption } from '../../../../types/ctr';

interface NicheSelectorProps {
  niches: NicheOption[];
  selectedNiche: string | null;
  onSelect: (nicheId: string | null) => void;
  isLoading?: boolean;
  variant?: 'pills' | 'dropdown';
  className?: string;
}

// Niche icons mapping with Lucide icons
const nicheIcons: Record<string, { icon: React.ElementType; emoji: string }> = {
  gaming: { icon: Gamepad2, emoji: '🎮' },
  tech: { icon: Monitor, emoji: '💻' },
  finance: { icon: DollarSign, emoji: '💰' },
  fitness: { icon: Dumbbell, emoji: '💪' },
  cooking: { icon: ChefHat, emoji: '🍳' },
  vlog: { icon: Video, emoji: '📹' },
  education: { icon: BookOpen, emoji: '📚' },
  news: { icon: Newspaper, emoji: '📰' },
  entertainment: { icon: Film, emoji: '🎬' },
  music: { icon: Music, emoji: '🎵' },
  beauty: { icon: Brush, emoji: '💄' },
  travel: { icon: Plane, emoji: '✈️' },
  auto: { icon: Sparkles, emoji: '✨' },
};

export const NicheSelector: React.FC<NicheSelectorProps> = ({
  niches,
  selectedNiche,
  onSelect,
  isLoading = false,
  variant = 'pills',
  className = '',
}) => {
  // Add auto-detect option
  const allOptions = [
    { id: 'auto', name: 'Auto-detect', description: 'Let AI detect the best niche' },
    ...niches,
  ];

  if (variant === 'dropdown') {
    return (
      <div className={className}>
        <select
          value={selectedNiche || 'auto'}
          onChange={(e) => onSelect(e.target.value === 'auto' ? null : e.target.value)}
          disabled={isLoading}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white 
                     focus:outline-none focus:ring-2 focus:ring-[#fa7517]/50 focus:border-[#fa7517]/50
                     disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
        >
          {allOptions.map((niche) => (
            <option key={niche.id} value={niche.id} className="bg-[#111114] text-white">
              {nicheIcons[niche.id]?.emoji || '📁'} {niche.name}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {allOptions.map((niche, index) => {
        const isSelected = niche.id === 'auto' 
          ? selectedNiche === null 
          : selectedNiche === niche.id;
        const IconComponent = nicheIcons[niche.id]?.icon || Sparkles;
        
        return (
          <motion.button
            key={niche.id}
            type="button"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03 }}
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(niche.id === 'auto' ? null : niche.id)}
            disabled={isLoading}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                       flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed
                       ${isSelected
                         ? 'bg-gradient-to-r from-[#fa7517] to-orange-500 text-white shadow-lg shadow-[#fa7517]/25 border border-[#fa7517]/50'
                         : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10 hover:border-white/20'
                       }`}
          >
            <IconComponent className="w-4 h-4" />
            <span>{niche.name}</span>
          </motion.button>
        );
      })}
    </div>
  );
};

// Detected niche display badge
export const NicheBadge: React.FC<{
  niche: string;
  className?: string;
}> = ({ niche, className = '' }) => {
  const nicheData = nicheIcons[niche.toLowerCase()];
  const IconComponent = nicheData?.icon || Sparkles;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg backdrop-blur-sm
                     bg-white/10 border border-white/20 text-white text-sm font-medium ${className}`}>
      <IconComponent className="w-3.5 h-3.5 text-[#fa7517]" />
      <span className="capitalize">{niche}</span>
    </span>
  );
};

export default NicheSelector;
