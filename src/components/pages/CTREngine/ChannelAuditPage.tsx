// src/components/pages/CTREngine/ChannelAuditPage.tsx
// Channel Packaging Audit — the hero feature.
// Paste a channel URL → POST /api/v1/ctr/channel-audit → render the v2 report:
// positioning, an evidence board of observed facts + hedged hypotheses, the
// experiments to run, a swipe file, and a descriptive review queue.
// It does NOT claim to know why a video wasn't clicked — it says what is there
// and what to test. Legacy v1 rows render through the minimal legacy view.

import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useAuth } from '../../../contexts/AuthContext';
import { AuthMethod } from '../../../types/auth';
import { getAuditSession, subscribeAuditSession, restoreAuditSession, startAuditSession, clearAuditSession, checkAuditSession, stopWaitingForAuditSession, AUDIT_RECOVERY_WINDOW_MS } from '../../../hooks/channelAuditSession';
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
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import AIThumbnailsLayout from './AIThumbnailsLayout';
import useCTREngine from '../../../hooks/useCTREngine';
import ctrApi from '../../../api/ctr';
import { type ChannelAuditResult, type ChannelAuditSummary, isChannelAuditV2 } from '../../../types/ctr';
import { ChannelAuditReport } from './components/ChannelAuditReport';
import ChannelAuditProgress from './components/ChannelAuditProgress';
import AIThumbnailsSignInOptions from './components/AIThumbnailsSignInOptions';
import { plainApiError, type PlainApiError } from '../../../utils/plainApiError';
import { TechnicalErrorDetail } from '../../common/TechnicalErrorDetail';

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

/** The audit opened from History: /ai-thumbnails/channel-audit?audit=<id>. */
const readAuditIdParam = (search: string): number | null => {
  const id = Number(new URLSearchParams(search).get('audit'));
  return Number.isInteger(id) && id > 0 ? id : null;
};

/** Keep the address bar on the report shown, so a reload reopens it and "Audit another channel" clears it. */
const setAuditIdParam = (id: number | null): void => {
  try {
    const url = new URL(window.location.href);
    if (id) url.searchParams.set('audit', String(id));
    else url.searchParams.delete('audit');
    window.history.replaceState({}, document.title, url.toString());
  } catch {
    /* cosmetic */
  }
};

const readLastAuditUrl = (accountId: string): string => {
  try {
    return window.sessionStorage.getItem(`${LAST_AUDIT_URL_KEY}:${accountId}`) || '';
  } catch {
    return '';
  }
};




/**
 * A failed audit or re-open, in plain words, with what "Try again" repeats.
 * An interrupted transport is reconciled through read-only request lookup.
 * A fresh attempt always requires an explicit click.
 */
type ChannelAuditError = PlainApiError & {
  retry: { kind: 'audit'; channel: string; goal?: string } | { kind: 'open'; summary: ChannelAuditSummary };
};

/** Sending the same request again can help (server trouble, a limit, no answer), unlike a bad channel. */
const canRetry = (error: ChannelAuditError) =>
  error.status === null || error.status === 408 || error.status === 429 || error.status >= 500;

