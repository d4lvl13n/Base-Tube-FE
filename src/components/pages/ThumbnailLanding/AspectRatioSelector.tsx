import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  Star, 
  Monitor, 
  Smartphone, 
  Square,
  Film,
  Tv,
  Image as ImageIcon
} from 'lucide-react';

// Gemini 3 Pro aspect ratios
export type AspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9';

interface AspectRatioOption {
  value: AspectRatio;
  label: string;
  description: string;
  icon: React.ReactNode;
  recommended?: boolean;
  platforms?: string[];
}

interface AspectRatioSelectorProps {
  selectedRatio: AspectRatio;
  onRatioChange: (ratio: AspectRatio) => void;
  disabled?: boolean;
}

const aspectRatios: AspectRatioOption[] = [
  {
    value: '16:9',
    label: '16:9',
    description: 'YouTube Thumbnails',
    icon: <Monitor className="w-4 h-4" />,
    recommended: true,
    platforms: ['YouTube', 'Desktop'],
  },
  {
    value: '9:16',
    label: '9:16',
    description: 'Shorts & TikTok',
    icon: <Smartphone className="w-4 h-4" />,
    platforms: ['Shorts', 'TikTok', 'Reels'],
  },
  {
    value: '1:1',
    label: '1:1',
    description: 'Square',
    icon: <Square className="w-4 h-4" />,
    platforms: ['Instagram', 'Social'],
  },
  {
    value: '4:3',
    label: '4:3',
    description: 'Classic',
    icon: <Tv className="w-4 h-4" />,
    platforms: ['Presentations'],
  },
  {
    value: '3:2',
    label: '3:2',
    description: 'Photo',
    icon: <ImageIcon className="w-4 h-4" />,
    platforms: ['Photography'],
  },
  {
    value: '21:9',
    label: '21:9',
    description: 'Cinematic',
    icon: <Film className="w-4 h-4" />,
    platforms: ['Widescreen', 'Cinema'],
  },
];

// Visualization dimensions for each ratio (scaled to fit in a 48x32 box)
const getVisualizationDimensions = (ratio: AspectRatio): { width: number; height: number } => {
  switch (ratio) {
    case '16:9': return { width: 48, height: 27 };
    case '9:16': return { width: 18, height: 32 };
    case '1:1': return { width: 32, height: 32 };
    case '4:3': return { width: 40, height: 30 };
    case '3:4': return { width: 24, height: 32 };
    case '3:2': return { width: 45, height: 30 };
    case '2:3': return { width: 21, height: 32 };
    case '4:5': return { width: 26, height: 32 };
    case '5:4': return { width: 40, height: 32 };
    case '21:9': return { width: 48, height: 20 };
    default: return { width: 40, height: 30 };
  }
};

export const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({
  selectedRatio,
  onRatioChange,
  disabled = false,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-white">Aspect Ratio</h3>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Star className="w-3 h-3" />
          <span>Gemini 3 Pro</span>
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {aspectRatios.map((ratio) => {
          const dims = getVisualizationDimensions(ratio.value);
          const isSelected = selectedRatio === ratio.value;
          
          return (
            <motion.button
              key={ratio.value}
              type="button"
              onClick={() => !disabled && onRatioChange(ratio.value)}
              disabled={disabled}
              whileHover={{ scale: disabled ? 1 : 1.03 }}
              whileTap={{ scale: disabled ? 1 : 0.97 }}
              className={`
                relative p-3 rounded-xl border-2 transition-all duration-200 group
                ${isSelected
                  ? 'border-[#fa7517] bg-[#fa7517]/10 shadow-lg shadow-[#fa7517]/20'
                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {/* Recommended Badge */}
              {ratio.recommended && (
                <div className="absolute -top-2 -right-2 bg-[#fa7517] text-black text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-lg">
                  ★
                </div>
              )}

              {/* Visual Preview */}
              <div className="flex items-center justify-center h-10 mb-2">
                <div
                  style={{ width: dims.width * 0.7, height: dims.height * 0.7 }}
                  className={`
                    rounded border-2 transition-all
                    ${isSelected 
                      ? 'border-[#fa7517] bg-gradient-to-br from-[#fa7517]/30 to-orange-500/30' 
                      : 'border-white/30 bg-white/5 group-hover:border-white/50'
                    }
                  `}
                />
              </div>

              {/* Label */}
              <div className="text-center">
                <p className={`text-sm font-semibold ${isSelected ? 'text-[#fa7517]' : 'text-white'}`}>
                  {ratio.label}
                </p>
                <p className="text-[10px] text-gray-500 truncate">
                  {ratio.description}
                </p>
              </div>

              {/* Selection Check */}
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute -top-1.5 -left-1.5 bg-[#fa7517] rounded-full p-0.5 shadow-lg"
                >
                  <CheckCircle className="w-3 h-3 text-white" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Selected Info */}
      {selectedRatio && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-xs text-gray-500"
        >
          <span>Selected:</span>
          <span className="text-white font-medium">{selectedRatio}</span>
          <span>•</span>
          <span>{aspectRatios.find(r => r.value === selectedRatio)?.description}</span>
        </motion.div>
      )}
    </div>
  );
};

export default AspectRatioSelector;

