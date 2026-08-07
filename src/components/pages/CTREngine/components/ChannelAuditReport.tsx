// src/components/pages/CTREngine/components/ChannelAuditReport.tsx
// Renders the v2 channel packaging audit (frozen contract:
// base-be docs/specs/moat-phase-0-1-spec.md — "THE v2 AUDIT CONTRACT").
//
// Section order is part of the product, not decoration:
//   1. Positioning     — what this channel is, before any judgment
//   2. Evidence board  — observed facts + a HEDGED hypothesis per video
//   3. Experiments     — priority-ordered, falsifiable, with a variant brief
//   4. Swipe file      — references, honestly labelled by size match
//   5. Review queue    — descriptive view spread, age caveat mandatory
//
// Deliberately absent: scores, "why winners win", impact labels, predicted lift,
// any causal claim about a thumbnail. Observations are facts; everything else is
// a hypothesis to TEST. v1 rows render through ChannelAuditLegacyReport.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Wand2,
  Users,
  Eye,
  Compass,
  ClipboardList,
  FlaskConical,
  BookMarked,
  ListChecks,
  ExternalLink,
  HelpCircle,
  Search,
  Info,
  Clock,
  MousePointerClick,
  Sparkles,
} from 'lucide-react';
import {
  isChannelAuditV2,
  type ChannelAuditResult,
  type ChannelPackagingAuditV2,
  type ChannelAuditV2PerVideo,
  type ChannelAuditV2Experiment,
  type ChannelAuditV2VideoMetrics,
} from '../../../../types/ctr';
import ChannelAuditLegacyReport from './ChannelAuditLegacyReport';
import ChannelAuditConnectBanner from './ChannelAuditConnectBanner';

interface ChannelAuditReportProps {
  audit: ChannelAuditResult;
  onReset: () => void;
}

// Compact number formatter: 8100 -> "8.1K", 1200000 -> "1.2M"
const formatCount = (value: number | undefined | null): string => {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
};

// seconds -> "6:42"
const formatDuration = (seconds: number | null | undefined): string => {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds)) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

const videoAnchorId = (videoId: string) => `audit-video-${videoId}`;
const experimentAnchorId = (experimentId: string) => `audit-experiment-${experimentId}`;

