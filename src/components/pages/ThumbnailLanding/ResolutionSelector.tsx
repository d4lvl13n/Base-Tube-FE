import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Sparkles, Crown } from 'lucide-react';

export type Resolution = '1K' | '2K' | '4K';

interface ResolutionOption {
  value: Resolution;
  label: string;
  description: string;
  icon: React.ReactNode;
  premium?: boolean;
  speed: 'Fast' | 'Balanced' | 'Slow';
}

interface ResolutionSelectorProps {
  selectedResolution: Resolution;
  onResolutionChange: (resolution: Resolution) => void;
  disabled?: boolean;
  isPremiumUser?: boolean;
}

const resolutions: ResolutionOption[] = [
  {
    value: '1K',
    label: '1K',
    description: '~1024px • Fast',
    icon: <Zap className="w-4 h-4" />,
    speed: 'Fast',
  },
  {
    value: '2K',
    label: '2K',
    description: '~2048px • Balanced',
    icon: <Sparkles className="w-4 h-4" />,
    speed: 'Balanced',
  },
  {
    value: '4K',
    label: '4K',
    description: '~4096px • Premium',
    icon: <Crown className="w-4 h-4" />,
    premium: true,
    speed: 'Slow',
  },
];

export const ResolutionSelector: React.FC<ResolutionSelectorProps> = ({
  selectedResolution,
  onResolutionChange,
  disabled = false,
  isPremiumUser = false,
}) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-white">Resolution</h3>

      <div className="flex gap-2">
        {resolutions.map((res) => {
          const isSelected = selectedResolution === res.value;
          const isLocked = res.premium && !isPremiumUser;
          const canSelect = !disabled && !isLocked;
          
          return (
            <motion.button
              key={res.value}
              type="button"
              onClick={() => canSelect && onResolutionChange(res.value)}
              disabled={!canSelect}
              whileHover={{ scale: canSelect ? 1.02 : 1 }}
              whileTap={{ scale: canSelect ? 0.98 : 1 }}
              className={`
                relative flex-1 py-3 px-4 rounded-xl border-2 transition-all duration-200
                ${isSelected
                  ? 'border-[#fa7517] bg-gradient-to-r from-[#fa7517] to-orange-500 text-white shadow-lg shadow-[#fa7517]/25'
                  : isLocked
                    ? 'border-purple-500/30 bg-purple-500/10 text-purple-300 cursor-not-allowed'
                    : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:bg-white/10 hover:text-white'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {/* Premium Badge */}
              {res.premium && !isPremiumUser && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-lg flex items-center gap-1">
                  <Crown className="w-2.5 h-2.5" />
                  PRO
                </div>
              )}

              <div className="flex flex-col items-center gap-1">
                <div className={`${isSelected ? 'text-white' : ''}`}>
                  {res.icon}
                </div>
                <span className="font-bold text-sm">{res.label}</span>
                <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                  {res.speed}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Speed Indicator */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Zap className="w-3 h-3 text-green-400" />
          Faster
        </span>
        <div className="flex-1 mx-3 h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ 
              width: selectedResolution === '1K' ? '33%' : 
                     selectedResolution === '2K' ? '66%' : '100%' 
            }}
            className={`h-full rounded-full ${
              selectedResolution === '4K' 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                : 'bg-gradient-to-r from-green-500 to-[#fa7517]'
            }`}
          />
        </div>
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-purple-400" />
          Higher Quality
        </span>
      </div>
    </div>
  );
};

export default ResolutionSelector;

