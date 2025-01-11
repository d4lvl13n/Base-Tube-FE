import React, { useState } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { ProcessingVideo } from '../../../../../../hooks/useVideoProcessing';
import { motion } from 'framer-motion';

interface ProcessingStatusProps {
  videoId: number;
  processingStatus?: ProcessingVideo;
  onRetry?: () => Promise<void>;
}

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  videoId,
  processingStatus,
  onRetry
}) => {
  const [isRetrying, setIsRetrying] = useState(false);

  if (!processingStatus) return null;

  const handleRetry = async () => {
    if (!onRetry) return;
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {processingStatus.status === 'processing' && processingStatus.progress && (
        <div className="flex flex-col w-full">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Processing {processingStatus.progress.currentQuality}</span>
            <span>{processingStatus.progress.percent}%</span>
          </div>
          <div className="h-1 bg-gray-800 rounded-full mt-1">
            <div 
              className="h-full bg-[#fa7517] rounded-full transition-all duration-300"
              style={{ width: `${processingStatus.progress.percent}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 mt-1">
            Quality {processingStatus.progress.currentQualityIndex + 1}/{processingStatus.progress.totalQualities}
          </span>
        </div>
      )}
      
      {processingStatus.status === 'failed' && (
        <div className="flex items-center gap-2">
          <div className="text-red-500 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Processing failed
          </div>
          <motion.button
            className={`px-2 py-1 rounded-lg text-xs
              ${isRetrying 
                ? 'bg-gray-800/50 text-gray-400 cursor-not-allowed' 
                : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
            whileHover={!isRetrying ? { scale: 1.05 } : undefined}
            whileTap={!isRetrying ? { scale: 0.95 } : undefined}
            onClick={handleRetry}
            disabled={isRetrying}
          >
            {isRetrying ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              'Retry'
            )}
          </motion.button>
        </div>
      )}
    </div>
  );
};