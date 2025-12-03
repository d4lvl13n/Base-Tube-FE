// src/components/pages/CTREngine/AuditHistoryPage.tsx
// Audit History Page - View past thumbnail audits with stats

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SignInButton } from '@clerk/clerk-react';
import { 
  History, 
  TrendingUp, 
  Award, 
  Target,
  BarChart3,
  Clock,
  Lock,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import CTREngineLayout from './CTREngineLayout';
import useCTREngine from '../../../hooks/useCTREngine';
import { AuditHistoryItem } from '../../../types/ctr';
import { getScoreColor, getScoreLabel } from '../../../api/ctr';

// ============================================================================
// STATS CARD COMPONENT
// ============================================================================

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext?: string;
  color?: string;
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({ 
  icon: Icon, 
  label, 
  value, 
  subtext, 
  color = 'text-[#fa7517]',
  delay = 0 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/[0.07] transition-colors"
  >
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-[#fa7517]/20 to-orange-500/20 flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
    </div>
    <p className="text-sm text-gray-400 mb-1">{label}</p>
    <p className="text-2xl font-bold text-white">{value}</p>
    {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
  </motion.div>
);

// ============================================================================
// AUDIT HISTORY ITEM COMPONENT
// ============================================================================

interface AuditHistoryRowProps {
  item: AuditHistoryItem;
  onView: (id: number) => void;
  delay?: number;
}

const AuditHistoryRow: React.FC<AuditHistoryRowProps> = ({ item, onView, delay = 0 }) => {
  const score = typeof item.overallScore === 'string' ? parseFloat(item.overallScore) : item.overallScore;
  const scoreColor = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);
  
  const scoreColorClasses = {
    green: 'text-green-400 bg-green-500/20',
    yellow: 'text-yellow-400 bg-yellow-500/20',
    orange: 'text-orange-400 bg-orange-500/20',
    red: 'text-red-400 bg-red-500/20',
  };
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined 
    });
  };
  
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="group bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/[0.07] hover:border-white/20 transition-all cursor-pointer"
      onClick={() => onView(item.id)}
    >
      <div className="flex items-center gap-4">
        {/* Thumbnail */}
        <div className="w-24 h-14 rounded-lg overflow-hidden bg-black/50 flex-shrink-0">
          {item.thumbnailUrl ? (
            <img 
              src={item.thumbnailUrl} 
              alt="Thumbnail" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600">
              <Target className="w-6 h-6" />
            </div>
          )}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${scoreColorClasses[scoreColor]}`}>
              {score.toFixed(1)}/10
            </span>
            <span className="text-xs text-gray-500">{scoreLabel}</span>
            {item.youtubeVideoId && (
              <span className="text-xs text-red-400 flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                YouTube
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <span className="capitalize">{item.detectedNiche}</span>
            <span className="text-gray-600">•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(item.createdAt)} at {formatTime(item.createdAt)}
            </span>
          </div>
        </div>
        
        {/* Action */}
        <div className="flex-shrink-0">
          <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-[#fa7517] transition-colors" />
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const AuditHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    quota,
    isLoadingQuota,
    auditHistory,
    auditHistoryPagination,
    isLoadingAuditHistory,
    auditStats,
    isLoadingAuditStats,
    loadAuditHistory,
    loadAuditStats,
    loadAuditById,
    error,
  } = useCTREngine();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterNiche, setFilterNiche] = useState<string>('all');
  
  // Load history and stats on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadAuditHistory();
      loadAuditStats();
    }
  }, [isAuthenticated, loadAuditHistory, loadAuditStats]);
  
  // Handle viewing a specific audit
  const handleViewAudit = async (id: number) => {
    // Navigate to audit page with the audit ID
    // The audit page can then load the specific audit
    navigate(`/ai-thumbnails/audit?id=${id}`);
  };
  
  // Handle loading more
  const handleLoadMore = () => {
    if (auditHistoryPagination?.hasMore && !isLoadingAuditHistory) {
      loadAuditHistory(20, auditHistoryPagination.offset, false);
    }
  };
  
  // Filter audits
  const filteredAudits = auditHistory.filter(item => {
    if (filterNiche !== 'all' && item.detectedNiche !== filterNiche) return false;
    // Add search filter if needed in the future
    return true;
  });
  
  // Get unique niches for filter
  const uniqueNiches = Array.from(new Set(auditHistory.map(a => a.detectedNiche)));
  
  // Auth gate
  if (!isAuthenticated) {
    return (
      <CTREngineLayout quota={quota} isLoadingQuota={isLoadingQuota}>
        <div className="max-w-xl mx-auto text-center py-16">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-[#fa7517]/20 to-orange-500/20 flex items-center justify-center border border-[#fa7517]/30"
          >
            <Lock className="w-10 h-10 text-[#fa7517]" />
          </motion.div>
          
          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold text-white mb-4"
          >
            Sign In to View History
          </motion.h2>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-gray-400 mb-8 max-w-md mx-auto"
          >
            Track your thumbnail audit history and see how your CTR scores improve over time.
          </motion.p>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <SignInButton mode="modal">
              <button className="py-3.5 px-6 bg-gradient-to-r from-[#fa7517] to-orange-500 hover:from-[#fa7517]/90 hover:to-orange-500/90 text-white rounded-xl font-semibold transition-all shadow-lg shadow-[#fa7517]/25 flex items-center justify-center gap-2 mx-auto">
                <History className="w-5 h-5" />
                Sign In to Continue
              </button>
            </SignInButton>
          </motion.div>
        </div>
      </CTREngineLayout>
    );
  }

  return (
    <CTREngineLayout quota={quota} isLoadingQuota={isLoadingQuota}>
      {/* Page Header */}
      <div className="text-center mb-10">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#fa7517]/10 border border-[#fa7517]/30 rounded-full text-[#fa7517] text-sm font-medium mb-4"
        >
          <History className="w-4 h-4" />
          Audit History
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-3xl md:text-4xl font-bold text-white mb-3"
        >
          Your{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fa7517] to-orange-400">
            Audit Journey
          </span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-400 max-w-lg mx-auto"
        >
          Track your progress and see how your thumbnail CTR scores improve over time
        </motion.p>
      </div>

      {/* Stats Cards */}
      {auditStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={BarChart3}
            label="Total Audits"
            value={auditStats.totalAudits}
            subtext="thumbnails analyzed"
            delay={0.1}
          />
          <StatCard
            icon={Target}
            label="Average Score"
            value={`${Number(auditStats.averageScore).toFixed(1)}/10`}
            subtext={getScoreLabel(Number(auditStats.averageScore))}
            delay={0.15}
          />
          <StatCard
            icon={Award}
            label="Best Score"
            value={`${Number(auditStats.bestScore).toFixed(1)}/10`}
            subtext="your top performer"
            color="text-green-400"
            delay={0.2}
          />
          <StatCard
            icon={TrendingUp}
            label="Improvement"
            value={auditStats.scoreImprovement !== null 
              ? `${Number(auditStats.scoreImprovement) >= 0 ? '+' : ''}${Number(auditStats.scoreImprovement).toFixed(1)}` 
              : 'N/A'}
            subtext={auditStats.scoreImprovement !== null 
              ? "since first audit" 
              : "audit more to track"}
            color={auditStats.scoreImprovement && Number(auditStats.scoreImprovement) > 0 ? 'text-green-400' : 'text-gray-400'}
            delay={0.25}
          />
        </div>
      )}
      
      {isLoadingAuditStats && !auditStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-white/10 mb-3" />
              <div className="h-4 bg-white/10 rounded w-20 mb-2" />
              <div className="h-8 bg-white/10 rounded w-16" />
            </div>
          ))}
        </div>
      )}

      {/* Filter Bar */}
      {auditHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-4 mb-6"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterNiche}
              onChange={(e) => setFilterNiche(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#fa7517]/50"
            >
              <option value="all">All Niches</option>
              {uniqueNiches.map(niche => (
                <option key={niche} value={niche} className="bg-[#111] capitalize">
                  {niche}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex-1" />
          
          <span className="text-sm text-gray-500">
            {filteredAudits.length} audit{filteredAudits.length !== 1 ? 's' : ''}
          </span>
        </motion.div>
      )}

      {/* Audit List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredAudits.map((item, index) => (
            <AuditHistoryRow
              key={item.id}
              item={item}
              onView={handleViewAudit}
              delay={0.35 + index * 0.05}
            />
          ))}
        </AnimatePresence>
        
        {/* Loading State */}
        {isLoadingAuditHistory && auditHistory.length === 0 && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-24 h-14 rounded-lg bg-white/10" />
                  <div className="flex-1">
                    <div className="h-5 bg-white/10 rounded w-24 mb-2" />
                    <div className="h-4 bg-white/10 rounded w-40" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Empty State */}
        {!isLoadingAuditHistory && auditHistory.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <History className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Audits Yet</h3>
            <p className="text-gray-400 mb-6 max-w-sm mx-auto">
              Start auditing thumbnails to build your history and track your improvement over time.
            </p>
            <button
              onClick={() => navigate('/ai-thumbnails/audit')}
              className="py-3 px-6 bg-gradient-to-r from-[#fa7517] to-orange-500 text-white rounded-xl font-semibold hover:from-[#fa7517]/90 hover:to-orange-500/90 transition-all shadow-lg shadow-[#fa7517]/25"
            >
              Audit Your First Thumbnail
            </button>
          </motion.div>
        )}
        
        {/* Load More Button */}
        {auditHistoryPagination?.hasMore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center pt-4"
          >
            <button
              onClick={handleLoadMore}
              disabled={isLoadingAuditHistory}
              className="flex items-center gap-2 py-3 px-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 font-medium transition-all disabled:opacity-50"
            >
              {isLoadingAuditHistory ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  Load More
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </motion.div>
        )}
      </div>
    </CTREngineLayout>
  );
};

export default AuditHistoryPage;

