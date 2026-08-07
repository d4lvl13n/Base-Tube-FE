// src/components/pages/CTREngine/components/AnalyticsSourceCTAs.tsx
//
// The preview report's central ask: "this audit has no private analytics — here
// are the TWO ways to add them". The spec (v2.1 journeys, LOCKED) requires the
// two CTAs to carry EQUAL visual weight: connecting is more trustworthy, but
// uploading is instant, and a creator who will not grant OAuth must not be
// nudged into feeling like a second-class user. Same size, same shape, same
// button treatment — the only difference is the honest trade-off under each.
//
// The connect side reuses the existing entry point verbatim
// (`youtubeAuthApi.startOAuth('audit')`), exactly as ChannelAuditConnectBanner
// does, so the backend's signed OAuth state returns to the audit page.

import React, { useState } from 'react';
import {
  Youtube,
  Upload,
  ArrowRight,
  RefreshCw,
  BadgeCheck,
  Zap,
  ShieldQuestion,
} from 'lucide-react';
import { youtubeAuthApi } from '../../../../api/youtubeAuth';

interface AnalyticsSourceCTAsProps {
  /** Opens the Studio-export stepper. */
  onUpload: () => void;
  /** Copy differs slightly when this is a re-connect after a dead grant. */
  variant?: 'no_analytics' | 'reauth';
  className?: string;
}

export const AnalyticsSourceCTAs: React.FC<AnalyticsSourceCTAsProps> = ({
  onUpload,
  variant = 'no_analytics',
  className = '',
}) => {
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    if (isStarting) return;
    setError(null);
    setIsStarting(true);
    try {
      const url = await youtubeAuthApi.startOAuth('audit');
      window.location.href = url;
    } catch (err: any) {
      setIsStarting(false);
      setError(
        err?.response?.status === 401
          ? 'Sign in to BaseTube first, then connect your YouTube channel.'
          : 'Could not start the YouTube connection. Please try again.'
      );
    }
  };

  return (
    <div
      className={`mb-6 rounded-2xl border border-[#fa7517]/25 bg-gradient-to-br from-[#fa7517]/10 to-orange-500/5 p-5 sm:p-6 backdrop-blur-sm ${className}`}
    >
      <p className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-300">
        <ShieldQuestion className="w-3.5 h-3.5" />
        {variant === 'reauth'
          ? 'Your YouTube access expired — no private Analytics added'
          : 'No private Analytics added'}
      </p>

      <h3 className="mt-3 text-base sm:text-lg font-bold leading-snug text-white">
        Everything above is read from what is publicly visible.
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-gray-300">
        Add your own numbers and every video below gains a Reach, Hold and Conversion card —
        impressions and click-through rate, how much of the video people actually watched, and how
        many of them subscribed. Two ways in, both fine:
      </p>

      {/* EQUAL WEIGHT: same width, same height, same button treatment. */}
      <div className="mt-4 flex flex-wrap gap-3">
        <div className="flex w-[300px] max-w-full flex-1 basis-[280px] flex-col rounded-xl border border-white/10 bg-black/40 p-4">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
            <BadgeCheck className="w-3.5 h-3.5" />
            Verified
          </span>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-300">
            Read-only access to your YouTube Analytics. Keeps itself up to date — impressions and
            CTR arrive within 24-48h, everything else is there immediately.
          </p>
          <button
            type="button"
            onClick={handleConnect}
            disabled={isStarting}
            className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#fa7517] to-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#fa7517]/25 transition-all hover:from-[#fa7517]/90 hover:to-orange-500/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isStarting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Opening Google…
              </>
            ) : (
              <>
                <Youtube className="h-4 w-4" />
                Connect YouTube — verified, automatic
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

        <div className="flex w-[300px] max-w-full flex-1 basis-[280px] flex-col rounded-xl border border-white/10 bg-black/40 p-4">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-300">
            <Zap className="w-3.5 h-3.5" />
            Instant
          </span>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-300">
            Export a CSV from YouTube Studio and drop it in. No account access at all. Labelled
            self-reported, and it only covers the range you confirm.
          </p>
          <button
            type="button"
            onClick={onUpload}
            className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#fa7517] to-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#fa7517]/25 transition-all hover:from-[#fa7517]/90 hover:to-orange-500/90"
          >
            <Upload className="h-4 w-4" />
            Upload Studio export — instant, self-reported
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </div>
  );
};

export default AnalyticsSourceCTAs;
