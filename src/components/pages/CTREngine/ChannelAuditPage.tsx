// src/components/pages/CTREngine/ChannelAuditPage.tsx
// Channel Packaging Audit — the hero feature.
// Paste a channel URL → POST /api/v1/ctr/channel-audit → render the v2 report:
// positioning, an evidence board of observed facts + hedged hypotheses, the
// experiments to run, a swipe file, and a descriptive review queue.
// It does NOT claim to know why a video wasn't clicked — it says what is there
// and what to test. Legacy v1 rows render through the minimal legacy view.

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ScanSearch,
  AlertCircle,
  X,
  RefreshCw,
  Link2,
  ClipboardList,
  BookMarked,
  FlaskConical,
} from 'lucide-react';
import AIThumbnailsLayout from './AIThumbnailsLayout';
import useCTREngine from '../../../hooks/useCTREngine';
import ctrApi from '../../../api/ctr';
import type { ChannelAuditResult } from '../../../types/ctr';
import { ChannelAuditReport } from './components/ChannelAuditReport';
import ChannelAuditProgress from './components/ChannelAuditProgress';

const EXAMPLE_CHANNELS = [
  '@MrBeast',
  '@mkbhd',
  'youtube.com/@veritasium',
];

const ChannelAuditPage: React.FC = () => {
  // Reuse the CTR engine for the quota/credit sidebar in the shared layout.
  const { usageAccess, isLoadingQuota } = useCTREngine();

  const [channelUrl, setChannelUrl] = useState('');
  const [audit, setAudit] = useState<ChannelAuditResult | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // DEV ONLY — render the frozen-contract fixture without a backend:
  //   /ai-thumbnails/channel-audit?fixture=v2 | preview | syncing | v1
  // Lazy import so the fixture never reaches a production bundle.
  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    const which = new URLSearchParams(window.location.search).get('fixture');
    if (!which) return;
    let cancelled = false;
    import('../../../mocks/channelAuditV2.fixture').then((m) => {
      if (cancelled) return;
      if (which === 'v1') setAudit(m.channelAuditV1LegacyFixture);
      else if (which === 'preview') setAudit(m.channelAuditV2PreviewFixture);
      else if (which === 'syncing') setAudit(m.channelAuditV2SyncingFixture);
      else setAudit(m.channelAuditV2Fixture);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = channelUrl.trim();
    if (!trimmed || isAuditing) return;

    setError(null);
    setIsAuditing(true);
    try {
      const result = await ctrApi.auditChannel(trimmed);
      setAudit(result);
    } catch (err: any) {
      setError(err?.message || 'Failed to audit channel. Please try again.');
    } finally {
      setIsAuditing(false);
    }
  };

  const handleReset = () => {
    setAudit(null);
    setError(null);
    setChannelUrl('');
  };

  return (
    <AIThumbnailsLayout usageAccess={usageAccess} isLoadingQuota={isLoadingQuota}>
      {/* Error */}
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
              onClick={() => setError(null)}
              className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {audit ? (
          <motion.div
            key="report"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <ChannelAuditReport audit={audit} onReset={handleReset} />
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-3xl mx-auto"
          >
            {/* Intro */}
            <div className="text-center mb-8">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#fa7517]/20 to-orange-500/10 flex items-center justify-center border border-[#fa7517]/20">
                <ScanSearch className="w-7 h-7 text-[#fa7517]" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Channel Packaging Audit
              </h1>
              <p className="text-gray-400 max-w-xl mx-auto">
                See what a strategist would change — and how to prove it. Paste a channel
                and get what's actually observable in your packaging, plus the experiments
                that would settle it.
              </p>
            </div>

            {/* Form */}
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black/50 border border-gray-800/30 rounded-2xl p-4 sm:p-6 backdrop-blur-sm mb-6"
            >
              <label className="block text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-[#fa7517]" />
                Channel URL or @handle
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={channelUrl}
                  onChange={(e) => setChannelUrl(e.target.value)}
                  placeholder="youtube.com/@yourchannel  or  @yourchannel"
                  disabled={isAuditing}
                  className="flex-1 px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white
                            placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#fa7517]/50
                            focus:border-[#fa7517]/50 backdrop-blur-sm transition-all"
                />
                <motion.button
                  type="submit"
                  disabled={isAuditing || !channelUrl.trim()}
                  whileHover={{ scale: !isAuditing && channelUrl.trim() ? 1.02 : 1 }}
                  whileTap={{ scale: !isAuditing && channelUrl.trim() ? 0.98 : 1 }}
                  className={`px-6 py-3.5 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 min-h-[52px]
                             ${
                               !isAuditing && channelUrl.trim()
                                 ? 'bg-gradient-to-r from-[#fa7517] to-orange-500 hover:from-[#fa7517]/90 hover:to-orange-500/90 shadow-lg shadow-[#fa7517]/25'
                                 : 'bg-white/10 cursor-not-allowed text-gray-400'
                             }`}
                >
                  {isAuditing ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Auditing...
                    </>
                  ) : (
                    <>
                      <ScanSearch className="w-5 h-5" />
                      Audit channel
                    </>
                  )}
                </motion.button>
              </div>

              {/* Examples */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-500">Try:</span>
                {EXAMPLE_CHANNELS.map((example) => (
                  <button
                    key={example}
                    type="button"
                    disabled={isAuditing}
                    onClick={() => setChannelUrl(example)}
                    className="px-3 py-1.5 bg-black/50 hover:bg-[#fa7517]/10 border border-gray-800/50 hover:border-[#fa7517]/30 rounded-lg text-xs text-gray-400 hover:text-white transition-all"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </motion.form>

            {/* Auditing progress */}
            <AnimatePresence>{isAuditing && <ChannelAuditProgress />}</AnimatePresence>

            {/* What you'll get */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`grid sm:grid-cols-3 gap-4 ${isAuditing ? 'hidden' : ''}`}
            >
              {[
                {
                  icon: ClipboardList,
                  title: 'Evidence',
                  desc: 'What is literally there in each thumbnail and title — counted, not guessed.',
                },
                {
                  icon: FlaskConical,
                  title: 'Experiments',
                  desc: 'Ordered, falsifiable tests with a variant brief and how to measure it.',
                },
                {
                  icon: BookMarked,
                  title: 'Swipe file',
                  desc: 'Packaging worth studying in your niche, honestly labelled by size.',
                },
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
          </motion.div>
        )}
      </AnimatePresence>
    </AIThumbnailsLayout>
  );
};

export default ChannelAuditPage;
