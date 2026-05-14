import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ImageOff, Info, RefreshCw } from 'lucide-react';
import { ThumbnailItem } from '../../types/thumbnail';
import { cn } from '../../lib/utils';
import { resolveThumbnailImageUrl } from '../../utils/thumbnailImage';

interface ThumbnailCardProps {
  thumbnail: ThumbnailItem;
  onClick: () => void;
}

export const ThumbnailCard: React.FC<ThumbnailCardProps> = ({ thumbnail, onClick }) => {
  const imageSrc = useMemo(
    () => resolveThumbnailImageUrl(thumbnail.thumbnailUrl),
    [thumbnail.thumbnailUrl]
  );
  const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'error'>(
    imageSrc ? 'loading' : 'error'
  );
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    setImageStatus(imageSrc ? 'loading' : 'error');
    setRetryKey(0);
  }, [imageSrc]);

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
      className="bg-[#080808] border border-white/10 rounded-lg overflow-hidden shadow-[0_18px_44px_rgba(0,0,0,0.35)] flex flex-col cursor-pointer group"
      onClick={onClick}
    >
      {/* Thumbnail Image */}
      <div className="aspect-video relative overflow-hidden bg-black">
        {imageSrc && imageStatus !== 'error' && (
          <img
            key={`${thumbnail.id}-${retryKey}`}
            src={imageSrc}
            alt={`Thumbnail ID: ${thumbnail.id}`}
            className={cn(
              'w-full h-full object-cover transition-all duration-500 group-hover:scale-105',
              imageStatus === 'loaded' ? 'opacity-100' : 'opacity-0'
            )}
            loading="lazy"
            decoding="async"
            onLoad={() => setImageStatus('loaded')}
            onError={() => setImageStatus('error')}
          />
        )}

        {imageStatus === 'loading' && (
          <div className="absolute inset-0 bg-[linear-gradient(110deg,#060606_0%,#151515_45%,#24201d_55%,#060606_100%)] bg-[length:220%_100%] animate-pulse" />
        )}

        {imageStatus === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#050505] px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[#fa7517]">
              <ImageOff className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Preview unavailable</p>
              <p className="mt-1 text-xs text-gray-500">The image URL did not load.</p>
            </div>
            {imageSrc && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setImageStatus('loading');
                  setRetryKey(prev => prev + 1);
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-gray-200 transition-colors hover:border-[#fa7517]/50 hover:text-white"
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </button>
            )}
          </div>
        )}
        
        {/* Overlay with info button on hover */}
        {imageStatus === 'loaded' && (
          <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              className="p-2 bg-black/90 rounded-full text-[#fa7517] hover:bg-[#fa7517]/20 transition-colors border border-white/10"
              aria-label={`Open thumbnail ${thumbnail.id} details`}
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
        )}
        
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
