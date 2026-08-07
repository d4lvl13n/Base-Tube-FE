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
  CheckCircle2,
  History,
  ChevronRight,
} from 'lucide-react';
import AIThumbnailsLayout from './AIThumbnailsLayout';
import useCTREngine from '../../../hooks/useCTREngine';
import ctrApi from '../../../api/ctr';
import type { ChannelAuditResult, ChannelAuditSummary } from '../../../types/ctr';
import { ChannelAuditReport } from './components/ChannelAuditReport';
import ChannelAuditProgress from './components/ChannelAuditProgress';

const EXAMPLE_CHANNELS = [
  '@MrBeast',
  '@mkbhd',
  'youtube.com/@veritasium',
];

// ---------------------------------------------------------------------------
// OAuth landing
//
// The report's connect CTA starts the YouTube flow with `returnTo=audit`, so the
// backend callback lands the creator back HERE with either `?ytLinked=1` or
// `?ytError=<code>`. The audit itself is not re-run automatically: it costs a
// generation, and a creator who just connected may want to audit a different
// channel. We remember what they audited and offer to run it again.
// ---------------------------------------------------------------------------

const LAST_AUDIT_URL_KEY = 'bt.channelAudit.lastUrl';

/** One message per backend error code. Unknown codes still say something useful. */
const YT_ERROR_MESSAGES: Record<string, string> = {
  // Signed OAuth state failed verification: expired, tampered, or issued before
  // the signing rollout. Nothing was linked.
  state:
    'That connection link could not be verified — it may simply have expired. Nothing was changed. Please start the connection again.',
  // The YouTube channel is already owned by a different BaseTube account, so the
  // callback refused to move it.
  channel_owned:
    'This YouTube channel is already linked to another BaseTube account. Disconnect it there first, or connect a different channel.',
  callbackFailed:
    'YouTube could not complete the connection. Nothing was changed — please try again.',
  // The Google account has no YouTube channel (or the grant lacked the YouTube
  // scope) — nothing was linked or persisted.
  noChannel:
    "That Google account doesn't have a YouTube channel to connect. Nothing was changed — try a Google account that owns your channel.",
};

const ytErrorMessage = (code: string): string =>
  YT_ERROR_MESSAGES[code] ||
  'The YouTube connection did not complete. Nothing was changed — please try again.';

type OAuthNotice =
  | { kind: 'linked' }
  | { kind: 'error'; code: string };

/**
 * Read the OAuth result params. PURE on purpose — it runs in a `useState`
 * initializer, which React 18 StrictMode invokes twice in development; stripping
 * the params here would make the second pass return nothing. The strip happens
 * in an effect instead (idempotent).
 */
const readOAuthNotice = (): OAuthNotice | null => {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const error = params.get('ytError');
  if (error) return { kind: 'error', code: error };
  return params.get('ytLinked') ? { kind: 'linked' } : null;
};

/** Take the OAuth params out of the address bar once the banner owns them. */
const stripOAuthParams = (): void => {
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('ytLinked') && !url.searchParams.has('ytError')) return;
    url.searchParams.delete('ytLinked');
    url.searchParams.delete('ytError');
    window.history.replaceState({}, document.title, url.toString());
  } catch {
    /* URL cleanup is cosmetic — never let it break the landing. */
  }
};

const readLastAuditUrl = (): string => {
  try {
    return window.sessionStorage.getItem(LAST_AUDIT_URL_KEY) || '';
  } catch {
    return '';
  }
};

/** "1.2M subscribers" — compact, list-row scale. */
const formatSubscribers = (subs: number | null): string => {
  if (subs === null) return '';
  if (subs >= 1_000_000) return `${(subs / 1_000_000).toFixed(1).replace(/\.0$/, '')}M subs`;
  if (subs >= 1_000) return `${(subs / 1_000).toFixed(1).replace(/\.0$/, '')}K subs`;
  return `${subs} subs`;
};

const formatAuditDate = (iso: string | null): string => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
};

/** Honest one-word label per data source mode — mirrors the report's badge. */
const DATA_MODE_LABELS: Record<string, string> = {
  preview: 'Public data',
  uploaded: 'Self-reported',
  connected_partial: 'Connected',
  connected_full: 'Connected',
  hybrid: 'Connected + upload',
};

