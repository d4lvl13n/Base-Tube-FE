// src/components/pages/CTREngine/components/AuditStatsCard.tsx
// Compact stats card for displaying audit statistics in dashboards/profiles

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Target, 
  Award, 
  TrendingUp,
  ArrowRight,
  History
} from 'lucide-react';
import useCTREngine from '../../../../hooks/useCTREngine';
import { getScoreLabel } from '../../../../api/ctr';

interface AuditStatsCardProps {
  className?: string;
  compact?: boolean;  // If true, shows minimal version
}

export const AuditStatsCard: React.FC<AuditStatsCardProps> = ({ 
  className = '',
  compact = false 
}) => {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    auditStats,
    isLoadingAuditStats,
    loadAuditStats,
  } = useCTREngine();
  
  // Load stats on mount if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadAuditStats();
    }
  }, [isAuthenticated, loadAuditStats]);
  
  // Don't render if not authenticated
  if (!isAuthenticated) return null;
  
  // Loading state
  if (isLoadingAuditStats && !auditStats) {
    return (
      <div className={`bg-white/5 border border-white/10 rounded-xl p-5 animate-pulse ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-white/10" />
          <div className="flex-1">
            <div className="h-5 bg-white/10 rounded w-32 mb-2" />
            <div className="h-4 bg-white/10 rounded w-24" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-white/10 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }
  
  // No stats yet
  if (!auditStats || auditStats.totalAudits === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-br from-[#fa7517]/10 to-orange-500/10 border border-[#fa7517]/20 rounded-xl p-5 ${className}`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#fa7517]/20 flex items-center justify-center">
            <Target className="w-5 h-5 text-[#fa7517]" />
          </div>
          <div>
            <h3 className="text-white font-semibold">CTR Audit</h3>
            <p className="text-sm text-gray-400">Start tracking your progress</p>
          </div>
        </div>
        <p className="text-gray-400 text-sm mb-4">
          Audit your thumbnails to get CTR scores and track improvement over time.
        </p>
        <button
          onClick={() => navigate('/ai-thumbnails/audit')}
          className="w-full py-2.5 bg-[#fa7517] hover:bg-[#fa7517]/90 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
        >
          Audit Your First Thumbnail
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    );
  }

  // Compact version
  if (compact) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/[0.07] transition-colors cursor-pointer ${className}`}
        onClick={() => navigate('/ai-thumbnails/history')}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#fa7517]/20 flex items-center justify-center">
              <History className="w-5 h-5 text-[#fa7517]" />
            </div>
            <div>
              <p className="text-white font-semibold">{auditStats.totalAudits} Audits</p>
              <p className="text-sm text-gray-400">
                Avg: {Number(auditStats.averageScore).toFixed(1)}/10
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-500" />
        </div>
      </motion.div>
    );
  }

  // Full version
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white/5 border border-white/10 rounded-xl p-5 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#fa7517]/20 to-orange-500/20 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-[#fa7517]" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Audit Stats</h3>
            <p className="text-sm text-gray-400">Your thumbnail performance</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/ai-thumbnails/history')}
          className="text-sm text-[#fa7517] hover:text-[#fa7517]/80 font-medium flex items-center gap-1 transition-colors"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-black/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-gray-500" />
            <span className="text-xs text-gray-500">Total</span>
          </div>
          <p className="text-xl font-bold text-white">{auditStats.totalAudits}</p>
        </div>
        
        <div className="bg-black/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-gray-500" />
            <span className="text-xs text-gray-500">Average</span>
          </div>
          <p className="text-xl font-bold text-white">{Number(auditStats.averageScore).toFixed(1)}<span className="text-sm text-gray-500">/10</span></p>
        </div>
        
        <div className="bg-black/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 text-green-500" />
            <span className="text-xs text-gray-500">Best</span>
          </div>
          <p className="text-xl font-bold text-green-400">{Number(auditStats.bestScore).toFixed(1)}<span className="text-sm text-gray-500">/10</span></p>
        </div>
        
        <div className="bg-black/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className={`w-4 h-4 ${auditStats.scoreImprovement && Number(auditStats.scoreImprovement) > 0 ? 'text-green-500' : 'text-gray-500'}`} />
            <span className="text-xs text-gray-500">Improvement</span>
          </div>
          <p className={`text-xl font-bold ${
            auditStats.scoreImprovement && Number(auditStats.scoreImprovement) > 0 
              ? 'text-green-400' 
              : auditStats.scoreImprovement && Number(auditStats.scoreImprovement) < 0 
                ? 'text-red-400' 
                : 'text-gray-400'
          }`}>
            {auditStats.scoreImprovement !== null 
              ? `${Number(auditStats.scoreImprovement) >= 0 ? '+' : ''}${Number(auditStats.scoreImprovement).toFixed(1)}` 
              : 'N/A'}
          </p>
        </div>
      </div>
      
      {/* Most Common Niche */}
      {auditStats.mostCommonNiche && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-sm text-gray-400">
            Most audited niche: <span className="text-white capitalize font-medium">{auditStats.mostCommonNiche}</span>
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default AuditStatsCard;

