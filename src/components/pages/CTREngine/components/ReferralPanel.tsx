// src/components/pages/CTREngine/components/ReferralPanel.tsx
//
// Referral card (Phase D). Reads GET /api/v1/referrals/me and renders a simple,
// honest "invite friends, you both get credits" card with the shareable link
// (copy button) and reward stats (pending / rewarded). Requires an
// authenticated session — on 401/error it renders nothing so it can be dropped
// anywhere in the tool sidebar/profile without guarding the caller.

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Copy, Check, Gift, Loader2 } from 'lucide-react';
import { getMyReferral } from '../../../../api/referral';
import type { MyReferral } from '../../../../types/referral';

interface ReferralPanelProps {
  className?: string;
}

export const ReferralPanel: React.FC<ReferralPanelProps> = ({ className = '' }) => {
  const [data, setData] = useState<MyReferral | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const referral = await getMyReferral();
        if (!cancelled) setData(referral);
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCopy = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.referral_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — no-op */
    }
  };

  // Loading: subtle placeholder. Failure (incl. unauthenticated): render nothing.
  if (loading) {
    return (
      <div
        className={`flex items-center gap-2 p-4 bg-black/40 border border-gray-800/50 rounded-2xl text-sm text-gray-500 ${className}`}
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading referral link...
      </div>
    );
  }
  if (failed || !data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br from-[#111114] to-[#0a0a0c] border border-white/10 rounded-2xl p-5 ${className}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#fa7517]/20 to-orange-500/20 flex items-center justify-center flex-shrink-0">
          <Gift className="w-5 h-5 text-[#fa7517]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Invite friends</h3>
          <p className="text-xs text-gray-400">Earn credits when a friend signs up and creates their first thumbnail (up to your reward cap).</p>
        </div>
      </div>

      {/* Shareable link + copy */}
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          readOnly
          value={data.referral_link}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 min-w-0 px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#fa7517]/40 truncate"
        />
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all flex-shrink-0
                     ${
                       copied
                         ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                         : 'bg-[#fa7517]/10 text-[#fa7517] border border-[#fa7517]/30 hover:bg-[#fa7517]/20'
                     }`}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-center">
          <div className="text-lg font-bold text-white">{data.stats.pending}</div>
          <div className="text-[11px] text-gray-500 flex items-center justify-center gap-1">
            <Users className="w-3 h-3" />
            Pending
          </div>
        </div>
        <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-center">
          <div className="text-lg font-bold text-[#fa7517]">{data.stats.rewarded}</div>
          <div className="text-[11px] text-gray-500 flex items-center justify-center gap-1">
            <Gift className="w-3 h-3" />
            Qualified
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ReferralPanel;
