// src/components/pages/CTREngine/components/FaceReferenceUploader.tsx
// Face reference upload, replace and delete (Settings › Face reference).

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Trash2, RefreshCw, Check, AlertCircle, Loader2 } from 'lucide-react';
import { FaceReference } from '../../../../types/ctr';

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
    // Choosing the same file again after an error must upload it again.
    e.target.value = '';
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
      <div role="status" aria-label="Loading your face reference" className={`flex animate-pulse items-center gap-4 ${className}`}>
        <div className="h-20 w-20 rounded-xl bg-white/[0.06]" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-1/3 rounded bg-white/[0.06]" />
          <div className="h-3 w-1/2 rounded bg-white/[0.06]" />
        </div>
      </div>
    );
  }

  const button =
    'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <div className={className}>
      <AnimatePresence mode="wait" initial={false}>
        {faceReference?.hasFaceReference ? (
          <motion.div
            key="uploaded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <div className="relative shrink-0">
                <img
                  src={faceReference.thumbnailUrl}
                  alt="Your face reference"
                  className="h-20 w-20 rounded-xl border border-[#fa7517]/40 object-cover"
                />
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#fa7517]">
                  <Check className="h-3 w-3 text-white" aria-hidden="true" />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white">Face photo saved</p>
                <p className="text-xs text-zinc-500">{isUploading ? 'Uploading the new photo…' : 'Replace it any time.'}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className={`${button} border-[#fa7517]/30 bg-[#fa7517]/10 text-[#fb923c] hover:bg-[#fa7517]/20`}
                >
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="h-4 w-4" aria-hidden="true" />}
                  Replace
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isUploading}
                  className={`${button} border-white/15 text-zinc-300 hover:border-red-500/40 hover:text-red-300`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Delete
                </button>
              </div>
            </div>

            {showDeleteConfirm && (
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5">
                <p className="flex flex-1 items-center gap-2 text-sm text-white">
                  <AlertCircle className="h-4 w-4 text-red-400" aria-hidden="true" />
                  Delete your face reference?
                </p>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isUploading}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500"
                >
                  Yes, delete
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isUploading}
                  className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white hover:bg-white/10"
                >
                  Cancel
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button
              type="button"
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onClick={() => !isUploading && fileInputRef.current?.click()}
              disabled={isUploading}
              className={`flex w-full items-center gap-4 rounded-xl border border-dashed px-4 py-5 text-left transition-colors
                         ${isDragOver ? 'border-[#fa7517] bg-[#fa7517]/10' : 'border-white/20 bg-white/[0.02] hover:border-[#fa7517]/60'}
                         disabled:cursor-wait`}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#fa7517]/25 bg-[#fa7517]/10">
                {isUploading && previewUrl ? (
                  <img src={previewUrl} alt="" className="h-full w-full object-cover opacity-60" />
                ) : (
                  <User className="h-6 w-6 text-[#fa7517]" aria-hidden="true" />
                )}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-white">
                  {isUploading ? 'Uploading…' : 'Upload a face photo'}
                </span>
                <span className="block text-xs text-zinc-500">Drop it here or click · PNG or JPG up to 5 MB · at least 512×512</span>
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        aria-label="Face photo file"
        onChange={handleInputChange}
        className="hidden"
      />

      <p className="mt-3 text-xs text-zinc-500">
        Best results: a clear, well-lit photo with your face centred. No sunglasses or heavy filters. Only used for your
        thumbnails; delete it any time.
      </p>
    </div>
  );
};

export default FaceReferenceUploader;
