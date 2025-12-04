import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Sparkles, Upload, Check, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ctrApi } from '../../../../api/ctr';

interface FaceReference {
  faceReferenceKey: string;
  thumbnailUrl: string;
}

interface FaceConsistencyToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  disabled?: boolean;
}

export const FaceConsistencyToggle: React.FC<FaceConsistencyToggleProps> = ({
  enabled,
  onToggle,
  disabled = false,
}) => {
  const [faceReference, setFaceReference] = useState<FaceReference | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user's face reference on mount
  useEffect(() => {
    const fetchFaceReference = async () => {
      try {
        setIsLoading(true);
        // Use ctrApi which has auth interceptor and handles 404 as empty state
        const result = await ctrApi.getFaceReference();
        
        if (result?.faceReferenceKey) {
          setFaceReference({
            faceReferenceKey: result.faceReferenceKey,
            thumbnailUrl: result.thumbnailUrl || '',
          });
        } else {
          // No face reference (404 returns null from ctrApi)
          setFaceReference(null);
        }
      } catch (err) {
        console.error('[FaceConsistencyToggle] Failed to fetch face reference:', err);
        // Treat errors as no face reference
        setFaceReference(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFaceReference();
  }, []);

  const hasFaceReference = !!faceReference?.faceReferenceKey;

  // If user doesn't have a face reference, show upload prompt
  if (isLoading) {
    return (
      <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          <span className="text-sm text-gray-400">Checking face reference...</span>
        </div>
      </div>
    );
  }

  if (!hasFaceReference) {
    return (
      <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <User className="w-5 h-5 text-purple-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-white mb-1">Face Consistency</h4>
            <p className="text-xs text-gray-400 mb-3">
              Upload your face reference to generate thumbnails with consistent facial features
            </p>
            <Link
              to="/ai-thumbnails/settings"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-300 text-xs font-medium transition-colors"
            >
              <Upload className="w-3 h-3" />
              Upload Face Reference
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-xl border-2 transition-all duration-200 ${
      enabled 
        ? 'bg-[#fa7517]/10 border-[#fa7517]/50' 
        : 'bg-white/5 border-white/10'
    }`}>
      <div className="flex items-start gap-3">
        {/* Face Preview */}
        <div className="relative">
          <div className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${
            enabled ? 'border-[#fa7517]' : 'border-white/20'
          }`}>
            {faceReference?.thumbnailUrl ? (
              <img
                src={faceReference.thumbnailUrl}
                alt="Your face reference"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#fa7517]/20 to-orange-500/20 flex items-center justify-center">
                <User className="w-6 h-6 text-[#fa7517]" />
              </div>
            )}
          </div>
          {enabled && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 bg-[#fa7517] rounded-full p-0.5"
            >
              <Check className="w-3 h-3 text-white" />
            </motion.div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#fa7517]" />
              Include My Face
            </h4>
            
            {/* Toggle Switch */}
            <button
              type="button"
              onClick={() => !disabled && onToggle(!enabled)}
              disabled={disabled}
              className={`
                relative w-11 h-6 rounded-full transition-all duration-200
                ${enabled 
                  ? 'bg-gradient-to-r from-[#fa7517] to-orange-500' 
                  : 'bg-white/20'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <motion.div
                initial={false}
                animate={{ x: enabled ? 22 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
              />
            </button>
          </div>
          
          <p className="text-xs text-gray-400">
            Generate thumbnails with your face preserved for brand consistency
          </p>
        </div>
      </div>

      {/* Active Indicator */}
      <AnimatePresence>
        {enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-[#fa7517]/30"
          >
            <div className="flex items-center gap-2 text-xs text-[#fa7517]">
              <Check className="w-3 h-3" />
              <span>Face consistency enabled • Your face will appear in generated thumbnails</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FaceConsistencyToggle;

