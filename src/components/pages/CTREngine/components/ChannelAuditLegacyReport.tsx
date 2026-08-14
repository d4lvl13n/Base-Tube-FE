// src/components/pages/CTREngine/components/ChannelAuditLegacyReport.tsx
// Minimal renderer for LEGACY (v1) channel audits — rows persisted before the
// v2 contract. Deliberately thin: headline + whatever per-video issues/fix text
// the row happens to carry, and a prompt to re-run for the current report.
// Nothing here is re-derived or re-worded; v1 rows are shown as they were saved.

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, ExternalLink, History } from 'lucide-react';
import type { ChannelPackagingAudit } from '../../../../types/ctr';
import ChannelAuditRefreshAction from './ChannelAuditRefreshAction';

interface ChannelAuditLegacyReportProps {
  audit: ChannelPackagingAudit;
  onReset: () => void;
  /**
   * Re-runs the SAME channel directly. Distinct from onReset on purpose: reset
   * clears the URL field, so routing the re-run CTA through it would open an
   * empty form and lose the channel the creator is looking at.
   */
  onRerun?: () => void;
  isRerunning?: boolean;
}

const formatCount = (value: number | undefined | null): string => {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
};

export const ChannelAuditLegacyReport: React.FC<ChannelAuditLegacyReportProps> = ({
  audit,
  onReset,
  onRerun,
  isRerunning = false,
}) => {
  const { channel, headline, perVideo = [] } = audit;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <button
          onClick={onReset}
          disabled={isRerunning}
          className="flex min-h-[44px] items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium
                     disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Audit another channel
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/50 border border-gray-800/30 rounded-2xl p-5 sm:p-6 backdrop-blur-sm mb-6"
      >
        <span className="inline-flex items-center gap-1.5 px-2 py-1 mb-4 rounded-md bg-white/5 border border-white/10 text-[11px] font-medium text-gray-400">
          <History className="w-3 h-3" />
          Saved with an older version of the audit
        </span>

        {channel?.title && (
          <p className="text-sm text-gray-400 mb-2">
            <span className="text-white font-semibold">{channel.title}</span>
            {typeof channel.subscribers === 'number' && (
              <> · {formatCount(channel.subscribers)} subscribers</>
            )}
          </p>
        )}

        {headline && (
          <h1 className="text-lg sm:text-xl font-bold text-white leading-snug">{headline}</h1>
        )}
      </motion.div>

      {perVideo.length > 0 && (
        <div className="space-y-3 mb-6">
          {perVideo.map((video, index) => (
            <div
              key={video.videoId || index}
              className="bg-black/50 border border-gray-800/30 rounded-xl p-4 backdrop-blur-sm"
            >
              <a
                href={video.videoUrl || undefined}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-sm font-semibold text-white inline-flex items-start gap-1.5 ${
                  video.videoUrl ? 'hover:text-[#fa7517]' : 'pointer-events-none'
                }`}
              >
                {video.title}
                {video.videoUrl && <ExternalLink className="w-3 h-3 mt-1 flex-shrink-0" />}
              </a>
              <p className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                <Eye className="w-3 h-3" />
                {formatCount(video.views)} views
              </p>

              {video.issues && video.issues.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {video.issues.map((issue, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                      <span className="text-gray-600 mt-0.5">•</span>
                      {issue}
                    </li>
                  ))}
                </ul>
              )}

              {video.fix && <p className="mt-3 text-sm text-gray-300">{video.fix}</p>}
            </div>
          ))}
        </div>
      )}

      <div className="p-5 bg-[#fa7517]/5 border border-[#fa7517]/20 rounded-2xl">
        <p className="text-sm text-white font-semibold mb-1">
          Re-run this audit for the new report
        </p>
        <p className="text-sm text-gray-400 mb-4">
          The current audit reads the channel as evidence and experiments — what is observable in
          each thumbnail, what to test next, and a swipe file to work from.
        </p>
        <ChannelAuditRefreshAction
          onRun={onRerun}
          isRunning={isRerunning}
          className="sm:items-start"
        />
      </div>
    </div>
  );
};

export default ChannelAuditLegacyReport;
