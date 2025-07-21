import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Type, 
  Bold, 
  Italic, 
  Underline, 
  Zap, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Circle,
  Square as SquareIcon,
  Info,
  MoreVertical,
  MoreHorizontal
} from 'lucide-react';

// Tooltip Component
const Tooltip: React.FC<{ children: React.ReactNode; content: string; delay?: number }> = ({ 
  children, 
  content, 
  delay = 500 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    const id = setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };

  return (
    <div className="relative inline-block" onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded-md whitespace-nowrap z-[100] pointer-events-none"
          >
            {content}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black/90" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface TitleTextInputProps {
  title: string;
  onTitleChange: (title: string) => void;
  style: TitleStyle;
  onStyleChange: (style: TitleStyle) => void;
  position: TitlePosition;
  onPositionChange: (position: TitlePosition) => void;
  color: TitleColor;
  onColorChange: (color: TitleColor) => void;
}

export interface TitleStyle {
  bold: boolean;
  outline: boolean;
  shadow: boolean;
  uppercase: boolean;
}

export interface TitlePosition {
  vertical: 'top' | 'center' | 'bottom';
  horizontal: 'left' | 'center' | 'right';
}

export interface TitleColor {
  primary: string;
  name: string;
}

const titleColors: TitleColor[] = [
  { primary: 'white', name: 'White' },
  { primary: 'black', name: 'Black' },
  { primary: 'red', name: 'Red' },
  { primary: 'blue', name: 'Blue' },
  { primary: 'green', name: 'Green' },
  { primary: 'yellow', name: 'Yellow' },
  { primary: 'purple', name: 'Purple' },
  { primary: 'orange', name: 'Orange' },
];

export const TitleTextInput: React.FC<TitleTextInputProps> = ({
  title,
  onTitleChange,
  style,
  onStyleChange,
  position,
  onPositionChange,
  color,
  onColorChange
}) => {
  const handleStyleToggle = (key: keyof TitleStyle) => {
    onStyleChange({
      ...style,
      [key]: !style[key]
    });
  };

  const handlePositionChange = (vertical?: 'top' | 'center' | 'bottom', horizontal?: 'left' | 'center' | 'right') => {
    onPositionChange({
      vertical: vertical || position.vertical,
      horizontal: horizontal || position.horizontal
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Type className="w-5 h-5 text-[#fa7517]" />
        <h3 className="text-lg font-semibold text-white">Add Title Text</h3>
        <div className="flex items-center gap-1 text-sm text-gray-400">
          <Info className="w-4 h-4" />
          <span>Optional overlay</span>
        </div>
      </div>

      {/* Title Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Title Text</label>
        <div className="relative">
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Enter your video title... (e.g., 'HOW TO COOK THE PERFECT PASTA')"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#fa7517]/50 focus:ring-2 focus:ring-[#fa7517]/20 transition-all duration-300"
            maxLength={50}
          />
          <div className="absolute bottom-3 right-4 text-xs text-gray-500">
            {title.length}/50
          </div>
        </div>
      </div>

      {/* Compact Style Controls - Single Row */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="flex items-center gap-4 flex-wrap">
          
                     {/* Style Group */}
           <div className="flex items-center gap-1">
             <span className="text-xs text-gray-400 mr-2">Style:</span>
             <Tooltip content="Make text bold and prominent">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleStyleToggle('bold')}
            className={`
                   p-2 rounded-lg border transition-all duration-200
              ${style.bold
                ? 'border-[#fa7517] bg-[#fa7517]/20 text-white'
                : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/20'
              }
            `}
          >
            <Bold className="w-4 h-4" />
          </motion.button>
             </Tooltip>

             <Tooltip content="Add black outline around text">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleStyleToggle('outline')}
            className={`
                   p-2 rounded-lg border transition-all duration-200
              ${style.outline
                ? 'border-[#fa7517] bg-[#fa7517]/20 text-white'
                : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/20'
              }
            `}
          >
            <SquareIcon className="w-4 h-4" />
          </motion.button>
             </Tooltip>

             <Tooltip content="Add shadow behind text for depth">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleStyleToggle('shadow')}
            className={`
                   p-2 rounded-lg border transition-all duration-200
              ${style.shadow
                ? 'border-[#fa7517] bg-[#fa7517]/20 text-white'
                : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/20'
              }
            `}
          >
            <Circle className="w-4 h-4" />
          </motion.button>
             </Tooltip>

             <Tooltip content="Convert text to UPPERCASE">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleStyleToggle('uppercase')}
            className={`
                   p-2 rounded-lg border transition-all duration-200
              ${style.uppercase
                ? 'border-[#fa7517] bg-[#fa7517]/20 text-white'
                : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/20'
              }
            `}
          >
            <Type className="w-4 h-4" />
          </motion.button>
             </Tooltip>
      </div>

          {/* Divider */}
          <div className="w-px h-8 bg-white/10" />

                     {/* Position Group */}
           <div className="flex items-center gap-1">
             <span className="text-xs text-gray-400 mr-2">Position:</span>
        
        {/* Vertical Position */}
             <div className="relative">
               <div className="flex bg-white/5 rounded-lg border border-white/10">
                 {(['top', 'center', 'bottom'] as const).map((pos, index) => (
                   <Tooltip key={pos} content={`Position text at ${pos} of thumbnail`}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePositionChange(pos)}
                className={`
                         px-3 py-1 text-xs transition-all duration-200 relative
                  ${position.vertical === pos
                           ? 'bg-[#fa7517] text-white'
                           : 'text-gray-300 hover:bg-white/10'
                  }
                         ${index !== 0 ? 'border-l border-white/10' : ''}
                         ${index === 0 ? 'rounded-l-lg' : ''}
                         ${index === 2 ? 'rounded-r-lg' : ''}
                `}
              >
                       {pos === 'top' && '↑'}
                       {pos === 'center' && '•'}
                       {pos === 'bottom' && '↓'}
              </motion.button>
                   </Tooltip>
            ))}
          </div>
        </div>

        {/* Horizontal Position */}
             <div className="relative ml-1">
               <div className="flex bg-white/5 rounded-lg border border-white/10">
                 {(['left', 'center', 'right'] as const).map((pos, index) => (
                   <Tooltip key={pos} content={`Align text to the ${pos}`}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePositionChange(undefined, pos)}
                className={`
                         p-1 transition-all duration-200 relative
                  ${position.horizontal === pos
                           ? 'bg-[#fa7517] text-white'
                           : 'text-gray-300 hover:bg-white/10'
                  }
                         ${index !== 0 ? 'border-l border-white/10' : ''}
                         ${index === 0 ? 'rounded-l-lg' : ''}
                         ${index === 2 ? 'rounded-r-lg' : ''}
                `}
              >
                {pos === 'left' && <AlignLeft className="w-4 h-4" />}
                {pos === 'center' && <AlignCenter className="w-4 h-4" />}
                {pos === 'right' && <AlignRight className="w-4 h-4" />}
              </motion.button>
                   </Tooltip>
            ))}
          </div>
        </div>
      </div>

          {/* Divider */}
          <div className="w-px h-8 bg-white/10" />

                     {/* Color Group */}
           <div className="flex items-center gap-1">
             <span className="text-xs text-gray-400 mr-2">Color:</span>
             <div className="flex gap-1">
               {titleColors.slice(0, 6).map((colorOption) => (
                 <Tooltip key={colorOption.primary} content={`Set text color to ${colorOption.name.toLowerCase()}`}>
                   <motion.button
                     whileHover={{ scale: 1.1 }}
                     whileTap={{ scale: 0.9 }}
                     onClick={() => onColorChange(colorOption)}
                     className={`
                       w-6 h-6 rounded-full border-2 transition-all duration-200
                       ${color.primary === colorOption.primary
                         ? 'border-[#fa7517] ring-2 ring-[#fa7517]/30'
                         : 'border-white/20 hover:border-white/40'
                       }
                     `}
                   >
                     <div 
                       className={`
                         w-full h-full rounded-full
                         ${colorOption.primary === 'white' ? 'bg-white' : ''}
                         ${colorOption.primary === 'black' ? 'bg-black' : ''}
                         ${colorOption.primary === 'red' ? 'bg-red-500' : ''}
                         ${colorOption.primary === 'blue' ? 'bg-blue-500' : ''}
                         ${colorOption.primary === 'green' ? 'bg-green-500' : ''}
                         ${colorOption.primary === 'yellow' ? 'bg-yellow-500' : ''}
                         ${colorOption.primary === 'purple' ? 'bg-purple-500' : ''}
                         ${colorOption.primary === 'orange' ? 'bg-orange-500' : ''}
                       `}
                     />
                   </motion.button>
                 </Tooltip>
               ))}
               
               {/* More colors dropdown indicator */}
               <div className="relative">
                 <Tooltip content="See more color options">
                   <motion.button
                     whileHover={{ scale: 1.1 }}
                     whileTap={{ scale: 0.9 }}
                     className="w-6 h-6 rounded-full border-2 border-white/20 hover:border-white/40 bg-white/5 flex items-center justify-center transition-all duration-200"
                   >
                     <MoreHorizontal className="w-3 h-3 text-gray-400" />
                   </motion.button>
                 </Tooltip>
                 
                 {/* Extended color palette (could be a dropdown) */}
                 <div className="absolute top-8 right-0 bg-black/90 backdrop-blur-sm border border-white/10 rounded-lg p-2 opacity-0 invisible hover:opacity-100 hover:visible transition-all duration-200 z-10">
                   <div className="flex gap-1">
                     {titleColors.slice(6).map((colorOption) => (
                       <Tooltip key={colorOption.primary} content={`Set text color to ${colorOption.name.toLowerCase()}`}>
            <motion.button
                           whileHover={{ scale: 1.1 }}
                           whileTap={{ scale: 0.9 }}
              onClick={() => onColorChange(colorOption)}
              className={`
                             w-5 h-5 rounded-full border transition-all duration-200
                ${color.primary === colorOption.primary
                               ? 'border-[#fa7517] ring-1 ring-[#fa7517]/30'
                               : 'border-white/20 hover:border-white/40'
                }
              `}
            >
              <div 
                className={`
                               w-full h-full rounded-full
                  ${colorOption.primary === 'white' ? 'bg-white' : ''}
                  ${colorOption.primary === 'black' ? 'bg-black' : ''}
                  ${colorOption.primary === 'red' ? 'bg-red-500' : ''}
                  ${colorOption.primary === 'blue' ? 'bg-blue-500' : ''}
                  ${colorOption.primary === 'green' ? 'bg-green-500' : ''}
                  ${colorOption.primary === 'yellow' ? 'bg-yellow-500' : ''}
                  ${colorOption.primary === 'purple' ? 'bg-purple-500' : ''}
                  ${colorOption.primary === 'orange' ? 'bg-orange-500' : ''}
                `}
              />
            </motion.button>
                       </Tooltip>
          ))}
                   </div>
                 </div>
               </div>
             </div>
           </div>
        </div>
      </div>

      {/* Preview Text */}
      {title && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#fa7517]/10 border border-[#fa7517]/30 rounded-xl p-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-5 h-5 text-[#fa7517]" />
            <h4 className="text-white font-medium">Title Preview</h4>
          </div>
          <div className="bg-black/40 rounded-lg p-4 text-center">
            <p 
              className={`
                text-lg transition-all duration-300
                ${style.bold ? 'font-bold' : 'font-medium'}
                ${style.uppercase ? 'uppercase' : ''}
                ${color.primary === 'white' ? 'text-white' : ''}
                ${color.primary === 'black' ? 'text-black' : ''}
                ${color.primary === 'red' ? 'text-red-500' : ''}
                ${color.primary === 'blue' ? 'text-blue-500' : ''}
                ${color.primary === 'green' ? 'text-green-500' : ''}
                ${color.primary === 'yellow' ? 'text-yellow-500' : ''}
                ${color.primary === 'purple' ? 'text-purple-500' : ''}
                ${color.primary === 'orange' ? 'text-orange-500' : ''}
                ${style.shadow ? 'drop-shadow-lg' : ''}
                ${style.outline ? 'stroke-black stroke-2' : ''}
              `}
              style={{
                textAlign: position.horizontal as any,
                WebkitTextStroke: style.outline ? '1px black' : 'none'
              }}
            >
              {title}
            </p>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Position: {position.vertical} {position.horizontal} • 
            Style: {Object.entries(style).filter(([_, value]) => value).map(([key]) => key).join(', ') || 'default'}
          </p>
        </motion.div>
      )}
    </div>
  );
}; 