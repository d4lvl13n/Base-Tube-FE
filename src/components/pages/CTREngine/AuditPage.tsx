// src/components/pages/CTREngine/AuditPage.tsx
// Premium CTR Thumbnail Audit Page - Clean layout

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Target, TrendingUp, AlertCircle, X, ArrowLeft, RefreshCw } from 'lucide-react';
import AIThumbnailsLayout from './AIThumbnailsLayout';
import { ThumbnailAuditForm } from './components/ThumbnailAuditForm';
import { ThumbnailAuditResult } from './components/ThumbnailAuditResult';
import useCTREngine from '../../../hooks/useCTREngine';
import { ThumbnailAudit } from '../../../types/ctr';

// Note: Auth is handled inside useCTREngine which checks both Clerk and Web3

const AuditPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const auditIdParam = searchParams.get('id');
  
  const {
    auditByUrl,
    auditByFile,
    auditByYouTube,
    auditProgress,
    auditResult,
    auditThumbnailUrl,
    youtubeMetadata,
    clearAuditResult,
    loadAuditById,
    quota,
    isLoadingQuota,
    error,
    clearError,
    isAnonymous,
  } = useCTREngine();
  
  // State for viewing a historical audit
  const [historicalAudit, setHistoricalAudit] = useState<ThumbnailAudit | null>(null);
  const [isLoadingHistorical, setIsLoadingHistorical] = useState(false);
  const [historicalError, setHistoricalError] = useState<string | null>(null);
  
  // Load historical audit if ID is in URL
  useEffect(() => {
    if (auditIdParam) {
      const loadHistoricalAudit = async () => {
        setIsLoadingHistorical(true);
        setHistoricalError(null);
        try {
          const audit = await loadAuditById(parseInt(auditIdParam, 10));
          if (audit) {
            setHistoricalAudit(audit);
          } else {
            setHistoricalError('Audit not found');
          }
        } catch (err: any) {
          setHistoricalError(err.message || 'Failed to load audit');
        } finally {
          setIsLoadingHistorical(false);
        }
      };
      loadHistoricalAudit();
    } else {
      // Clear historical audit when ID is removed from URL
      setHistoricalAudit(null);
    }
  }, [auditIdParam, loadAuditById]);

  const handleReset = () => {
    clearAuditResult();
    setHistoricalAudit(null);
    // Clear the ID from URL
    setSearchParams({});
  };
  
  // Determine which audit to show (current or historical)
  const displayAudit = historicalAudit || auditResult;
  const isViewingHistorical = !!historicalAudit;

  return (
    <AIThumbnailsLayout quota={quota} isLoadingQuota={isLoadingQuota}>
      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-3xl mx-auto mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 backdrop-blur-sm"
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="flex-1 text-red-400">{error}</p>
            <button
              onClick={clearError}
              className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Historical Audit */}
      {isLoadingHistorical && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20"
        >
          <div className="w-16 h-16 rounded-full border-2 border-[#fa7517]/30 border-t-[#fa7517] animate-spin mb-6" />
          <p className="text-gray-400 font-medium">Loading audit details...</p>
        </motion.div>
      )}
      
      {/* Historical Audit Error */}
      {historicalError && !isLoadingHistorical && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl mx-auto text-center py-16"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center backdrop-blur-sm">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Audit Not Found</h3>
          <p className="text-gray-400 mb-6">{historicalError}</p>
          <button
            onClick={handleReset}
            className="py-3 px-6 bg-black/50 hover:bg-black/60 border border-gray-800/30 hover:border-gray-800/50 rounded-xl text-white font-medium transition-all flex items-center gap-2 mx-auto backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Audit
          </button>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {displayAudit && !isLoadingHistorical && !historicalError ? (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <ThumbnailAuditResult 
              audit={displayAudit} 
              thumbnailUrl={auditThumbnailUrl || undefined}
              youtubeMetadata={isViewingHistorical ? undefined : youtubeMetadata}
              onClear={handleReset} 
            />
          </motion.div>
        ) : !isLoadingHistorical && !historicalError && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="max-w-3xl mx-auto">
              <ThumbnailAuditForm
                onAuditByUrl={auditByUrl}
                onAuditByFile={auditByFile}
                onAuditByYouTube={auditByYouTube}
                auditProgress={auditProgress}
                quotaRemaining={quota?.audit?.remaining}
                isAnonymous={isAnonymous}
              />

              {/* Feature Highlights */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid sm:grid-cols-3 gap-4 mt-8"
              >
                {[
                  { icon: Zap, title: 'Instant Analysis', desc: 'Get results in seconds' },
                  { icon: Target, title: 'CTR Prediction', desc: 'AI-powered scoring' },
                  { icon: TrendingUp, title: 'Actionable Tips', desc: 'Improve your click rate' },
                ].map((feature) => (
                  <div
                    key={feature.title}
                    className="p-4 bg-black/50 border border-gray-800/30 rounded-xl backdrop-blur-sm text-center group hover:border-[#fa7517]/30 transition-colors"
                  >
                    <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-gradient-to-br from-[#fa7517]/20 to-orange-500/10 flex items-center justify-center border border-[#fa7517]/20 group-hover:border-[#fa7517]/40 transition-colors">
                      <feature.icon className="w-5 h-5 text-[#fa7517]" />
                    </div>
                    <h3 className="text-white font-semibold text-sm mb-1">{feature.title}</h3>
                    <p className="text-gray-500 text-xs">{feature.desc}</p>
                  </div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AIThumbnailsLayout>
  );
};

export default AuditPage;
