import React, { useEffect, useId, useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, X } from 'lucide-react';
import { useStudioAccountState } from '../../../../hooks/useStudioAccount';
import { welcomeGrantWhen } from '../../../../hooks/useWelcomeOffer';
import {
  closeStudioWelcome,
  getStudioWelcomeVersion,
  openStudioWelcome,
  readStudioWelcome,
  subscribeStudioWelcome,
} from '../../../../utils/studioWelcome';

/**
 * The welcome of a new account that signed up from AI Thumbnails, in place of
 * base.tube's general onboarding: small, at the top of the page, never in the
 * way, shown once per account (utils/studioWelcome). `className` places it
 * (only rendered while the card is shown).
 */
export default function StudioWelcomeCard({ className = '' }: { className?: string }) {
  const { account, resolved, createdAt = null } = useStudioAccountState();
  useSyncExternalStore(subscribeStudioWelcome, getStudioWelcomeVersion);
  const signedIn = resolved && account !== 'anonymous';
  const titleId = useId();

  useEffect(() => {
    if (signedIn) openStudioWelcome(account, createdAt);
  }, [signedIn, account, createdAt]);

  const welcome = signedIn ? readStudioWelcome(account) : null;
  if (!welcome) return null;
  return (
    <div className={className}>
      <section
        aria-labelledby={titleId}
        className="relative mb-5 rounded-xl border border-orange-500/25 bg-orange-500/5 p-3 pr-10 text-sm text-zinc-300"
      >
        <button
          type="button"
          onClick={closeStudioWelcome}
          aria-label="Close welcome"
          className="absolute right-2 top-2 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#fa7517]" aria-hidden="true" />
          <div className="min-w-0">
            <h2 id={titleId} className="font-semibold text-white">Welcome to base.tube AI Thumbnails</h2>
            {welcome.credits !== null && <p className="mt-1">{welcome.credits} credits added.</p>}
            {welcome.arrivesOn !== null && <p className="mt-1">Your welcome credits arrive {welcomeGrantWhen(welcome.arrivesOn)}.</p>}
            <Link to="/ai-thumbnails/settings/style" className="mt-2 inline-block text-xs font-medium text-[#fa7517] hover:underline">
              Set up your channel style
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
