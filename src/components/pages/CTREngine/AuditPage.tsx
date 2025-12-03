// src/components/pages/CTREngine/AuditPage.tsx
// Premium CTR Thumbnail Audit Page

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Target, TrendingUp, BarChart2, AlertCircle, X, ArrowLeft, RefreshCw } from 'lucide-react';
import CTREngineLayout from './CTREngineLayout';
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
    <CTREngineLayout quota={quota} isLoadingQuota={isLoadingQuota}>
      {/* Page Header */}
      <div className="text-center mb-10">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#fa7517]/10 border border-[#fa7517]/30 rounded-full text-[#fa7517] text-sm font-medium mb-4"
        >
          <BarChart2 className="w-4 h-4" />
          CTR Analysis Engine
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-3xl md:text-4xl font-bold text-white mb-3"
        >
          Audit Your Thumbnail's{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fa7517] to-orange-400">
            Click Power
          </span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-400 max-w-lg mx-auto"
        >
          Get AI-powered insights and actionable suggestions to maximize your thumbnail's click-through rate
        </motion.p>
      </div>

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
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Audit Not Found</h3>
          <p className="text-gray-400 mb-6">{historicalError}</p>
          <button
            onClick={handleReset}
            className="py-3 px-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-all flex items-center gap-2 mx-auto"
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
            {/* Historical Audit Banner */}
            {isViewingHistorical && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl mx-auto mb-6 p-4 bg-[#fa7517]/10 border border-[#fa7517]/20 rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 text-[#fa7517]" />
                  <span className="text-gray-300">Viewing historical audit #{auditIdParam}</span>
                </div>
                <button
                  onClick={handleReset}
                  className="text-sm text-[#fa7517] hover:text-[#fa7517]/80 font-medium flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  New Audit
                </button>
              </motion.div>
            )}
            
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
                    className="p-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm text-center group hover:border-[#fa7517]/30 transition-colors"
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
    </CTREngineLayout>
  );
};

export default AuditPage;
