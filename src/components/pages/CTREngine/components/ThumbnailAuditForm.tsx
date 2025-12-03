// src/components/pages/CTREngine/components/ThumbnailAuditForm.tsx
// Premium audit input form component

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, Upload, PlayCircle, Users, ChevronRight, Sparkles, AlertCircle, FileText, Tag } from 'lucide-react';
import { isValidYouTubeUrl } from '../../../../api/ctr';
import { AuditContext, AuditProgress } from '../../../../types/ctr';

type InputMode = 'url' | 'upload' | 'youtube';

interface ThumbnailAuditFormProps {
  onAuditByUrl: (url: string, includePersonas: boolean, context?: AuditContext) => Promise<void>;
  onAuditByFile: (file: File, includePersonas: boolean, context?: AuditContext) => Promise<void>;
  onAuditByYouTube: (url: string, includePersonas: boolean) => Promise<void>;
  auditProgress: AuditProgress;
  quotaRemaining?: number;
  isAnonymous?: boolean;
  className?: string;
}

export const ThumbnailAuditForm: React.FC<ThumbnailAuditFormProps> = ({
  onAuditByUrl,
  onAuditByFile,
  onAuditByYouTube,
  auditProgress,
  quotaRemaining,
  isAnonymous = false,
  className = '',
}) => {
  const [inputMode, setInputMode] = useState<InputMode>('url');
  const [imageUrl, setImageUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [includePersonas, setIncludePersonas] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [context, setContext] = useState<AuditContext>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLoading = auditProgress.status === 'auditing';
  const canSubmit = quotaRemaining === undefined || quotaRemaining > 0;

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isLoading) return;

    if (inputMode === 'url' && imageUrl) {
      await onAuditByUrl(imageUrl, includePersonas, showAdvanced ? context : undefined);
    } else if (inputMode === 'upload' && selectedFile) {
      await onAuditByFile(selectedFile, includePersonas, showAdvanced ? context : undefined);
    } else if (inputMode === 'youtube' && youtubeUrl) {
      if (!isValidYouTubeUrl(youtubeUrl)) {
        return;
      }
      await onAuditByYouTube(youtubeUrl, includePersonas);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const modes: { id: InputMode; label: string; icon: React.ReactNode }[] = [
    { id: 'url', label: 'Image URL', icon: <Link2 className="w-4 h-4" /> },
    { id: 'upload', label: 'Upload', icon: <Upload className="w-4 h-4" /> },
    { id: 'youtube', label: 'YouTube', icon: <PlayCircle className="w-4 h-4" /> },
  ];

  return (
    <form onSubmit={handleSubmit} className={className}>
      {/* Input Mode Tabs - Premium Glass Style */}
      <div className="flex gap-1 p-1.5 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm mb-6">
        {modes.map((mode) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => setInputMode(mode.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                       ${inputMode === mode.id
                         ? 'bg-gradient-to-r from-[#fa7517] to-orange-500 text-white shadow-lg shadow-[#fa7517]/25'
                         : 'text-gray-400 hover:text-white hover:bg-white/5'
                       }`}
          >
            {mode.icon}
            {mode.label}
          </button>
        ))}
      </div>

      {/* Input Fields */}
      <AnimatePresence mode="wait">
        {inputMode === 'url' && (
          <motion.div
            key="url"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/thumbnail.jpg"
              className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white 
                        placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#fa7517]/50 
                        focus:border-[#fa7517]/50 backdrop-blur-sm transition-all"
              disabled={isLoading}
            />
          </motion.div>
        )}

        {inputMode === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => !selectedFile && fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer overflow-hidden
                         ${selectedFile 
                           ? 'border-[#fa7517] bg-[#fa7517]/10' 
                           : 'border-white/20 hover:border-white/40 bg-white/5'}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isLoading}
              />
              
              {selectedFile && previewUrl ? (
                <div className="p-4 flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-32 h-20 object-cover rounded-lg border border-white/20"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-lg" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearFile();
                    }}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="p-10 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#fa7517]/20 to-orange-500/20 flex items-center justify-center border border-[#fa7517]/30">
                    <Upload className="w-7 h-7 text-[#fa7517]" />
                  </div>
                  <p className="text-white font-medium mb-1">Drop your thumbnail here</p>
                  <p className="text-sm text-gray-500">or click to browse</p>
                  <p className="text-xs text-gray-600 mt-3">PNG, JPG, WebP up to 10MB</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {inputMode === 'youtube' && (
          <motion.div
            key="youtube"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="relative">
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-4 py-3.5 pl-12 bg-white/5 border border-white/10 rounded-xl text-white 
                          placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 
                          focus:border-red-500/50 backdrop-blur-sm transition-all"
                disabled={isLoading}
              />
              <PlayCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
            </div>
            <p className="mt-2 text-xs text-gray-500 flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3" />
              Works with youtube.com/watch, youtu.be, and YouTube Shorts
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persona Toggle - Premium Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-6 p-4 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl backdrop-blur-sm"
      >
        <label className="flex items-center justify-between cursor-pointer group">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              includePersonas 
                ? 'bg-gradient-to-br from-[#fa7517]/30 to-orange-500/30 border border-[#fa7517]/50' 
                : 'bg-white/5 border border-white/10'
            }`}>
              <Users className={`w-5 h-5 ${includePersonas ? 'text-[#fa7517]' : 'text-gray-500'}`} />
            </div>
            <div>
              <span className="text-sm font-semibold text-white block">Persona Analysis</span>
              <p className="text-xs text-gray-500 mt-0.5">
                Get feedback from simulated viewer personas
              </p>
            </div>
          </div>
          <div className="relative">
            <input
              type="checkbox"
              checked={includePersonas}
              onChange={(e) => setIncludePersonas(e.target.checked)}
              className="sr-only"
              disabled={isLoading}
            />
            <div className={`w-12 h-6 rounded-full transition-colors ${includePersonas ? 'bg-[#fa7517]' : 'bg-white/20'}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all ${includePersonas ? 'left-[26px]' : 'left-0.5'}`} />
            </div>
          </div>
        </label>
        {includePersonas && (
          <motion.p 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 pt-3 border-t border-white/10 text-xs text-gray-400 flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3 text-[#fa7517]" />
            Adds ~3 seconds to analysis time
          </motion.p>
        )}
      </motion.div>

      {/* Advanced Context (collapsible) */}
      {inputMode !== 'youtube' && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group"
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
            <span>Add context for better analysis</span>
          </button>
          
          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={context.title || ''}
                      onChange={(e) => setContext({ ...context, title: e.target.value })}
                      placeholder="Video title (optional)"
                      className="w-full px-4 py-2.5 pl-10 bg-white/5 border border-white/10 rounded-lg text-white 
                                text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#fa7517]/50"
                      disabled={isLoading}
                    />
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={context.niche || ''}
                      onChange={(e) => setContext({ ...context, niche: e.target.value })}
                      placeholder="Niche (e.g., Gaming, Tech, Finance)"
                      className="w-full px-4 py-2.5 pl-10 bg-white/5 border border-white/10 rounded-lg text-white 
                                text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#fa7517]/50"
                      disabled={isLoading}
                    />
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Submit Button - Premium Gradient */}
      <motion.button
        type="submit"
        disabled={isLoading || !canSubmit}
        whileHover={{ scale: canSubmit && !isLoading ? 1.02 : 1 }}
        whileTap={{ scale: canSubmit && !isLoading ? 0.98 : 1 }}
        className={`relative w-full mt-6 py-4 px-6 rounded-xl font-semibold text-white transition-all
                   flex items-center justify-center gap-2 overflow-hidden
                   ${canSubmit && !isLoading
                     ? 'bg-gradient-to-r from-[#fa7517] to-orange-500 hover:from-[#fa7517]/90 hover:to-orange-500/90 shadow-lg shadow-[#fa7517]/25 hover:shadow-[#fa7517]/40'
                     : 'bg-white/10 cursor-not-allowed text-gray-400'
                   }`}
      >
        {/* Shimmer effect */}
        {canSubmit && !isLoading && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />
        )}
        
        {isLoading ? (
          <>
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Analyzing{includePersonas ? ' with personas' : ''}...</span>
          </>
        ) : !canSubmit ? (
          'Quota exhausted'
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            <span>Audit Thumbnail</span>
          </>
        )}
      </motion.button>

      {/* Quota Warning */}
      {quotaRemaining !== undefined && quotaRemaining <= 2 && quotaRemaining > 0 && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 text-center text-xs text-[#fa7517] flex items-center justify-center gap-1.5"
        >
          <AlertCircle className="w-3.5 h-3.5" />
          {quotaRemaining} audit{quotaRemaining !== 1 ? 's' : ''} remaining today
          {isAnonymous && ' • Sign in for more'}
        </motion.p>
      )}
      {quotaRemaining === 0 && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 text-center text-xs text-red-400 flex items-center justify-center gap-1.5"
        >
          <AlertCircle className="w-3.5 h-3.5" />
          Daily limit reached
          {isAnonymous ? ' • Sign in for 10 free audits daily' : ' • Resets at midnight UTC'}
        </motion.p>
      )}
    </form>
  );
};

export default ThumbnailAuditForm;