const ChannelAuditPage: React.FC = () => {
  // Reuse the CTR engine for the quota/credit sidebar in the shared layout.
  const { usageAccess, isLoadingQuota, refreshQuota, isAnonymous } = useCTREngine();
  // Channel audits need an account: visitors get the sign-in choices, never a raw 401.
  const [signInRequired, setSignInRequired] = useState(false);
  const needsSignIn = isAnonymous || signInRequired;
  const {isLoaded:clerkLoaded,isSignedIn,user:clerkUser}=useUser();
  const {isAuthenticated:web3Authenticated,user:web3User,isRestoring:web3Restoring}=useAuth();
  const walletAuth=localStorage.getItem('auth_method') === AuthMethod.WEB3;
  const authReady=walletAuth ? !web3Restoring : clerkLoaded;
  const accountId=walletAuth ? (web3Authenticated && web3User ? `web3:${web3User.id}` : 'anonymous') : (isSignedIn && clerkUser ? `clerk:${clerkUser.id}` : 'anonymous');
  const [recoveryStatus,setRecoveryStatus]=useState<'recovering'|'unresolved'|null>(null);
  const ownRequestRef=React.useRef<string|null>(null);


  // Returning from the OAuth callback? Prefill with whatever they audited before
  // connecting so "run it again" is one click.
  const [oauthNotice, setOauthNotice] = useState<OAuthNotice | null>(readOAuthNotice);
  const [channelUrl, setChannelUrl] = useState(() =>
    oauthNotice ? readLastAuditUrl(accountId) : ''
  );
  const [creatorGoal, setCreatorGoal] = useState('');
  const [audit, setAudit] = useState<ChannelAuditResult | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [error, setError] = useState<ChannelAuditError | null>(null);

  // Past audits live in History. This page opens on the form; it shows a saved
  // report only when History links to one (?audit=<id>). Re-opening is FREE and
  // refreshing: GET /:id overlays current metrics onto the frozen analysis.
  const location = useLocation();
  const linkedAuditId = readAuditIdParam(location.search);
  const [isRestoring, setIsRestoring] = useState(() => linkedAuditId !== null);
  const [openingAuditId, setOpeningAuditId] = useState<number | null>(null);
  /**
   * The channel reference of the REPORT ON SCREEN — set only when a report
   * commits, never by typing. The report's "re-run" always uses this, so a
   * half-typed draft in the form (or a late restore landing under it) can
   * never make re-run audit a different channel than the one displayed.
   */
  const [reportChannelRef, setReportChannelRef] = useState('');

  /**
   * Operation generation: every user intent (fresh audit, opening a history
   * row) bumps it; the mount-time restore runs as generation 0. Each async
   * flow re-checks its captured generation before committing, so ONLY the
   * latest intent may write `audit` — a slow historical GET can never
   * overwrite a fresh report that finished after it started.
   */
  const opRef = React.useRef(0);
  React.useEffect(()=>()=>{++opRef.current;},[]);

  // The owner survives route unmounts. Components only subscribe; leaving never cancels work.
  React.useEffect(() => {
    ++opRef.current;
    setAudit(null);setError(null);setIsAuditing(false);setRecoveryStatus(null);setReportChannelRef('');setSignInRequired(false);setOpeningAuditId(null);
    setChannelUrl(oauthNotice ? readLastAuditUrl(accountId) : '');setCreatorGoal('');
    setIsRestoring(linkedAuditId !== null && authReady && accountId !== 'anonymous');
    ownRequestRef.current=null;
    if(!authReady || accountId === 'anonymous') return;
    const sync=()=>{
      const entry=getAuditSession(accountId);
      if(!entry) return;
      // An explicit History link wins over an already-completed in-memory report.
      // The recovered request is over either way, so the re-run button is free again.
      if(linkedAuditId !== null && ownRequestRef.current !== entry.requestKey && entry.status === 'completed') {setRecoveryStatus(null);setIsAuditing(false);return;}
      if((entry.error as any)?.response?.status === 401) {setSignInRequired(true);return;}
      setChannelUrl(entry.channel);setCreatorGoal(entry.goal || '');
      setRecoveryStatus(entry.status === 'recovering' || entry.status === 'unresolved' ? entry.status : null);
      setIsAuditing(['pending','recovering','unresolved'].includes(entry.status));
      if(entry.status === 'completed' && entry.result){
        setError(null);setAudit(entry.result);setReportChannelRef(entry.channel);
        setAuditIdParam(isChannelAuditV2(entry.result) && typeof entry.result.id === 'number' ? entry.result.id : null);
        void refreshQuota();
      } else if(entry.status === 'failed') {
        setError({...plainApiError(entry.error,(entry.error as any)?.response?.status === 503 ? 'The audit did not finish, and no incomplete report was saved. Please try again.' : 'The channel audit did not finish. Please try again.'),retry:{kind:'audit',channel:entry.channel,goal:entry.goal}});
        void refreshQuota();
      }
    };
    const unsubscribe=subscribeAuditSession(accountId,sync);
    restoreAuditSession(accountId);sync();
    return unsubscribe;
    // Account changes invalidate every old component operation and hide its report immediately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[accountId,authReady]);

  /** Open a persisted audit. Also primes the URL field so "re-run" works. */
  const openAudit = async (summary: ChannelAuditSummary) => {
    if (openingAuditId !== null || isAuditing) return;
    const op = ++opRef.current;
    setError(null);
    setOpeningAuditId(summary.id);
    try {
      const stored = await ctrApi.getChannelAudit(summary.id);
      if (opRef.current !== op) return;
      setAudit(stored);
      setCreatorGoal(isChannelAuditV2(stored) ? stored.publicResearch?.creatorGoal || '' : '');
      setReportChannelRef(summary.channelRef || '');
      setAuditIdParam(summary.id);
      if (summary.channelRef) setChannelUrl(summary.channelRef);
    } catch (err: any) {
      if (opRef.current !== op) return;
      if (err?.response?.status === 401) { setSignInRequired(true); return; }
      setError({
        ...plainApiError(err, 'That audit did not open. Please try again.'),
        retry: { kind: 'open', summary },
      });
    } finally {
      if (opRef.current === op) setOpeningAuditId(null);
    }
  };

  // On load: open the audit History linked to, if any. Any failure degrades to
  // the empty form, and any user action supersedes it via the generation check.
  React.useEffect(() => {
    const auditId = linkedAuditId;
    if (auditId === null || !authReady || accountId === 'anonymous') return;
    const op = opRef.current; // generation 0 — any user action invalidates it
    let cancelled = false;
    const graceTimer = window.setTimeout(() => setIsRestoring(false), 4000);
    (async () => {
      try {
        const [stored, summaries] = await Promise.all([
          ctrApi.getChannelAudit(auditId),
          ctrApi.listChannelAudits().catch(() => [] as ChannelAuditSummary[]),
        ]);
        if (cancelled || opRef.current !== op) return;
        const summary = summaries.find((item) => item.id === auditId);
        setAudit((current) => current ?? stored);
        setCreatorGoal(isChannelAuditV2(stored) ? stored.publicResearch?.creatorGoal || '' : '');
        setReportChannelRef(summary?.channelRef || '');
        if (summary?.channelRef) setChannelUrl((current) => current || summary.channelRef);
      } catch (err: any) {
        if (cancelled || opRef.current !== op) return;
        if (err?.response?.status === 401) { setSignInRequired(true); return; }
        setAuditIdParam(null);
      } finally {
        window.clearTimeout(graceTimer);
        if (!cancelled) setIsRestoring(false);
      }
    })();
    return () => {
      cancelled = true;
      window.clearTimeout(graceTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId,authReady]);

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
      // Fixture reports should exercise the same header actions as a restored
      // persisted report. This reference is development-only and is never sent
      // unless a developer explicitly clicks the fresh-audit action.
      setReportChannelRef('@fixture-channel');
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

  const runAudit = async (rawUrl: string, goal = creatorGoal) => {
    const trimmed = rawUrl.trim();
    if (!trimmed || isAuditing || openingAuditId !== null) return;
    ++opRef.current;

    // Remembered so a creator who leaves for the Google consent screen can come
    // back and re-run the same audit without retyping it.
    try {
      window.sessionStorage.setItem(`${LAST_AUDIT_URL_KEY}:${accountId}`, trimmed);
    } catch {
      /* private mode / storage disabled — the flow just loses the prefill. */
    }

    if(!authReady || accountId === 'anonymous'){setSignInRequired(true);return;}
    setError(null);setAudit(null);setAuditIdParam(null);
    const entry=startAuditSession(accountId,trimmed,goal || undefined);
    ownRequestRef.current=entry.requestKey;
    setIsAuditing(['pending','recovering','unresolved'].includes(entry.status));
  };

  const retryAfterError = () => {
    const retry = error?.retry;
    if (!retry) return;
    if (retry.kind === 'audit') void runAudit(retry.channel, retry.goal);
    else void openAudit(retry.summary);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await runAudit(channelUrl);
  };

  const handleReset = () => {
    // Keep an unresolved request visible; reset never cancels or replaces provider work.
    if(getAuditSession(accountId) && ['pending','recovering','unresolved'].includes(getAuditSession(accountId)!.status)) return;
    clearAuditSession(accountId);
    opRef.current += 1;
    setAudit(null);
    setError(null);
    setChannelUrl('');
    setReportChannelRef('');
    setIsAuditing(false);
    setRecoveryStatus(null);
    setOpeningAuditId(null);
    setAuditIdParam(null);
  };

  // A sidebar visit clears a settled report; active or unresolved work stays visible.
  const firstLocationKey = React.useRef(location.key);
  React.useEffect(() => {
    if (location.key === firstLocationKey.current || readAuditIdParam(location.search) !== null) return;
    handleReset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

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
            className={`max-w-2xl mx-auto mb-6 p-4 rounded-xl flex items-start gap-3 border ${
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
                      disabled={isAuditing || isRestoring || openingAuditId !== null}
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
            role="alert"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-2xl mx-auto mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex flex-wrap items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="flex-1 min-w-[12rem] text-sm leading-relaxed text-red-100">
              {error.message}
              <TechnicalErrorDetail detail={error.technical} />
            </p>
            <div className="flex items-center gap-1">
              {canRetry(error) && (
              <button
                type="button"
                onClick={retryAfterError}
                disabled={isAuditing || openingAuditId !== null}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-sm font-medium text-white
                           hover:border-white/30 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${isAuditing ? 'animate-spin' : ''}`} aria-hidden="true" />
                Try again
              </button>
              )}
              <button
                type="button"
                onClick={() => setError(null)}
                aria-label="Dismiss"
                className="text-gray-400 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!audit && needsSignIn ? (
          <motion.div
            key="sign-in"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="ai-audit-landing max-w-xl mx-auto min-h-[70vh] flex flex-col justify-center py-8"
          >
            <div className="text-center mb-6">
              <div className="w-10 h-10 mx-auto mb-5 rounded-xl bg-[#fa7517]/10 flex items-center justify-center border border-[#fa7517]/25">
                <ScanSearch className="w-5 h-5 text-[#fa7517]" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white mb-3">
                Channel Audit
              </h1>
              <p className="text-base leading-relaxed text-zinc-400">
                Sign in to audit a channel. Your audits are saved to your account so you can
                reopen them later.
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm">
              <AIThumbnailsSignInOptions />
            </div>
          </motion.div>
        ) : !audit && isRestoring ? (
          // Opening the audit History linked to — a quiet beat instead of
          // flashing the empty form at a creator whose report is on its way.
          <motion.div
            key="restoring"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-lg mx-auto min-h-[70vh] flex flex-col items-center justify-center gap-3 text-gray-400"
          >
            <RefreshCw className="w-6 h-6 animate-spin text-[#fa7517]" />
            <p className="text-sm">Opening your audit…</p>
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
              // Re-run targets the DISPLAYED report's channel — never the form
              // draft, which the user may have edited under this report.
              onRerunAudit={
                reportChannelRef ? () => runAudit(reportChannelRef, audit && isChannelAuditV2(audit) ? audit.publicResearch?.creatorGoal || '' : '') : undefined
              }
              isRerunning={isAuditing}
            />
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="ai-audit-landing max-w-xl mx-auto min-h-[calc(100vh-6rem)] flex flex-col justify-center py-8"
          >
            {/* Intro */}
            <div className="text-center mb-9">
              <div className="w-10 h-10 mx-auto mb-5 rounded-xl bg-[#fa7517]/10 flex items-center justify-center border border-[#fa7517]/25">
                <ScanSearch className="w-5 h-5 text-[#fa7517]" />
              </div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#fa7517]">
                Evidence before advice
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
                Channel Audit
              </h1>
              <p className="text-base sm:text-lg leading-relaxed text-zinc-400 max-w-xl mx-auto">
                Find what to keep, what to improve and how to test it. We inspect up to eighteen thumbnails,
                review the viewer promise and research competitive examples. No YouTube connection required.
              </p>
            </div>

            {/* Form */}
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="ai-audit-form mb-7"
            >
              <label className="block text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-[#fa7517]" />
                Channel URL or @handle
              </label>
              <div className="flex flex-col gap-3">
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
                <label htmlFor="channel-audit-goal" className="mt-3 text-sm font-semibold text-white">What should viewers get from your channel? <span className="font-normal text-zinc-500">Optional</span></label>
                <input id="channel-audit-goal" value={creatorGoal} onChange={e => setCreatorGoal(e.target.value)} maxLength={280} disabled={isAuditing}
                  placeholder="e.g. Relaxing aerial journeys to watch on a television"
                  className="px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#fa7517]/50" />
                <p className="text-xs text-zinc-400">This helps us assess the right promise. If left blank, the report will state its assumption.</p>
                <motion.button
                  type="submit"
                  disabled={isAuditing || openingAuditId !== null || !channelUrl.trim()}
                  whileHover={{ scale: !isAuditing && channelUrl.trim() ? 1.02 : 1 }}
                  whileTap={{ scale: !isAuditing && channelUrl.trim() ? 0.98 : 1 }}
                  className={`w-full px-6 py-3.5 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 min-h-[54px]
                             ${
                               !isAuditing && channelUrl.trim()
                                 ? 'bg-[#f97316] hover:bg-[#fb923c] shadow-[0_18px_45px_-20px_rgba(249,115,22,0.7)]'
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
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
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

            <p className="mb-4 text-sm text-zinc-400">Channel audits are free during beta. A public channel does not need a YouTube connection.</p>

            {recoveryStatus && <div role="status" className="text-sm text-gray-300 mb-4">
              <p>Checking for your saved audit report. The page was reloaded or the connection was interrupted. No new audit has been started.</p>
              <p>If a report becomes available, it will appear here or in History.</p>
              <button type="button" className="text-[#fa7517] mt-2" onClick={()=>void checkAuditSession(accountId)}>Check for saved report</button>
              {Date.now() - (getAuditSession(accountId)?.startedAt || Date.now()) >= AUDIT_RECOVERY_WINDOW_MS && <div className="mt-3">
                <p>The result is still unknown. You can stop waiting; a completed report may still appear in History.</p>
                <button type="button" className="text-[#fa7517] mt-2" onClick={()=>{if(stopWaitingForAuditSession(accountId)) handleReset();}}>Stop waiting and return to form</button>
              </div>}
            </div>}
            {/* Auditing progress */}
            <AnimatePresence>{isAuditing && !recoveryStatus && <ChannelAuditProgress />}</AnimatePresence>

            {/* What you'll get */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
                className={`ai-audit-benefits grid sm:grid-cols-3 gap-4 border-t border-white/[0.08] pt-7 ${isAuditing ? 'hidden' : ''}`}
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
                  desc: 'A thumbnail test to try next, with clear instructions and what to measure.',
                },
                {
                  icon: BookMarked,
                  title: 'Examples from other channels',
                  desc: 'Packaging worth studying in your niche, honestly labelled by size.',
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="p-3 text-center group"
                >
                  <div className="w-9 h-9 mx-auto mb-3 rounded-lg bg-[#fa7517]/10 flex items-center justify-center border border-[#fa7517]/20 group-hover:border-[#fa7517]/40 transition-colors">
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
