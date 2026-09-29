import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useStudioAccountState } from '../../../../hooks/useStudioAccount';
import {
  clearStudioAuthOrigin,
  readStudioAuthOrigin,
  STUDIO_AUTH_DEFAULT_DESTINATION,
  STUDIO_NEW_ACCOUNT_WINDOW_MS,
} from '../../../../utils/studioAuth';
import { clearPlanIntent, readPlanIntent } from '../../../../utils/studioDraft';
import { armStudioAuthConfirm } from '../../../../utils/studioFunnel';
import { finishStudioWalletSignIn } from '../../../../utils/studioOnboarding';
import { resumePlanIntent } from '../components/billing/billingActions';
import ThumbnailWall from '../../ThumbnailLanding/ThumbnailWall';
import '../../ThumbnailLanding/landing.css';

/** The pricing page's notice when the plan chosen before the sign-up could not open its checkout. */
export type PlanIntentNotice = { planNotice: 'no-trial' } | { planNotice: 'failed'; message: string };

/**
 * `/ai-thumbnails/auth/continue`: the one address every AI Thumbnails sign-in
 * and sign-up ends on (Clerk's force redirects, the wallet sign-in page). It
 * reads this tab's origin marker once (utils/studioAuth; default
 * `/ai-thumbnails/generate`, whose create form restores the brief the visitor
 * wrote before signing up), clears it and goes there, never through
 * base.tube's onboarding:
 *
 *   - a Clerk sign-up (the sign-up page, or a new account made on the sign-in
 *     page) arms the welcome confirmation with the page's opt-in box; the
 *     gate's own sign-up or sign-in keeps its record (StudioFunnelBridge
 *     confirms);
 *   - a PENDING wallet account completes its onboarding quietly first (on
 *     failure it still goes on; the error is logged);
 *   - a plan chosen before the sign-up ("Start 7-day free trial", utils/studioDraft
 *     PlanIntent) opens its Stripe Checkout at once. An account that already has
 *     a plan goes on to its page; one that cannot have the promised trial, or
 *     whose checkout did not open, goes to the pricing page, which says why.
 */
export default function AIThumbnailsAuthContinue() {
  const navigate = useNavigate();
  const { account, resolved, createdAt = null } = useStudioAccountState();
  const { user: walletUser, setUser } = useAuth();
  // Read once: StrictMode and later renders must not see them cleared.
  const [origin] = useState(() => readStudioAuthOrigin());
  const [planIntent] = useState(() => readPlanIntent());
  const [openingCheckout, setOpeningCheckout] = useState(false);
  // One checkout per visit, even when the effect runs again.
  const checkoutStarted = useRef(false);

  useEffect(() => {
    if (!resolved) return undefined;
    clearStudioAuthOrigin();
    clearPlanIntent();
    const destination = origin?.destination ?? STUDIO_AUTH_DEFAULT_DESTINATION;
    const go = () => {
      if (!planIntent || account === 'anonymous') {
        navigate(destination, { replace: true });
        return;
      }
      if (checkoutStarted.current) return;
      checkoutStarted.current = true;
      setOpeningCheckout(true);
      void resumePlanIntent(planIntent).then(outcome => {
        if (outcome.kind === 'checkout') return;
        if (outcome.kind === 'has-plan') navigate(destination, { replace: true });
        else {
          const state: PlanIntentNotice = outcome.kind === 'no-trial' ? { planNotice: 'no-trial' } : { planNotice: 'failed', message: outcome.message };
          navigate('/ai-thumbnails/pricing', { replace: true, state });
        }
      });
    };
    if (origin && account.startsWith('clerk:')) {
      const newAccount = createdAt !== null && Math.abs(Date.now() - createdAt) <= STUDIO_NEW_ACCOUNT_WINDOW_MS;
      if (origin.intent === 'sign-up' || newAccount)
        armStudioAuthConfirm({ marketingConsent: origin.consent === true, signUpStartedAt: origin.startedAt });
    }
    if (account.startsWith('web3:') && walletUser) return finishStudioWalletSignIn(walletUser, setUser, go);
    go();
    return undefined;
  }, [resolved, account, createdAt, origin, planIntent, walletUser, setUser, navigate]);

  return (
    <div className="lp relative isolate flex min-h-screen items-center justify-center overflow-hidden">
      {/* The landing page's wall under a heavy veil: the same world between the form and the next page. */}
      <ThumbnailWall rows={5} className="-z-20 opacity-60" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_50%_45%_at_50%_50%,rgba(7,7,9,0.96)_0%,rgba(7,7,9,0.85)_60%,rgba(7,7,9,0.6)_100%)]" />
      <p role="status" className="flex items-center gap-3 rounded-full border border-white/10 bg-black/60 px-5 py-3 text-base text-zinc-200 backdrop-blur-xl">
        <Loader2 className="h-5 w-5 animate-spin text-[#fa7517]" aria-hidden="true" />
        {openingCheckout ? 'Opening secure checkout…' : 'Signing you in…'}
      </p>
    </div>
  );
}
