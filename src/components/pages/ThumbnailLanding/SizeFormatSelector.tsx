import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Star, Zap, Smartphone, Monitor, Square } from 'lucide-react';

interface SizeFormat {
  id: string;
  label: string;
  size: string;
  dimensions: string;
  aspectRatio: string;
  icon: React.ReactNode;
  recommended?: boolean;
  popular?: boolean;
  description: string;
}

interface SizeFormatSelectorProps {
  selectedFormat: string;
  onFormatChange: (format: string) => void;
}

const sizeFormats: SizeFormat[] = [
  {
    id: '1536x1024',
    label: 'Landscape',
    size: '1536x1024',
    dimensions: '1536×1024',
    aspectRatio: '3:2',
    icon: <Monitor className="w-5 h-5" />,
    recommended: true,
    popular: true,
    description: 'Perfect for YouTube thumbnails & video covers'
  },
  {
    id: '1024x1536',
    label: 'Portrait',
    size: '1024x1536',
    dimensions: '1024×1536',
    aspectRatio: '2:3',
    icon: <Smartphone className="w-5 h-5" />,
    description: 'Ideal for mobile stories & vertical content'
  },
  {
    id: '1024x1024',
    label: 'Square',
    size: '1024x1024',
    dimensions: '1024×1024',
    aspectRatio: '1:1',
    icon: <Square className="w-5 h-5" />,
    description: 'Perfect for social media posts & avatars'
  },
  {
    id: 'auto',
    label: 'Auto',
    size: 'auto',
    dimensions: 'AI Decides',
    aspectRatio: 'Auto',
    icon: <Zap className="w-5 h-5" />,
    recommended: false,
    description: 'Let AI choose the best format'
  }
];

export const SizeFormatSelector: React.FC<SizeFormatSelectorProps> = ({
  selectedFormat,
  onFormatChange
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold text-white">Choose Format</h3>
        <div className="flex items-center gap-1 text-sm text-gray-400">
          <Star className="w-4 h-4" />
          <span>Select the perfect size for your platform</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {sizeFormats.map((format) => (
          <motion.button
            key={format.id}
            onClick={() => onFormatChange(format.size)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              relative p-4 rounded-xl border-2 transition-all duration-300 group
              ${selectedFormat === format.size
                ? 'border-[#fa7517] bg-[#fa7517]/10 shadow-lg shadow-[#fa7517]/20'
                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
              }
            `}
          >
            {/* Badges - Positioned at corner */}
            <div className="absolute -top-2 -right-2 flex flex-col gap-1">
              {format.recommended && (
                <div className="bg-[#fa7517] text-black text-xs px-2 py-0.5 rounded-full font-medium shadow-lg">
                  Recommended
                </div>
              )}
              {format.popular && (
                <div className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium shadow-lg">
                  Popular
                </div>
              )}
            </div>

            {/* Visual Aspect Ratio Preview */}
            <div className="mb-3 flex items-center justify-center h-12">
              <div className="relative">
                {/* Dynamic aspect ratio visualization */}
                <div 
                  className={`
                    bg-gradient-to-br from-[#fa7517]/40 to-orange-400/40 rounded border-2 border-[#fa7517]/60
                    ${format.aspectRatio === '3:2' ? 'w-12 h-8' : ''}
                    ${format.aspectRatio === '2:3' ? 'w-8 h-12' : ''}
                    ${format.aspectRatio === '1:1' ? 'w-10 h-10' : ''}
                    ${format.aspectRatio === 'Auto' ? 'w-10 h-8' : ''}
                  `}
                />
                
                {/* Platform icon overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white/80">
                    {format.icon}
                  </div>
                </div>
              </div>
            </div>

            {/* Format Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 justify-center">
                <h4 className="font-semibold text-white">{format.label}</h4>
              </div>
              
              <div className="text-xs text-gray-400">
                <div>{format.dimensions}</div>
                <div className="opacity-75">{format.aspectRatio}</div>
              </div>
              
              <p className="text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
                {format.description}
              </p>
            </div>

            {/* Selection Indicator */}
            {selectedFormat === format.size && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute -top-2 -right-2 bg-[#fa7517] rounded-full p-1 shadow-lg"
              >
                <CheckCircle className="w-4 h-4 text-white" />
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Selected Format Info */}
      {selectedFormat && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#fa7517]/10 border border-[#fa7517]/30 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-[#fa7517]" />
            <div>
              <p className="text-white font-medium">
                Selected: {sizeFormats.find(f => f.size === selectedFormat)?.label}
              </p>
              <p className="text-gray-400 text-sm">
                {sizeFormats.find(f => f.size === selectedFormat)?.description}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}; 