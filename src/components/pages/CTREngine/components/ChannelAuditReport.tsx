// src/components/pages/CTREngine/components/ChannelAuditReport.tsx
// Renders a ChannelPackagingAudit result (spec §5).
// NOTE: No CTR is shown anywhere — the benchmark signal is
// views-relative-to-subscribers only.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Wand2,
  Users,
  Eye,
  TrendingUp,
  TrendingDown,
  Layers,
  Type,
  Target,
  AlertTriangle,
  CheckCircle2,
  Trophy,
  ListChecks,
} from 'lucide-react';
import type {
  ChannelPackagingAudit,
  ChannelAuditPerVideo,
  FixImpact,
} from '../../../../types/ctr';

interface ChannelAuditReportProps {
  audit: ChannelPackagingAudit;
  onReset: () => void;
}

// Compact number formatter: 8100 -> "8.1K", 1200000 -> "1.2M"
const formatCount = (value: number | undefined | null): string => {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
};

const impactStyles: Record<FixImpact, string> = {
  high: 'bg-red-500/10 text-red-400 border-red-500/20',
  medium: 'bg-[#fa7517]/10 text-[#fa7517] border-[#fa7517]/20',
  low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

const scoreColor = (score: number): string => {
  if (score >= 8) return 'text-green-400';
  if (score >= 6) return 'text-yellow-400';
  if (score >= 4) return 'text-orange-400';
  return 'text-red-400';
};

export const ChannelAuditReport: React.FC<ChannelAuditReportProps> = ({
  audit,
  onReset,
}) => {
  const navigate = useNavigate();

  const {
    channel,
    headline,
    performancePattern,
    nicheBenchmark,
    perVideo = [],
    prioritizedFixes = [],
  } = audit;

  // "fix this →" — route into the concept-board / optimized generator,
  // prefilled with the weak video's title (the generator reads mode=ctr + prompt).
  const handleFixVideo = (video: ChannelAuditPerVideo) => {
    const params = new URLSearchParams({ mode: 'ctr', prompt: video.title });
    navigate(`/ai-thumbnails/generate?${params.toString()}`);
  };

  const outliers = performancePattern?.outliers ?? [];
  const overperformers = outliers.filter((o) => (o.ratio ?? 0) >= 1);
  const underperformers = outliers.filter((o) => (o.ratio ?? 0) < 1);
  const formatClusters = performancePattern?.formatClusters ?? [];
  const examplePeers = nicheBenchmark?.examplePeers ?? [];
  const winningPatterns = nicheBenchmark?.winningPatterns ?? [];
  const yourGap = nicheBenchmark?.yourGap ?? [];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back */}
      <div className="mb-6">
        <button
          onClick={onReset}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Audit another channel
        </button>
      </div>

      {/* Headline / diagnosis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#fa7517]/10 to-orange-500/5 border border-[#fa7517]/20 rounded-2xl p-6 sm:p-8 backdrop-blur-sm mb-6"
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400 mb-3">
          <span className="text-white font-semibold text-base">{channel?.title}</span>
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#fa7517]" />
            {formatCount(channel?.subscribers)} subscribers
          </span>
          {channel?.niche && (
            <span className="px-2 py-0.5 bg-[#fa7517]/15 text-[#fa7517] text-xs font-medium rounded-full">
              {channel.niche}
            </span>
          )}
          <span>{channel?.videosAnalyzed ?? perVideo.length} videos analyzed</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white leading-snug">
          {headline}
        </h1>
      </motion.div>

      {/* Prioritized fixes (surfaced first — fixes over score, per spec) */}
      {prioritizedFixes.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-black/50 border border-gray-800/30 rounded-2xl p-5 sm:p-6 backdrop-blur-sm mb-6"
        >
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-[#fa7517]" />
            Do these first
          </h2>
          <div className="space-y-3">
            {prioritizedFixes.map((fix, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 bg-black/40 border border-gray-800/50 rounded-xl"
              >
                <span
                  className={`mt-0.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded border ${
                    impactStyles[fix.impact] ?? impactStyles.medium
                  }`}
                >
                  {fix.impact}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{fix.title}</p>
                  <p className="text-sm text-gray-400 mt-1">{fix.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Niche benchmark — "channels your size winning do X, you do Y" */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-black/50 border border-gray-800/30 rounded-2xl p-5 sm:p-6 backdrop-blur-sm mb-6"
      >
        <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#fa7517]" />
            Channels your size that are winning
          </h2>
          {nicheBenchmark?.band && (
            <span className="text-xs text-gray-500">
              peer band: {formatCount(nicheBenchmark.band.min)}–{formatCount(nicheBenchmark.band.max)} subs
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mb-5">
          Benchmarked on views relative to subscriber count — not a copy of mega-channels.
        </p>

        <div className="grid md:grid-cols-2 gap-5 mb-5">
          {/* Winners do X */}
          <div className="p-4 bg-green-500/5 border border-green-500/15 rounded-xl">
            <p className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Winners do this
            </p>
            {winningPatterns.length > 0 ? (
              <ul className="space-y-2">
                {winningPatterns.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-green-400 mt-0.5">•</span>
                    {p}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No winning patterns detected.</p>
            )}
          </div>

          {/* You do Y */}
          <div className="p-4 bg-red-500/5 border border-red-500/15 rounded-xl">
            <p className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              You do this
            </p>
            {yourGap.length > 0 ? (
              <ul className="space-y-2">
                {yourGap.map((g, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-red-400 mt-0.5">•</span>
                    {g}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No major gaps detected.</p>
            )}
          </div>
        </div>

        {/* Example peers */}
        {examplePeers.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-400 mb-3">Real peer examples</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {examplePeers.map((peer, i) => (
                <div
                  key={i}
                  className="bg-black/40 border border-gray-800/50 rounded-xl overflow-hidden"
                >
                  <div className="relative aspect-video bg-black/40 overflow-hidden">
                    {peer.thumbnailUrl && (
                      <img
                        src={peer.thumbnailUrl}
                        alt={peer.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm text-white font-medium line-clamp-2">{peer.title}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {formatCount(peer.subscribers)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {formatCount(peer.views)}
                      </span>
                    </div>
                    {peer.whyItWorks && (
                      <p className="text-xs text-gray-400 mt-2 italic">{peer.whyItWorks}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.section>

      {/* Performance pattern */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-black/50 border border-gray-800/30 rounded-2xl p-5 sm:p-6 backdrop-blur-sm mb-6"
      >
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#fa7517]" />
          Your performance pattern
        </h2>

        {performancePattern?.verdict && (
          <p className="text-sm text-gray-300 bg-black/40 border border-gray-800/50 rounded-xl p-4 mb-5">
            {performancePattern.verdict}
          </p>
        )}

        <div className="grid sm:grid-cols-3 gap-3 mb-5">
          <div className="p-4 bg-black/40 border border-gray-800/50 rounded-xl text-center">
            <p className="text-xs text-gray-500 mb-1">Median views</p>
            <p className="text-xl font-bold text-white">{formatCount(performancePattern?.median)}</p>
          </div>
          <div className="p-4 bg-black/40 border border-gray-800/50 rounded-xl text-center">
            <p className="text-xs text-gray-500 mb-1 flex items-center justify-center gap-1">
              <Type className="w-3 h-3" /> Avg title length
            </p>
            <p className="text-xl font-bold text-white">
              {performancePattern?.titleStats?.avgWordCount ?? '—'}
              <span className="text-sm text-gray-500 font-normal"> words</span>
            </p>
            {performancePattern?.titleStats?.overLong && (
              <p className="text-[11px] text-orange-400 mt-1">titles run long</p>
            )}
          </div>
          <div className="p-4 bg-black/40 border border-gray-800/50 rounded-xl text-center">
            <p className="text-xs text-gray-500 mb-1 flex items-center justify-center gap-1">
              <Layers className="w-3 h-3" /> Formats found
            </p>
            <p className="text-xl font-bold text-white">{formatClusters.length}</p>
          </div>
        </div>

        {/* Format clusters */}
        {formatClusters.length > 0 && (
          <div className="space-y-2 mb-5">
            {formatClusters.map((cluster, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 p-3 bg-black/40 border border-gray-800/50 rounded-xl"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{cluster.label}</p>
                  {cluster.sampleTitles && cluster.sampleTitles.length > 0 && (
                    <p className="text-xs text-gray-500 truncate">
                      e.g. {cluster.sampleTitles[0]}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-white">{formatCount(cluster.avgViews)}</p>
                  <p className="text-[11px] text-gray-500">
                    avg · {cluster.videoCount} video{cluster.videoCount === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Outliers */}
        {(overperformers.length > 0 || underperformers.length > 0) && (
          <div className="grid sm:grid-cols-2 gap-4">
            {overperformers.length > 0 && (
              <div>
                <p className="text-sm font-medium text-green-400 mb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" /> Overperformers
                </p>
                <div className="space-y-1.5">
                  {overperformers.map((o, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-gray-300 truncate">{o.title}</span>
                      <span className="text-green-400 font-medium flex-shrink-0">
                        {o.ratio.toFixed(1)}×
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {underperformers.length > 0 && (
              <div>
                <p className="text-sm font-medium text-red-400 mb-2 flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4" /> Underperformers
                </p>
                <div className="space-y-1.5">
                  {underperformers.map((o, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-gray-300 truncate">{o.title}</span>
                      <span className="text-red-400 font-medium flex-shrink-0">
                        {o.ratio.toFixed(2)}×
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.section>

      {/* Per-video critique + fix CTA */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-[#fa7517]" />
          Video-by-video packaging read
        </h2>

        <div className="space-y-4">
          {perVideo.map((video, index) => (
            <motion.div
              key={video.videoId || index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
              className="bg-black/50 border border-gray-800/30 rounded-2xl overflow-hidden backdrop-blur-sm hover:border-[#fa7517]/30 transition-colors"
            >
              <div className="flex flex-col sm:flex-row">
                {/* Thumbnail */}
                <div className="relative w-full sm:w-64 flex-shrink-0 aspect-video bg-black/40 overflow-hidden">
                  {video.thumbnailUrl && (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-black/70 rounded text-xs text-white">
                    <Eye className="w-3 h-3" />
                    {formatCount(video.views)}
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 p-4 sm:p-5 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-sm font-semibold text-white line-clamp-2">{video.title}</h3>
                    {typeof video.score === 'number' && (
                      <span
                        className={`text-sm font-bold flex-shrink-0 ${scoreColor(video.score)}`}
                        title="Packaging score"
                      >
                        {video.score}/10
                      </span>
                    )}
                  </div>

                  {video.issues && video.issues.length > 0 && (
                    <ul className="space-y-1.5 mb-4">
                      {video.issues.map((issue, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                          <AlertTriangle className="w-3.5 h-3.5 text-orange-400 flex-shrink-0 mt-0.5" />
                          {issue}
                        </li>
                      ))}
                    </ul>
                  )}

                  {video.fix && (
                    <div className="p-3 bg-[#fa7517]/5 border border-[#fa7517]/15 rounded-xl mb-4">
                      <p className="text-sm text-gray-300">
                        <span className="text-[#fa7517] font-semibold">Fix: </span>
                        {video.fix}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => handleFixVideo(video)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#fa7517] to-orange-500 hover:from-[#fa7517]/90 hover:to-orange-500/90 text-white text-sm font-semibold rounded-xl shadow-lg shadow-[#fa7517]/25 transition-all min-h-[44px]"
                  >
                    <Wand2 className="w-4 h-4" />
                    Fix this
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </div>
  );
};

export default ChannelAuditReport;
