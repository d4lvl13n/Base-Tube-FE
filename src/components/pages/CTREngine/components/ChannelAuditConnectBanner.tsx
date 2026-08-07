// src/components/pages/CTREngine/components/ChannelAuditConnectBanner.tsx
//
// The one thing a PREVIEW audit is missing is the creator's own numbers. This
// banner is where the report asks for them.
//
// It reuses the existing YouTube connect entry point verbatim — the same
// `GET /api/integrations/youtube/auth` the creator dashboard's
// `useYouTubeAuth().startOAuth()` calls (src/api/youtubeAuth.ts) — with the new
// allowlisted `returnTo=audit` key, so the backend's signed OAuth state brings
// the creator back HERE instead of the creator dashboard.
//
// Deliberately not the `useYouTubeAuth` hook: that hook fires a status request
// on mount and strips `?ytLinked` from the URL itself, which would race the
// audit page's own landing handler. The API module is the shared part; the
// state machine is not.

import React, { useState } from 'react';
import { Youtube, ArrowRight, AlertTriangle, RefreshCw, ShieldAlert } from 'lucide-react';
import { youtubeAuthApi } from '../../../../api/youtubeAuth';
import type { ChannelAuditConnectionStatus } from '../../../../types/ctr';

interface ChannelAuditConnectBannerProps {
  /**
   * Additive backend field (MOAT D2) — often absent. Absent or 'unconnected'
   * both render the plain connect pitch.
   */
  connectionStatus?: ChannelAuditConnectionStatus;
}

type BannerTone = 'invite' | 'warning';

interface BannerCopy {
  tone: BannerTone;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  cta: string;
}

const COPY: Record<'unconnected' | 'mismatched' | 'reauth_required', BannerCopy> = {
  unconnected: {
    tone: 'invite',
    icon: Youtube,
    title: 'Connect your YouTube channel to see your real impressions & CTR per video',
    body:
      'Right now this report reads only what is publicly visible. Connected, every video below carries its actual impressions, click-through rate and how strong that evidence really is.',
    cta: 'Connect YouTube',
  },
  mismatched: {
    tone: 'warning',
    icon: AlertTriangle,
    title: "You're auditing a channel that isn't the one you connected",
    body:
      'Your YouTube account is linked, but this audit is for a different channel — so it stays in preview and shows public data only. Audit your connected channel to get its real impressions and CTR.',
    cta: 'Connect a different channel',
  },
  reauth_required: {
    tone: 'warning',
    icon: ShieldAlert,
    title: 'Your YouTube connection needs to be re-authorised',
    body:
      'The access you granted was revoked or expired, so this report fell back to public data. Reconnect to bring your impressions and CTR back.',
    cta: 'Reconnect YouTube',
  },
};

export const ChannelAuditConnectBanner: React.FC<ChannelAuditConnectBannerProps> = ({
  connectionStatus,
}) => {
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 'syncing' is not this banner's job — the report renders its own syncing
  // notice. Anything unknown (or absent) is treated as simply not connected.
  const key: 'unconnected' | 'mismatched' | 'reauth_required' =
    connectionStatus === 'mismatched' || connectionStatus === 'reauth_required'
      ? connectionStatus
      : 'unconnected';

  const copy = COPY[key];
  const Icon = copy.icon;
  const warn = copy.tone === 'warning';

  const handleConnect = async () => {
    if (isStarting) return;
    setError(null);
    setIsStarting(true);
    try {
      // returnTo=audit → the backend callback redirects to
      // /ai-thumbnails/channel-audit?ytLinked=1 (or ?ytError=<code>).
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
      className={`mb-6 rounded-2xl border p-5 sm:p-6 backdrop-blur-sm ${
        warn
          ? 'bg-amber-500/[0.06] border-amber-500/25'
          : 'bg-gradient-to-br from-[#fa7517]/15 to-orange-500/5 border-[#fa7517]/30'
      }`}
    >
      <div className="flex flex-wrap items-start gap-4">
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border ${
            warn
              ? 'bg-amber-500/10 border-amber-500/30'
              : 'bg-[#fa7517]/15 border-[#fa7517]/30'
          }`}
        >
          <Icon className={`w-5 h-5 ${warn ? 'text-amber-400' : 'text-[#fa7517]'}`} />
        </div>

        <div className="min-w-0 flex-1 basis-[280px]">
          <h3 className="text-base sm:text-lg font-bold text-white leading-snug">{copy.title}</h3>
          <p className="mt-2 text-sm text-gray-300 leading-relaxed">{copy.body}</p>

          <button
            type="button"
            onClick={handleConnect}
            disabled={isStarting}
            className={`mt-4 inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white
                        transition-all min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed ${
                          warn
                            ? 'bg-amber-500/90 hover:bg-amber-500'
                            : 'bg-gradient-to-r from-[#fa7517] to-orange-500 hover:from-[#fa7517]/90 hover:to-orange-500/90 shadow-lg shadow-[#fa7517]/25'
                        }`}
          >
            {isStarting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Opening Google…
              </>
            ) : (
              <>
                <Youtube className="w-4 h-4" />
                {copy.cta}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="mt-3 text-xs text-gray-500">
            Read-only access to your YouTube Analytics. First metrics can take up to 48h to arrive.
          </p>

          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default ChannelAuditConnectBanner;