const ChannelAuditPage: React.FC = () => {
  // Reuse the CTR engine for the quota/credit sidebar in the shared layout.
  const { usageAccess, isLoadingQuota } = useCTREngine();

  // Returning from the OAuth callback? Prefill with whatever they audited before
  // connecting so "run it again" is one click.
  const [oauthNotice, setOauthNotice] = useState<OAuthNotice | null>(readOAuthNotice);
  const [channelUrl, setChannelUrl] = useState(() =>
    oauthNotice ? readLastAuditUrl() : ''
  );
  const [audit, setAudit] = useState<ChannelAuditResult | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persistence, SURFACED: past audits live in the backend — this page now
  // restores the most recent one on load (instead of greeting a returning
  // creator with an empty form) and lists the rest for one-click re-opening.
  // Re-opening is FREE and refreshing: GET /:id overlays current metrics onto
  // the frozen analysis, so a two-day-old report comes back with today's data.
  const [history, setHistory] = useState<ChannelAuditSummary[]>([]);
  const [isRestoring, setIsRestoring] = useState(true);
  const [openingAuditId, setOpeningAuditId] = useState<number | null>(null);

  /** Open a persisted audit. Also primes the URL field so "re-run" works. */
  const openAudit = async (summary: ChannelAuditSummary) => {
    if (openingAuditId !== null || isAuditing) return;
    setError(null);
    setOpeningAuditId(summary.id);
    try {
      const stored = await ctrApi.getChannelAudit(summary.id);
      setAudit(stored);
      if (summary.channelRef) setChannelUrl(summary.channelRef);
    } catch (err: any) {
      setError(err?.message || 'Could not open that audit. Please try again.');
    } finally {
      setOpeningAuditId(null);
    }
  };

  // On load: fetch the history and auto-restore the latest audit. Skipped when
  // a dev fixture is driving the page. Any failure degrades to the empty form —
  // restoring is a convenience, never a gate.
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const which = new URLSearchParams(window.location.search).get('fixture');
      if (which) {
        setIsRestoring(false);
        return;
      }
    }
    let cancelled = false;
    (async () => {
      try {
        const summaries = await ctrApi.listChannelAudits();
        if (cancelled) return;
        setHistory(summaries);
        const latest = summaries[0];
        if (!latest) return;
        const stored = await ctrApi.getChannelAudit(latest.id);
        if (cancelled) return;
        setAudit((current) => current ?? stored);
        if (latest.channelRef) {
          setChannelUrl((current) => current || latest.channelRef);
        }
      } catch {
        /* history is best-effort — the form is always available */
      } finally {
        if (!cancelled) setIsRestoring(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The banner now owns the OAuth result — get it out of the URL so a refresh
  // (or a shared link) does not replay it.
  React.useEffect(stripOAuthParams, []);

  // DEV ONLY — render the frozen-contract fixtures without a backend:
  //   v2   ?fixture=v2 | preview | syncing | mismatched | reauth | v1
  //   v2.1 ?fixture=v21preview | partial | full | uploaded | stale | hybrid
  // Lazy import so the fixtures never reach a production bundle.
  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    const which = new URLSearchParams(window.location.search).get('fixture');
    if (!which) return;
    let cancelled = false;
    import('../../../mocks/channelAuditV2.fixture').then((m) => {
      if (cancelled) return;
      // v2 (pre-dataMode) — these must keep rendering exactly as they did.
      if (which === 'v1') setAudit(m.channelAuditV1LegacyFixture);
      else if (which === 'preview') setAudit(m.channelAuditV2PreviewFixture);
      else if (which === 'syncing') setAudit(m.channelAuditV2SyncingFixture);
      else if (which === 'mismatched') setAudit(m.channelAuditV2MismatchedFixture);
      else if (which === 'reauth') setAudit(m.channelAuditV2ReauthFixture);
      // v2.1 — one fixture per dataMode.
      else if (which === 'v21preview') setAudit(m.channelAuditV21PreviewFixture);
      else if (which === 'partial') setAudit(m.channelAuditV21ConnectedPartialFixture);
      else if (which === 'full') setAudit(m.channelAuditV21ConnectedFullFixture);
      else if (which === 'uploaded') setAudit(m.channelAuditV21UploadedFixture);
      else if (which === 'stale') setAudit(m.channelAuditV21UploadedStaleFixture);
      else if (which === 'hybrid') setAudit(m.channelAuditV21HybridFixture);
      else setAudit(m.channelAuditV2Fixture);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const runAudit = async (rawUrl: string) => {
    const trimmed = rawUrl.trim();
    if (!trimmed || isAuditing) return;

    // Remembered so a creator who leaves for the Google consent screen can come
    // back and re-run the same audit without retyping it.
    try {
      window.sessionStorage.setItem(LAST_AUDIT_URL_KEY, trimmed);
    } catch {
      /* private mode / storage disabled — the flow just loses the prefill. */
    }

    setError(null);
    setIsAuditing(true);
    try {
      const result = await ctrApi.auditChannel(trimmed);
      setAudit(result);
      // The fresh audit is now the newest history row — refresh the list so
      // "New audit" shows it without a page reload. Fire-and-forget.
      void ctrApi.listChannelAudits().then(setHistory);
    } catch (err: any) {
      setError(err?.message || 'Failed to audit channel. Please try again.');
    } finally {
      setIsAuditing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await runAudit(channelUrl);
  };

  const handleReset = () => {
    setAudit(null);
    setError(null);
    setChannelUrl('');
  };

  return (
    <AIThumbnailsLayout usageAccess={usageAccess} isLoadingQuota={isLoadingQuota}>
      {/* OAuth landing — the result of the report's "Connect YouTube" CTA */}
      <AnimatePresence>
        {oauthNotice && (
          <motion.div
            key="oauth-notice"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`max-w-3xl mx-auto mb-6 p-4 rounded-xl flex items-start gap-3 backdrop-blur-sm border ${
              oauthNotice.kind === 'linked'
                ? 'bg-[#fa7517]/10 border-[#fa7517]/30'
                : 'bg-red-500/10 border-red-500/20'
            }`}
          >
            {oauthNotice.kind === 'linked' ? (
              <CheckCircle2 className="w-5 h-5 text-[#fa7517] flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            )}

            <div className="flex-1 min-w-0">
              {oauthNotice.kind === 'linked' ? (
                <>
                  <p className="text-white font-semibold">
                    Connected — metrics start syncing now.
                  </p>
                  <p className="text-sm text-gray-300 mt-1">
                    YouTube backfills impressions and CTR asynchronously, so the first data can
                    take up to 48h to appear. Re-run the audit any time — the evidence and
                    experiments don’t wait on it.
                  </p>
                  {channelUrl.trim() && (
                    <button
                      type="button"
                      onClick={() => runAudit(channelUrl)}
                      disabled={isAuditing}
                      className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white
                                 bg-gradient-to-r from-[#fa7517] to-orange-500 hover:from-[#fa7517]/90 hover:to-orange-500/90
                                 shadow-lg shadow-[#fa7517]/25 transition-all min-h-[44px]
                                 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <RefreshCw className={`w-4 h-4 ${isAuditing ? 'animate-spin' : ''}`} />
                      Re-run the audit for {channelUrl.trim()}
                    </button>
                  )}
                </>
              ) : (
                <>
                  <p className="text-white font-semibold">YouTube wasn’t connected</p>
                  <p className="text-sm text-red-200/90 mt-1">
                    {ytErrorMessage(oauthNotice.code)}
                  </p>
                </>
              )}
            </div>

            <button
              onClick={() => setOauthNotice(null)}
              aria-label="Dismiss"
              className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
        {!audit && isRestoring ? (
          // Checking for a previous audit — a quiet beat instead of flashing the
          // empty form at a creator whose report is about to reappear.
          <motion.div
            key="restoring"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-3xl mx-auto py-24 flex flex-col items-center gap-3 text-gray-400"
          >
            <RefreshCw className="w-6 h-6 animate-spin text-[#fa7517]" />
            <p className="text-sm">Looking for your last audit…</p>
          </motion.div>
        ) : audit ? (
          <motion.div
            key="report"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <ChannelAuditReport
              audit={audit}
              onReset={handleReset}
              // A Studio import lands outside the audit snapshot, so the report
              // offers a re-run rather than pretending it refreshed itself.
              onRerunAudit={
                channelUrl.trim() ? () => runAudit(channelUrl) : undefined
              }
            />
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

            {/* Previous audits — persistence, finally visible. One click
                re-opens a report (with metrics refreshed at read time). */}
            {history.length > 0 && !isAuditing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-6 bg-black/50 border border-gray-800/30 rounded-2xl p-4 sm:p-5 backdrop-blur-sm"
              >
                <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
                  <History className="w-4 h-4 text-[#fa7517]" />
                  Your previous audits
                </h2>
                <ul className="space-y-2">
                  {history.map((summary) => (
                    <li key={summary.id}>
                      <button
                        type="button"
                        onClick={() => openAudit(summary)}
                        disabled={openingAuditId !== null}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-800/50 bg-black/40
                                   hover:border-[#fa7517]/30 transition-colors text-left min-h-[44px]
                                   disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {summary.channelTitle || summary.channelRef}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {[
                              formatSubscribers(summary.subscribers),
                              summary.niche,
                              formatAuditDate(summary.createdAt),
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        </div>
                        {summary.dataMode && DATA_MODE_LABELS[summary.dataMode] && (
                          <span className="flex-shrink-0 px-2 py-0.5 rounded-md border border-gray-700/60 bg-white/5 text-[10px] font-semibold text-gray-400">
                            {DATA_MODE_LABELS[summary.dataMode]}
                          </span>
                        )}
                        {openingAuditId === summary.id ? (
                          <RefreshCw className="w-4 h-4 flex-shrink-0 animate-spin text-[#fa7517]" />
                        ) : (
                          <ChevronRight className="w-4 h-4 flex-shrink-0 text-gray-600" />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

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
