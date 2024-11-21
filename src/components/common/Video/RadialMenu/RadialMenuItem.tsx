import React from 'react';
import { motion } from 'framer-motion';
import { formatNumber } from '../../../../utils/format';

interface RadialMenuItemProps {
  Icon: React.ElementType;
  label: string;
  angle: number;
  onClick: () => void;
  count?: number;
  isActive?: boolean;
  isLoading?: boolean;
}

const RadialMenuItem: React.FC<RadialMenuItemProps> = ({
  Icon,
  label,
  angle,
  onClick,
  count,
  isActive,
  isLoading
}) => (
  <motion.div
    className="absolute top-1/2 left-1/2 -mt-6 -ml-6"
    style={{
      transform: `rotate(${angle}deg) translateY(-80px) rotate(-${angle}deg)`,
    }}
  >
    <div className="relative group">
      {/* Main Button */}
      <motion.button
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        disabled={isLoading}
        className={`bg-black/70 rounded-full p-3 cursor-pointer relative
                   backdrop-blur-sm border border-white/5
                   group-hover:border-[#fa7517]/20 transition-colors
                   ${isActive ? 'bg-[#fa7517]/20' : ''}`}
        whileHover={{ 
          scale: 1.2,
          backgroundColor: isActive ? '#fa7517' : undefined,
          transition: { type: "spring", stiffness: 300 }
        }}
        whileTap={{ scale: 0.9 }}
      >
        {isLoading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full"
          />
        ) : (
          <Icon 
            size={24} 
            className={`relative z-10 transition-colors
                       ${isActive ? 'text-[#fa7517]' : 'text-white'}`}
            fill={isActive ? '#fa7517' : 'none'}
          />
        )}
      </motion.button>
      
      {/* Minimal Count Badge */}
      {count !== undefined && count > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="absolute -top-2 -right-2 z-20"
        >
          <div className="relative">
            {/* Subtle Glow */}
            <motion.div
              animate={{ 
                opacity: [0.3, 0.1, 0.3] 
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-[#fa7517]/30 rounded-full blur-sm"
            />

            {/* Count Display */}
            <div className="relative bg-[#fa7517] px-2 py-0.5 rounded-full
                          border border-white/10 shadow-lg shadow-black/20
                          flex items-center justify-center min-w-[28px]">
              <span className="text-black text-xs font-semibold">
                {formatNumber(count)}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </div>

    {/* Label */}
    <motion.span 
      initial={{ opacity: 0.5 }}
      whileHover={{ opacity: 1 }}
      className="absolute top-full left-1/2 transform -translate-x-1/2 
                 mt-2 text-xs font-medium whitespace-nowrap
                 text-white/90 tracking-wide"
    >
      {label}
    </motion.span>
  </motion.div>
);

export default RadialMenuItem; 