import React from 'react';
import { motion } from 'framer-motion';
import { PlayCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UnlockButton from './UnlockButton';

interface StickyPassHeaderProps {
  isVisible: boolean;
  pass: {
    id: string;
    title: string;
    formatted_price: string;
    videos?: Array<{ thumbnail_url?: string }>;
  };
  alreadyOwns: boolean;
}

const StickyPassHeader: React.FC<StickyPassHeaderProps> = ({
  isVisible,
  pass,
  alreadyOwns,
}) => {
  const navigate = useNavigate();

  if (!isVisible) return null;

  return (
    <motion.div 
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -60, opacity: 0 }}
      className="fixed top-16 left-0 right-0 bg-black/90 backdrop-blur-md z-40 border-b border-white/10 shadow-lg"
    >
      <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          {Array.isArray(pass.videos) && pass.videos[0]?.thumbnail_url ? (
            <img 
              src={pass.videos[0].thumbnail_url} 
              alt={`${pass.title} thumbnail`}
              className="w-6 h-6 rounded object-cover"
            />
          ) : null}
          <span className="font-medium text-sm truncate max-w-[180px]">{pass.title}</span>
          <span className="text-orange-400 font-bold">{pass.formatted_price}</span>
        </div>
        
        {alreadyOwns ? (
          <button
            onClick={() => navigate(`/watch/${pass.id}`)}
            className="text-xs bg-green-500 text-white px-3 py-1 rounded flex items-center gap-1"
          >
            <PlayCircle className="w-3 h-3" />
            Watch
          </button>
        ) : (
          <UnlockButton 
            passId={pass.id} 
            className="text-xs bg-orange-500 text-white px-3 py-1 rounded flex items-center gap-1" 
          />
        )}
      </div>
    </motion.div>
  );
};

export default StickyPassHeader; 