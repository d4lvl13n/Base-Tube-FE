import React from 'react';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { ThumbnailItem } from '../../types/thumbnail';

interface ThumbnailCardProps {
  thumbnail: ThumbnailItem;
  onClick: () => void;
}

export const ThumbnailCard: React.FC<ThumbnailCardProps> = ({ thumbnail, onClick }) => {
  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        ease: 'easeOut'
      }
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-gray-900/60 border border-gray-800/30 rounded-lg overflow-hidden shadow-md flex flex-col cursor-pointer group"
      onClick={onClick}
    >
      {/* Thumbnail Image */}
      <div className="aspect-video relative overflow-hidden bg-black">
        <img
          src={thumbnail.thumbnailUrl}
          alt={`Thumbnail ID: ${thumbnail.id}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            // Fallback for broken images
            const target = e.target as HTMLImageElement;
            target.src = '/assets/default-thumbnail.jpg';
          }}
        />
        
        {/* Overlay with info button on hover */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="p-2 bg-gray-900/90 rounded-full text-[#fa7517] hover:bg-[#fa7517]/20 transition-colors"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
        
        {/* Only keep Used badge */}
        {thumbnail.is_used && (
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-[#fa7517] text-black rounded text-xs font-medium">
            Used
          </div>
        )}
      </div>
    </motion.div>
  );
}; 