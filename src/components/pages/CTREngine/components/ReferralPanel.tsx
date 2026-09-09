import React, { useEffect, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle, Description } from '@headlessui/react';
import { UserPlus, Copy, Check, X } from 'lucide-react';
import { getMyReferral } from '../../../../api/referral';
import type { MyReferral } from '../../../../types/referral';

interface ReferralPanelProps {
  className?: string;
}

export const ReferralPanel: React.FC<ReferralPanelProps> = ({ className = '' }) => {
  const [data, setData] = useState<MyReferral | null>(null);
  const [open, setOpen] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copying' | 'copied' | 'failed'>('idle');

  useEffect(() => {
    let cancelled = false;
    getMyReferral().then((referral) => {
      if (!cancelled) setData(referral);
    }).catch(() => {
      // Referral availability must not block the thumbnail workspace.
    });
    return () => { cancelled = true; };
  }, []);

  const handleCopy = async () => {
    if (!data || copyState === 'copying') return;
    setCopyState('copying');
    try {
      await navigator.clipboard.writeText(data.referral_link);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  };

  if (!data) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => { setCopyState('idle'); setOpen(true); }}
        aria-haspopup="dialog"
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-white/[0.04] hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa7517] ${className}`}
      >
        <UserPlus className="h-4 w-4 shrink-0" aria-hidden="true" />
        Invite a creator
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} className="relative z-[100]">
        <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-4">
          <DialogPanel className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#111113] p-6 text-zinc-100 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <DialogTitle className="text-lg font-semibold tracking-tight">Invite a creator</DialogTitle>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close invite panel" className="rounded-lg p-2 text-zinc-500 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa7517]">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <Description className="mt-3 text-sm leading-relaxed text-zinc-400">
              Share your link with a creator. Eligible invites earn you credits after they sign up and create their first thumbnail. Reward limits apply.
            </Description>
            <button
              type="button"
              onClick={handleCopy}
              disabled={copyState === 'copying'}
              aria-live="polite"
              className="mt-6 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[#fa7517] px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-[#fb923c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-60"
            >
              {copyState === 'copied' ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
              <span>{copyState === 'copied' ? 'Link copied' : copyState === 'copying' ? 'Copying…' : 'Copy invite link'}</span>
            </button>
            {copyState === 'failed' && (
              <div className="mt-3">
                <p role="alert" className="text-sm text-zinc-300">Couldn’t copy automatically. Select and copy your link below.</p>
                <input aria-label="Invite link" readOnly value={data.referral_link} onFocus={(event) => event.currentTarget.select()} className="mt-2 w-full rounded-lg border border-white/15 bg-black/30 p-3 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#fa7517]" />
              </div>
            )}
            {(data.stats.pending > 0 || data.stats.rewarded > 0) && (
              <p className="mt-5 border-t border-white/10 pt-4 text-xs text-zinc-500">
                {data.stats.pending} pending · {data.stats.rewarded} qualified
              </p>
            )}
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
};

export default ReferralPanel;
