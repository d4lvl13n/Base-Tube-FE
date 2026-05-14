import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Monitor, Smartphone } from 'lucide-react';
import type { ThumbnailOutputFormat } from '../../../../types/thumbnail';
import { THUMBNAIL_OUTPUT_FORMATS } from '../../../../types/thumbnail';

interface ThumbnailFormatSelectorProps {
  selectedFormat: ThumbnailOutputFormat;
  onFormatChange: (format: ThumbnailOutputFormat) => void;
  disabled?: boolean;
}

const formatIcons: Record<ThumbnailOutputFormat, React.ReactNode> = {
  landscape: <Monitor className="w-4 h-4" />,
  short: <Smartphone className="w-4 h-4" />,
};

const formatRatios: Record<ThumbnailOutputFormat, { width: number; height: number }> = {
  landscape: { width: 48, height: 27 },
  short: { width: 18, height: 32 },
};

export const ThumbnailFormatSelector: React.FC<ThumbnailFormatSelectorProps> = ({
  selectedFormat,
  onFormatChange,
  disabled = false,
}) => {
  const formats = Object.entries(THUMBNAIL_OUTPUT_FORMATS) as Array<[
    ThumbnailOutputFormat,
    typeof THUMBNAIL_OUTPUT_FORMATS[ThumbnailOutputFormat]
  ]>;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-white">Output Format</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {formats.map(([format, option]) => {
          const isSelected = selectedFormat === format;
          const dims = formatRatios[format];

          return (
            <motion.button
              key={format}
              type="button"
              onClick={() => !disabled && onFormatChange(format)}
              disabled={disabled}
              whileHover={{ scale: disabled ? 1 : 1.02 }}
              whileTap={{ scale: disabled ? 1 : 0.98 }}
              className={`
                relative p-4 rounded-xl border-2 transition-all duration-200 text-left
                ${isSelected
                  ? 'border-[#fa7517] bg-[#fa7517]/10 shadow-lg shadow-[#fa7517]/20'
                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-16 items-center justify-center rounded-lg border ${
                  isSelected ? 'border-[#fa7517]/60 bg-[#fa7517]/10' : 'border-white/10 bg-black/30'
                }`}>
                  <div
                    style={{ width: dims.width, height: dims.height }}
                    className={`rounded border-2 ${
                      isSelected
                        ? 'border-[#fa7517] bg-gradient-to-br from-[#fa7517]/30 to-orange-500/30'
                        : 'border-white/30 bg-white/5'
                    }`}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={isSelected ? 'text-[#fa7517]' : 'text-gray-400'}>
                      {formatIcons[format]}
                    </span>
                    <p className={`text-sm font-semibold ${isSelected ? 'text-[#fa7517]' : 'text-white'}`}>
                      {option.label}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{option.size}</p>
                  <p className="mt-1 text-xs text-gray-400">{option.description}</p>
                </div>
              </div>

              {isSelected && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 bg-[#fa7517] rounded-full p-0.5 shadow-lg"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default ThumbnailFormatSelector;
