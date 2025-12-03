// src/components/pages/CTREngine/components/CTRGeneratorForm.tsx
// Premium CTR-optimized thumbnail generation form

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronRight, User, AlertCircle, Zap, Settings2, FileText, Type } from 'lucide-react';
import { GenerateRequest, NicheOption, FaceReference, GenerationProgress } from '../../../../types/ctr';
import { NicheSelector } from './NicheSelector';

interface CTRGeneratorFormProps {
  niches: NicheOption[];
  isLoadingNiches: boolean;
  faceReference: FaceReference | null;
  generationProgress: GenerationProgress;
  quotaRemaining?: number;
  onGenerate: (request: GenerateRequest) => Promise<void>;
  className?: string;
}

export const CTRGeneratorForm: React.FC<CTRGeneratorFormProps> = ({
  niches,
  isLoadingNiches,
  faceReference,
  generationProgress,
  quotaRemaining,
  onGenerate,
  className = '',
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [textOverlay, setTextOverlay] = useState('');
  const [includeFace, setIncludeFace] = useState(false);
  const [concepts, setConcepts] = useState(3);
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('high');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const isLoading = generationProgress.status === 'generating';
  const canSubmit = title.trim().length > 0 && (quotaRemaining === undefined || quotaRemaining > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isLoading) return;

    await onGenerate({
      title: title.trim(),
      description: description.trim() || undefined,
      niche: selectedNiche || undefined,
      textOverlay: textOverlay.trim() || undefined,
      includeFace: includeFace && faceReference?.hasFaceReference,
      concepts,
      quality,
    });
  };

  const estimatedTime = concepts * 15;

  return (
    <form onSubmit={handleSubmit} className={className}>
      {/* Title Input */}
      <div className="mb-5">
        <label className="block text-sm font-semibold text-white mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#fa7517]" />
          Video Title <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="How I Made $10,000 in One Day Trading Crypto"
          className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white 
                    placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#fa7517]/50 
                    focus:border-[#fa7517]/50 backdrop-blur-sm transition-all"
          disabled={isLoading}
          maxLength={150}
        />
        <p className="mt-1.5 text-xs text-gray-500">{title.length}/150 characters</p>
      </div>

      {/* Description Input */}
      <div className="mb-5">
        <label className="block text-sm font-semibold text-white mb-2">
          Description <span className="text-gray-500 font-normal">(optional)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of your video content..."
          rows={3}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white 
                    placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#fa7517]/50 
                    focus:border-[#fa7517]/50 backdrop-blur-sm transition-all resize-none"
          disabled={isLoading}
          maxLength={500}
        />
      </div>

      {/* Niche Selection */}
      <div className="mb-5">
        <label className="block text-sm font-semibold text-white mb-3">
          Content Niche
        </label>
        <NicheSelector
          niches={niches}
          selectedNiche={selectedNiche}
          onSelect={setSelectedNiche}
          isLoading={isLoadingNiches || isLoading}
          variant="pills"
        />
      </div>

      {/* Text Overlay */}
      <div className="mb-5">
        <label className="block text-sm font-semibold text-white mb-2 flex items-center gap-2">
          <Type className="w-4 h-4 text-[#fa7517]" />
          Text Overlay <span className="text-gray-500 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={textOverlay}
          onChange={(e) => setTextOverlay(e.target.value)}
          placeholder="$10K IN 1 DAY"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white 
                    placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#fa7517]/50 
                    focus:border-[#fa7517]/50 backdrop-blur-sm transition-all"
          disabled={isLoading}
          maxLength={50}
        />
        <p className="mt-1.5 text-xs text-gray-500">Short, impactful text for your thumbnail</p>
      </div>

      {/* Face Reference Toggle */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 p-4 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl backdrop-blur-sm"
      >
        <label className="flex items-center justify-between cursor-pointer group">
          <div className="flex items-center gap-3">
            {faceReference?.thumbnailUrl ? (
              <img
                src={faceReference.thumbnailUrl}
                alt="Your face"
                className="w-12 h-12 rounded-xl object-cover border-2 border-[#fa7517]/50"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <User className="w-6 h-6 text-gray-500" />
              </div>
            )}
            <div>
              <span className="text-sm font-semibold text-white block">Include My Face</span>
              <p className="text-xs text-gray-500 mt-0.5">
                {faceReference?.hasFaceReference
                  ? 'Uses your saved face reference'
                  : 'Upload a face reference in Settings'}
              </p>
            </div>
          </div>
          <div className="relative">
            <input
              type="checkbox"
              checked={includeFace}
              onChange={(e) => setIncludeFace(e.target.checked)}
              disabled={isLoading || !faceReference?.hasFaceReference}
              className="sr-only"
            />
            <div className={`w-12 h-6 rounded-full transition-colors ${
              includeFace && faceReference?.hasFaceReference ? 'bg-[#fa7517]' : 'bg-white/20'
            } ${!faceReference?.hasFaceReference ? 'opacity-50' : ''}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all ${
                includeFace && faceReference?.hasFaceReference ? 'left-[26px]' : 'left-0.5'
              }`} />
            </div>
          </div>
        </label>
        {!faceReference?.hasFaceReference && (
          <a
            href="/ai-thumbnails/settings"
            className="mt-3 inline-flex items-center gap-1 text-xs text-[#fa7517] hover:text-orange-400 transition-colors"
          >
            Upload face reference
            <ChevronRight className="w-3 h-3" />
          </a>
        )}
      </motion.div>

      {/* Advanced Options */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group"
        >
          <Settings2 className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
          <span>Advanced Options</span>
        </button>
        
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 p-5 bg-white/5 border border-white/10 rounded-xl space-y-5">
                {/* Number of Concepts */}
                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    Number of Concepts
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setConcepts(num)}
                        disabled={isLoading}
                        className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all
                                   ${concepts === num
                                     ? 'bg-gradient-to-r from-[#fa7517] to-orange-500 text-white shadow-lg shadow-[#fa7517]/25'
                                     : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                                   }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    ~{concepts * 15}s generation time
                  </p>
                </div>

                {/* Quality */}
                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    Quality
                  </label>
                  <div className="flex gap-2">
                    {[
                      { value: 'low', label: 'Draft' },
                      { value: 'medium', label: 'Standard' },
                      { value: 'high', label: 'High' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setQuality(opt.value as 'low' | 'medium' | 'high')}
                        disabled={isLoading}
                        className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all
                                   ${quality === opt.value
                                     ? 'bg-gradient-to-r from-[#fa7517] to-orange-500 text-white shadow-lg shadow-[#fa7517]/25'
                                     : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                                   }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Generation Progress */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-5 bg-[#fa7517]/10 border border-[#fa7517]/20 rounded-xl"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#fa7517]" />
                Generating {concepts} concept{concepts > 1 ? 's' : ''}...
              </span>
              <span className="text-xs text-gray-400">
                ~{estimatedTime}s estimated
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#fa7517] to-orange-500"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: estimatedTime, ease: 'linear' }}
              />
            </div>
            {generationProgress.elapsedTime && (
              <p className="mt-2 text-xs text-gray-500">
                Elapsed: {Math.round(generationProgress.elapsedTime / 1000)}s
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Button */}
      <motion.button
        type="submit"
        disabled={isLoading || !canSubmit}
        whileHover={{ scale: canSubmit && !isLoading ? 1.02 : 1 }}
        whileTap={{ scale: canSubmit && !isLoading ? 0.98 : 1 }}
        className={`relative w-full py-4 px-6 rounded-xl font-semibold text-white transition-all
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
            <span>Generating...</span>
          </>
        ) : !title.trim() ? (
          'Enter a title to generate'
        ) : quotaRemaining === 0 ? (
          'Generation quota exhausted'
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            <span>Generate {concepts} Thumbnail{concepts > 1 ? 's' : ''}</span>
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
          {quotaRemaining} generation{quotaRemaining !== 1 ? 's' : ''} remaining today
        </motion.p>
      )}
    </form>
  );
};

export default CTRGeneratorForm;
