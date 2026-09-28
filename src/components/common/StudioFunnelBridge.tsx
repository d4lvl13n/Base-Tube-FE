import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useStudioAccountState } from '../../hooks/useStudioAccount';
import { invalidateStudioBalance, notifyStudioUsageChanged } from '../../hooks/useStudioBalance';
import { freeCreditsText, useWelcomeOffer } from '../../hooks/useWelcomeOffer';
import EmailGateModal from '../pages/CTREngine/components/EmailGateModal';
import {
  isAuthRoute,
  isEmailGateRetryable,
  loadEmailGate,
  observeStudioFunnelAccount,
  saveEmailGate,
  subscribeEmailGate,
} from '../../utils/studioFunnel';
import { forgetStudioFunnelForAccountChange, retryEmailGateConfirm, startEmailGateConfirm } from '../../utils/studioFunnelRunner';

/**
 * Mounted once above the routes (spec §17.3.4–5), so nothing here is lost when
 * the visitor's create page is replaced by the signed-in one or when Clerk
 * reloads the page. It shows the account gate, and on every sign-in (the gate's
 * in-place sign-up or sign-in, the AI Thumbnails sign-in and sign-up pages,
 * base.tube's own pages, wallet), for a sign-up or sign-in started from the
 * gate or a sign-up on the AI Thumbnails sign-up page (armed by
 * /ai-thumbnails/auth/continue), calls POST /tool/email-capture/confirm with
 * that consent box, once.
 */
export default function StudioFunnelBridge() {
  const { account, resolved } = useStudioAccountState();
  const signedIn = account !== 'anonymous';
  const client = useQueryClient();
  const { pathname } = useLocation();
  const gate = useSyncExternalStore(subscribeEmailGate, loadEmailGate);
  const awaitingSignIn = gate?.phase === 'awaiting_sign_in';
  const onAuthScreen = isAuthRoute(pathname);
  const offer = useWelcomeOffer();

  // Signed out or another account: nothing the previous visitor left may reach
  // this one (runs before the confirm effect below).
  const observed = useRef<string | null>(null);
  useEffect(() => {
    if (!resolved || observed.current === account) return;
    observed.current = account;
    const change = observeStudioFunnelAccount(account);
    if (change === 'signed-out' || change === 'switched') forgetStudioFunnelForAccountChange();
  }, [resolved, account]);

  const onGranted = () => {
    void invalidateStudioBalance(client, account);
    notifyStudioUsageChanged();
  };
  useEffect(() => {
    if (!signedIn) return;
    // Signed in elsewhere while the gate only showed its offer: there is nothing to confirm.
    if (loadEmailGate()?.phase === 'form') saveEmailGate(null);
    // Also when a confirmation is armed after the sign-in (the continue screen).
    void startEmailGateConfirm(account, {
      onGranted: () => {
        void invalidateStudioBalance(client, account);
        notifyStudioUsageChanged();
      },
    });
  }, [signedIn, account, client, awaitingSignIn]);

  const retryConfirm = () => {
    void retryEmailGateConfirm(account, { onGranted });
  };
  // A closed gate whose confirmation can still succeed: a small reminder in the
  // AI Thumbnails area until the credits are added, refused for good, or the
  // record expires (24 h). Dismiss hides it until the next page load.
  const [creditsPromptDismissed, setCreditsPromptDismissed] = useState(false);
  const creditsPrompt = signedIn && !onAuthScreen && pathname.startsWith('/ai-thumbnails')
    && isEmailGateRetryable(gate) && !gate.open && (!gate.account || gate.account === account) && !creditsPromptDismissed;

  const card = 'pointer-events-auto rounded-xl border border-white/10 bg-[#111113] p-4 text-sm text-zinc-200 shadow-2xl';
  const primary = 'rounded-lg bg-[#fa7517] px-3 py-1.5 text-xs font-semibold text-white';
  const secondary = 'rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white';
  return <>
    <EmailGateModal record={gate} signedIn={signedIn} hidden={onAuthScreen} onRetryConfirm={retryConfirm} />
    {creditsPrompt && <div className="pointer-events-none fixed bottom-4 left-1/2 z-[90] flex w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 flex-col gap-3">
      <section aria-label="Welcome credits" className={card}>
        <p>Your welcome credits were not added yet.</p>
        <div className="mt-3 flex gap-3">
          <button type="button" className={primary} onClick={retryConfirm}>Finish claiming your {freeCreditsText(offer.credits)}</button>
          <button type="button" className={secondary} onClick={() => setCreditsPromptDismissed(true)}>Dismiss</button>
        </div>
      </section>
    </div>}
  </>;
}
