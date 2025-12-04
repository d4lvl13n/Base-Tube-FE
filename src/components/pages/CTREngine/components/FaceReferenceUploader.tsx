// src/components/pages/CTREngine/components/FaceReferenceUploader.tsx
// Premium face reference upload and management component

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, User, Trash2, RefreshCw, Check, X, AlertCircle, Camera, Sparkles, Info } from 'lucide-react';
import { FaceReference } from '../../../../types/ctr';
import { cardStyles } from '../styles/cardTokens';

interface FaceReferenceUploaderProps {
  faceReference: FaceReference | null;
  isLoading: boolean;
  isUploading: boolean;
  onUpload: (file: File) => Promise<void>;
  onDelete: () => Promise<void>;
  className?: string;
}

export const FaceReferenceUploader: React.FC<FaceReferenceUploaderProps> = ({
  faceReference,
  isLoading,
  isUploading,
  onUpload,
  onDelete,
  className = '',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }
    
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    await onUpload(file);
    
    URL.revokeObjectURL(url);
    setPreviewUrl(null);
  }, [onUpload]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDelete = async () => {
    await onDelete();
    setShowDeleteConfirm(false);
  };

  if (isLoading) {
    return (
      <div className={`${cardStyles.elevated} rounded-2xl p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-gray-800 rounded w-1/3"></div>
          <div className="h-3 bg-gray-800 rounded w-2/3"></div>
          <div className="h-40 bg-gray-800 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${cardStyles.elevated} rounded-2xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#fa7517]/20 to-orange-500/20 flex items-center justify-center border border-[#fa7517]/30">
          <Camera className="w-5 h-5 text-[#fa7517]" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Face Reference</h2>
          <p className="text-sm text-gray-400">For consistent personal branding</p>
        </div>
      </div>

      <p className="text-sm text-gray-400 mb-6 mt-4">
        Upload your face photo to include it in generated thumbnails for brand consistency.
      </p>

      <AnimatePresence mode="wait">
        {faceReference?.hasFaceReference ? (
          <motion.div
            key="uploaded"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-4"
          >
            {/* Current Face Reference */}
            <div className="flex items-start gap-4 p-5 bg-black/60 border border-gray-800/50 rounded-xl">
              <div className="relative">
                <img
                  src={faceReference.thumbnailUrl}
                  alt="Your face reference"
                  className="w-24 h-24 rounded-xl object-cover border-2 border-[#fa7517]/50 shadow-lg shadow-[#fa7517]/20"
                />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#fa7517] rounded-lg flex items-center justify-center shadow-lg">
                  <Check className="w-4 h-4 text-white" />
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#fa7517]" />
                  Face Reference Active
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  This image will be used when you enable "Include my face" in the thumbnail generator.
                </p>
                
                <div className="flex gap-2 mt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-4 py-2 bg-[#fa7517]/10 hover:bg-[#fa7517]/20 border border-[#fa7517]/30 text-[#fa7517] rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Replace
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isUploading}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-red-500/20"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Delete Confirmation */}
            <AnimatePresence>
              {showDeleteConfirm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-sm text-white mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      Delete your face reference?
                    </p>
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleDelete}
                        disabled={isUploading}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Yes, Delete
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={isUploading}
                        className="px-4 py-2 bg-black/60 hover:bg-black/80 text-white rounded-lg text-sm font-medium transition-colors border border-gray-800/50"
                      >
                        Cancel
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            key="upload"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            {/* Upload Area */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl transition-all cursor-pointer overflow-hidden
                         ${isDragOver
                           ? 'border-[#fa7517] bg-[#fa7517]/10'
                           : 'border-[#fa7517]/30 hover:border-[#fa7517]/60 bg-black/60'
                         }
                         ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
            >
              {/* Preview during upload */}
              {isUploading && previewUrl && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/90 rounded-2xl z-10">
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[#fa7517]/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-[#fa7517] animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </div>
                    <p className="text-sm text-white font-medium">Uploading...</p>
                  </div>
                </div>
              )}
              
              <div className="p-10 text-center">
                <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-[#fa7517]/20 to-orange-500/20 flex items-center justify-center border border-[#fa7517]/30">
                  <User className="w-10 h-10 text-[#fa7517]" />
                </div>
                <p className="text-white font-semibold mb-2">Upload your face photo</p>
                <p className="text-sm text-gray-400 mb-1">Drag and drop or click to browse</p>
                <p className="text-xs text-gray-600">PNG, JPG up to 5MB • Min 512×512px</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Tips */}
      <div className="mt-6 p-4 bg-black/60 border border-gray-800/50 rounded-xl">
        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#fa7517]/20 flex items-center justify-center border border-[#fa7517]/30">
            <Info className="w-3.5 h-3.5 text-[#fa7517]" />
          </div>
          Tips for best results
        </h4>
        <ul className="space-y-2 text-sm text-gray-400">
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#fa7517]" />
            Clear, well-lit photo
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#fa7517]" />
            Face centered and visible
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#fa7517]" />
            Neutral or expressive emotion
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#fa7517]" />
            High resolution (512×512 minimum)
          </li>
          <li className="flex items-center gap-2">
            <X className="w-4 h-4 text-red-500" />
            Avoid sunglasses or heavy filters
          </li>
        </ul>
      </div>
    </div>
  );
};

export default FaceReferenceUploader;
