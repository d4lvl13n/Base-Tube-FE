import React from 'react';
import { motion } from 'framer-motion';
import { ThumbnailCard } from './ThumbnailCard';
import { ThumbnailItem } from '../../types/thumbnail';

interface ThumbnailGridProps {
  thumbnails: ThumbnailItem[];
  isLoading: boolean;
  onThumbnailClick: (id: number) => void;
}

export const ThumbnailGrid: React.FC<ThumbnailGridProps> = ({ 
  thumbnails, 
  isLoading,
  onThumbnailClick
}) => {
  // Animation variants for container
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  // For empty state check
  const noThumbnails = thumbnails.length === 0 && !isLoading;
  
  return (
    <div className="w-full">
      {/* Loading State */}
      {isLoading && thumbnails.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div 
              key={`skeleton-${index}`} 
              className="bg-gray-900/60 border border-gray-800/30 rounded-lg overflow-hidden"
            >
              <div className="aspect-video bg-gray-800/50 animate-pulse" />
              <div className="p-3">
                <div className="h-4 bg-gray-800/50 rounded animate-pulse w-full mb-2" />
                <div className="h-4 bg-gray-800/50 rounded animate-pulse w-3/4" />
                <div className="flex justify-between items-center mt-2">
                  <div className="h-3 bg-gray-800/50 rounded animate-pulse w-1/4" />
                  <div className="h-3 bg-gray-800/50 rounded animate-pulse w-1/5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Empty State */}
      {noThumbnails && (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="bg-gray-900/60 rounded-full p-4 mb-4">
            <svg 
              className="w-8 h-8 text-gray-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
              />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-white mb-2">No thumbnails found</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            No thumbnails match your current filters. Try adjusting your search criteria or check back later for new thumbnails.
          </p>
        </div>
      )}
      
      {/* Thumbnail Grid */}
      {thumbnails.length > 0 && (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5"
        >
          {thumbnails.map(thumbnail => (
            <ThumbnailCard
              key={thumbnail.id}
              thumbnail={thumbnail}
              onClick={() => onThumbnailClick(thumbnail.id)}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}; 