const scrollToAnchor = (anchorId: string) => {
  const el = document.getElementById(anchorId);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// ---------------------------------------------------------------------------
// Evidence-strength chip (connected mode only)
// 'insufficient' is intentionally grey and worded as an absence of data, never
// as a weak signal — below ~1k impressions there is nothing to read.
// ---------------------------------------------------------------------------
const EVIDENCE_CHIP: Record<
  ChannelAuditV2VideoMetrics['evidenceStrength'],
  { label: string; className: string; title: string }
> = {
  insufficient: {
    label: 'not enough data',
    className: 'bg-white/5 text-gray-400 border-white/10',
    title: 'Too few impressions to read anything into this video’s CTR.',
  },
  directional: {
    label: 'directional',
    className: 'bg-[#fa7517]/10 text-[#fa7517] border-[#fa7517]/25',
    title: 'Enough impressions to point somewhere — not enough to conclude.',
  },
  observational: {
    label: 'observational',
    className: 'bg-blue-500/10 text-blue-300 border-blue-500/25',
    title: 'Enough impressions to describe what happened. Still not a cause.',
  },
};

const MetricsRow: React.FC<{ metrics: ChannelAuditV2VideoMetrics }> = ({ metrics }) => {
  const chip = EVIDENCE_CHIP[metrics.evidenceStrength] ?? EVIDENCE_CHIP.insufficient;
  const muted = metrics.evidenceStrength === 'insufficient';

  return (
    <div className="mt-4 p-3 bg-black/40 border border-gray-800/50 rounded-xl">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className="flex items-center gap-1.5 text-sm text-gray-300">
          <Eye className="w-3.5 h-3.5 text-gray-500" />
          {metrics.impressions !== null ? formatCount(metrics.impressions) : '—'}
          <span className="text-gray-500 text-xs">impressions</span>
        </span>
        <span
          className={`flex items-center gap-1.5 text-sm ${muted ? 'text-gray-500' : 'text-gray-300'}`}
        >
          <MousePointerClick className="w-3.5 h-3.5 text-gray-500" />
          {metrics.ctr !== null ? `${metrics.ctr.toFixed(1)}%` : '—'}
          <span className="text-gray-500 text-xs">CTR</span>
        </span>
        {metrics.averageViewDuration !== null && (
          <span className="flex items-center gap-1.5 text-sm text-gray-300">
            <Clock className="w-3.5 h-3.5 text-gray-500" />
            {formatDuration(metrics.averageViewDuration)}
            <span className="text-gray-500 text-xs">avg view</span>
          </span>
        )}
        <span
          title={chip.title}
          className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded border ${chip.className}`}
        >
          {chip.label}
        </span>
      </div>

      {metrics.dominantTrafficSource && (
        <p className="text-xs text-gray-500 mt-2">
          Mostly seen via <span className="text-gray-400">{metrics.dominantTrafficSource}</span>
        </p>
      )}
      {metrics.baselineDelta && (
        <p className="text-xs text-gray-400 mt-1">{metrics.baselineDelta}</p>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------

export const ChannelAuditReport: React.FC<ChannelAuditReportProps> = ({ audit, onReset }) => {
  const navigate = useNavigate();

  // v1 rows are never cast into the v2 shape — they get their own thin view.
  if (!isChannelAuditV2(audit)) {
    return <ChannelAuditLegacyReport audit={audit} onReset={onReset} />;
  }

  const v2: ChannelPackagingAuditV2 = audit;
  const {
    channel,
    positioning,
    headline,
    perVideo = [],
    experiments = [],
    swipeFile,
    reviewQueue,
    mode,
    analyticsStatus,
    connectionStatus,
  } = v2;

  // Connection state, resolved defensively. `connectionStatus` is ADDITIVE
  // (MOAT D2) and absent on older backends, so `mode` remains the source of
  // truth for "is this preview?" and the status only refines WHY.
  const isPreview = mode === 'preview';
  const isSyncing = analyticsStatus === 'syncing' || connectionStatus === 'syncing';
  const needsReauth =
    analyticsStatus === 'reauth_required' || connectionStatus === 'reauth_required';
  // The ask: a preview report is missing the creator's own numbers. Also shown
  // for a live report whose grant died — that one degrades to public data too.
  const showConnectBanner = (isPreview && !isSyncing) || needsReauth;

  const orderedExperiments = [...experiments].sort((a, b) => a.priority - b.priority);
  const experimentById = new Map<string, ChannelAuditV2Experiment>(
    experiments.map((exp) => [exp.id, exp])
  );
  const videoTitleById = new Map<string, string>(perVideo.map((v) => [v.videoId, v.title]));

  // Channel-level counts: strictly counts of what the audit itself contains.
  const observationCount = perVideo.reduce((sum, v) => sum + (v.observed?.length ?? 0), 0);

  // "Generate this variant →" — hand the variant brief to the existing generator.
  const handleGenerateVariant = (experiment: ChannelAuditV2Experiment) => {
    const params = new URLSearchParams({
      mode: 'ctr',
      prompt: experiment.variantBrief.thumbnail,
    });
    navigate(`/ai-thumbnails/generate?${params.toString()}`);
  };

  const swipeIsAspirational = swipeFile?.size?.match === 'aspirational';

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

      {/* ------------------------------------------------------------------ */}
      {/* 1. POSITIONING — what this channel is, first and prominently        */}
      {/* ------------------------------------------------------------------ */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#fa7517]/10 to-orange-500/5 border border-[#fa7517]/20 rounded-2xl p-6 sm:p-8 backdrop-blur-sm mb-6"
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400 mb-4">
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
          {mode === 'connected' && (
            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-300 border border-blue-500/25 text-[10px] font-semibold uppercase tracking-wide rounded">
              connected
            </span>
          )}
        </div>

        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#fa7517] mb-2">
          <Compass className="w-4 h-4" />
          Positioning
        </p>
        <p className="text-lg sm:text-xl text-white font-semibold leading-snug">{positioning}</p>

        {headline && (
          <p className="mt-5 pt-5 border-t border-white/10 text-sm sm:text-base text-gray-300 leading-relaxed">
            {headline}
          </p>
        )}
      </motion.section>

      {/* Connect / reconnect / wrong-channel — the report's main ask when it has
          no real numbers to show. Placed straight under Positioning so it is the
          first thing after "here is what your channel is". */}
      {showConnectBanner && <ChannelAuditConnectBanner connectionStatus={connectionStatus} />}

      {/* Analytics status (connected mode) */}
      {isSyncing && (
        <div className="mb-6 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl flex items-start gap-3">
          <Info className="w-4 h-4 text-blue-300 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-100/80">
            YouTube Analytics is connected and syncing — first metrics can take up to 48h. The
            evidence and experiments below don’t wait on it.
          </p>
        </div>
      )}
      {connectionStatus === 'mismatched' && (
        <div className="mb-6 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl flex items-start gap-3">
          <Info className="w-4 h-4 text-blue-300 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-100/80">
            Connected metrics only exist for the channel you linked — this audit is for another
            one, so everything below is read from public data.
          </p>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 2. EVIDENCE BOARD                                                   */}
      {/* ------------------------------------------------------------------ */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-8"
      >
        <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-[#fa7517]" />
          Evidence board
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          What is literally observable in your packaging. Facts first — every reading of them is
          marked as a hypothesis.
        </p>

        {/* Channel-level counts (counts of this audit's own contents) */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="p-4 bg-black/40 border border-gray-800/50 rounded-xl text-center">
            <p className="text-xl font-bold text-white">{perVideo.length}</p>
            <p className="text-xs text-gray-500 mt-1">videos examined</p>
          </div>
          <div className="p-4 bg-black/40 border border-gray-800/50 rounded-xl text-center">
            <p className="text-xl font-bold text-white">{observationCount}</p>
            <p className="text-xs text-gray-500 mt-1">observations recorded</p>
          </div>
          <div className="p-4 bg-black/40 border border-gray-800/50 rounded-xl text-center">
            <p className="text-xl font-bold text-white">{experiments.length}</p>
            <p className="text-xs text-gray-500 mt-1">experiments proposed</p>
          </div>
        </div>

        <div className="space-y-4">
          {perVideo.map((video: ChannelAuditV2PerVideo, index: number) => {
            const experiment = video.experimentId
              ? experimentById.get(video.experimentId)
              : undefined;

            return (
              <motion.div
                key={video.videoId || index}
                id={videoAnchorId(video.videoId)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.03 * index }}
                className="scroll-mt-24 bg-black/50 border border-gray-800/30 rounded-2xl overflow-hidden backdrop-blur-sm hover:border-[#fa7517]/30 transition-colors"
              >
                {/* `flex-wrap` rather than `flex-col sm:flex-row`: this app emits
                    `.flex-col` AFTER `.sm:flex-row`, so the responsive variant
                    loses. Wrapping on a full-width thumbnail gives the same
                    stack-then-row behaviour without the specificity fight. */}
                <div className="flex flex-wrap">
                  {/* Thumbnail — capped at 280px so a 320–480px YouTube thumb
                      never renders above its native resolution. The 16:9 box is
                      inline because this app's tailwind build has no
                      `aspect-video` (the aspect-ratio plugin replaces it). */}
                  <a
                    href={video.videoUrl || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ aspectRatio: '16 / 9' }}
                    className={`group/thumb relative self-start w-[280px] max-w-full flex-shrink-0 bg-black/40 overflow-hidden block ${
                      video.videoUrl ? 'cursor-pointer' : 'pointer-events-none'
                    }`}
                  >
                    {video.thumbnailUrl && (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform group-hover/thumb:scale-105"
                      />
                    )}
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-black/70 rounded text-xs text-white">
                      <Eye className="w-3 h-3" />
                      {formatCount(video.views)}
                    </div>
                    {video.videoUrl && (
                      <span className="absolute bottom-2 right-2 flex items-center gap-1 text-[11px] font-medium text-white bg-black/70 px-2 py-1 rounded opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                        <ExternalLink className="w-3 h-3" /> Open
                      </span>
                    )}
                  </a>

                  {/* Body */}
                  <div className="flex-1 p-4 sm:p-5 min-w-0 basis-[280px]">
                    <a
                      href={video.videoUrl || undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-sm font-semibold text-white line-clamp-2 ${
                        video.videoUrl ? 'hover:text-[#fa7517]' : 'pointer-events-none'
                      }`}
                    >
                      {video.title}
                    </a>

                    {/* Observed — countable facts */}
                    {video.observed && video.observed.length > 0 && (
                      <>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mt-4 mb-2">
                          Observed
                        </p>
                        <ul className="space-y-1.5">
                          {video.observed.map((fact, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-sm text-gray-300"
                            >
                              <span className="text-gray-600 mt-1.5 w-1 h-1 rounded-full bg-gray-600 flex-shrink-0" />
                              {fact}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}

                    {/* Hypothesis — visually hedged: dashed border, muted, labelled */}
                    {video.hypothesis && (
                      <div className="mt-4 p-3 bg-white/[0.02] border border-dashed border-gray-700 rounded-xl">
                        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                          <HelpCircle className="w-3.5 h-3.5" />
                          Hypothesis
                          <span className="normal-case font-normal tracking-normal text-gray-600">
                            — unproven until tested
                          </span>
                        </p>
                        <p className="text-sm text-gray-400 italic leading-relaxed">
                          {video.hypothesis}
                        </p>
                      </div>
                    )}

                    {/* Connected-mode metrics */}
                    {video.metrics && <MetricsRow metrics={video.metrics} />}

                    {/* Link to the experiment that covers this video */}
                    {experiment && (
                      <button
                        onClick={() => scrollToAnchor(experimentAnchorId(experiment.id))}
                        className="mt-4 inline-flex items-center gap-2 px-3 py-2 bg-[#fa7517]/10 hover:bg-[#fa7517]/20 border border-[#fa7517]/25 rounded-lg text-xs font-semibold text-[#fa7517] transition-colors"
                      >
                        <FlaskConical className="w-3.5 h-3.5" />
                        Experiment {experiment.priority}: {experiment.title}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* ------------------------------------------------------------------ */}
      {/* 3. EXPERIMENTS TO RUN                                               */}
      {/* ------------------------------------------------------------------ */}
      {orderedExperiments.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-[#fa7517]" />
            Experiments to run
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            In order. Each one is a single change you can actually prove or disprove.
          </p>

          <div className="space-y-4">
            {orderedExperiments.map((experiment) => (
              <div
                key={experiment.id}
                id={experimentAnchorId(experiment.id)}
                className="scroll-mt-24 bg-black/50 border border-gray-800/30 rounded-2xl p-5 sm:p-6 backdrop-blur-sm"
              >
                <div className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-[#fa7517]/25 to-orange-500/10 border border-[#fa7517]/30 flex items-center justify-center text-sm font-bold text-[#fa7517]">
                    {experiment.priority}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-white leading-snug">
                      {experiment.title}
                    </h3>

                    {experiment.hypothesis && (
                      <div className="mt-3 p-3 bg-white/[0.02] border border-dashed border-gray-700 rounded-xl">
                        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                          <HelpCircle className="w-3.5 h-3.5" />
                          Hypothesis
                        </p>
                        <p className="text-sm text-gray-400 italic leading-relaxed">
                          {experiment.hypothesis}
                        </p>
                      </div>
                    )}

                    {/* Variant brief */}
                    <div className="mt-3 p-4 bg-[#fa7517]/5 border border-[#fa7517]/15 rounded-xl">
                      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#fa7517] mb-2">
                        <Sparkles className="w-3.5 h-3.5" />
                        Variant brief
                      </p>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        <span className="text-gray-500">Thumbnail — </span>
                        {experiment.variantBrief.thumbnail}
                      </p>
                      {experiment.variantBrief.title && (
                        <p className="text-sm text-gray-300 leading-relaxed mt-2">
                          <span className="text-gray-500">Title — </span>
                          {experiment.variantBrief.title}
                        </p>
                      )}
                    </div>

                    {/* Method */}
                    {experiment.method && (
                      <p className="mt-3 text-sm text-gray-400">
                        <span className="text-gray-500 font-medium">How to measure: </span>
                        {experiment.method}
                      </p>
                    )}

                    {/* Affected videos — link back to their evidence cards */}
                    {experiment.videoIds && experiment.videoIds.length > 0 && (
                      <div className="mt-4">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-2">
                          Affected videos
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {experiment.videoIds.map((videoId) => (
                            <button
                              key={videoId}
                              onClick={() => scrollToAnchor(videoAnchorId(videoId))}
                              className="max-w-full px-2.5 py-1.5 bg-black/40 hover:bg-white/5 border border-gray-800/60 hover:border-[#fa7517]/30 rounded-lg text-xs text-gray-400 hover:text-white transition-colors truncate"
                            >
                              {videoTitleById.get(videoId) ?? videoId}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => handleGenerateVariant(experiment)}
                      className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#fa7517] to-orange-500 hover:from-[#fa7517]/90 hover:to-orange-500/90 text-white text-sm font-semibold rounded-xl shadow-lg shadow-[#fa7517]/25 transition-all min-h-[44px]"
                    >
                      <Wand2 className="w-4 h-4" />
                      Generate this variant
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 4. SWIPE FILE                                                       */}
      {/* ------------------------------------------------------------------ */}
      {swipeFile && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-black/50 border border-gray-800/30 rounded-2xl p-5 sm:p-6 backdrop-blur-sm mb-8"
        >
          <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-[#fa7517]" />
            Swipe file
          </h2>
          <p className="text-sm text-gray-500 mb-3">
            Packaging worth studying in your niche. Reference material — not a scoreboard.
          </p>

          {/* Size honesty: aspirational must be unmissable */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {swipeIsAspirational ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs font-semibold text-amber-300">
                <Info className="w-3.5 h-3.5" />
                larger channels — for inspiration, not comparison
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-gray-400">
                <Users className="w-3.5 h-3.5" />
                {swipeFile.size?.match === 'mixed'
                  ? 'mixed sizes — check the subscriber count on each'
                  : 'similar-sized channels'}
              </span>
            )}
            {swipeFile.size?.label && (
              <span className="text-xs text-gray-500">{swipeFile.size.label}</span>
            )}
          </div>

          {/* Search queries used to build it */}
          {swipeFile.searchQueries && swipeFile.searchQueries.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <Search className="w-3.5 h-3.5" />
                Found via:
              </span>
              {swipeFile.searchQueries.map((query, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-black/40 border border-gray-800/60 rounded-lg text-xs text-gray-400"
                >
                  {query}
                </span>
              ))}
            </div>
          )}

          {/* Examples — fixed 280px cards, no upscale blur */}
          <div className="flex flex-wrap gap-4">
            {(swipeFile.examples ?? []).map((example, i) => (
              <div
                key={i}
                className="bg-black/40 border border-gray-800/50 rounded-xl overflow-hidden group w-[280px] max-w-full"
              >
                <a
                  href={example.videoUrl || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ aspectRatio: '16 / 9' }}
                  className={`relative block bg-black/40 overflow-hidden ${
                    example.videoUrl ? 'cursor-pointer' : 'pointer-events-none'
                  }`}
                >
                  {example.thumbnailUrl && (
                    <img
                      src={example.thumbnailUrl}
                      alt={example.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  )}
                  {example.videoUrl && (
                    <span className="absolute bottom-2 right-2 flex items-center gap-1 text-[11px] font-medium text-white bg-black/70 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink className="w-3 h-3" /> Watch on YouTube
                    </span>
                  )}
                </a>
                <div className="p-3">
                  <a
                    href={example.videoUrl || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-sm text-white font-medium line-clamp-2 ${
                      example.videoUrl ? 'hover:text-[#fa7517]' : 'pointer-events-none'
                    }`}
                  >
                    {example.title}
                  </a>
                  <p className="text-xs text-gray-400 mt-1 truncate">{example.channelTitle}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {formatCount(example.subscribers)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {formatCount(example.views)}
                    </span>
                  </div>
                  {example.whyInteresting && (
                    <p className="text-xs text-gray-400 mt-2">{example.whyInteresting}</p>
                  )}
                  {example.channelUrl && (
                    <a
                      href={example.channelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white mt-2"
                    >
                      View channel <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 5. REVIEW QUEUE                                                     */}
      {/* ------------------------------------------------------------------ */}
      {reviewQueue && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-black/50 border border-gray-800/30 rounded-2xl p-5 sm:p-6 backdrop-blur-sm mb-6"
        >
          <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-[#fa7517]" />
            Review queue
          </h2>
          <p className="text-sm text-gray-500 mb-3">
            Where this sample sits around its own median of{' '}
            <span className="text-gray-300">{formatCount(reviewQueue.medianViews)}</span> views.
            Descriptive only — a starting point for what to look at next.
          </p>

          {/* MANDATORY caveat */}
          <p className="inline-flex items-center gap-1.5 px-3 py-1.5 mb-5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400">
            <Info className="w-3.5 h-3.5 flex-shrink-0" />
            views not adjusted for upload age
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-300 mb-2">Far above the median</p>
              <div className="space-y-1.5">
                {reviewQueue.high.length > 0 ? (
                  reviewQueue.high.map((item, i) => (
                    <button
                      key={item.videoId || i}
                      onClick={() => scrollToAnchor(videoAnchorId(item.videoId))}
                      className="w-full flex items-center justify-between gap-2 text-left text-sm px-3 py-2 bg-black/40 border border-gray-800/60 hover:border-[#fa7517]/30 rounded-lg transition-colors"
                    >
                      <span className="text-gray-300 truncate">{item.title}</span>
                      <span className="text-gray-400 tabular-nums flex-shrink-0">
                        {formatCount(item.views)}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">None in this sample.</p>
                )}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-300 mb-2">Far below the median</p>
              <div className="space-y-1.5">
                {reviewQueue.low.length > 0 ? (
                  reviewQueue.low.map((item, i) => (
                    <button
                      key={item.videoId || i}
                      onClick={() => scrollToAnchor(videoAnchorId(item.videoId))}
                      className="w-full flex items-center justify-between gap-2 text-left text-sm px-3 py-2 bg-black/40 border border-gray-800/60 hover:border-[#fa7517]/30 rounded-lg transition-colors"
                    >
                      <span className="text-gray-300 truncate">{item.title}</span>
                      <span className="text-gray-400 tabular-nums flex-shrink-0">
                        {formatCount(item.views)}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">None in this sample.</p>
                )}
              </div>
            </div>
          </div>
        </motion.section>
      )}
    </div>
  );
};

export default ChannelAuditReport;
