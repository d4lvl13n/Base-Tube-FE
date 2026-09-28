import React, { useEffect, useState } from 'react';
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
import { armStudioAuthConfirm } from '../../../../utils/studioFunnel';
import { finishStudioWalletSignIn } from '../../../../utils/studioOnboarding';

/**
 * `/ai-thumbnails/auth/continue`: the one address every AI Thumbnails sign-in
 * and sign-up ends on (Clerk's force redirects, the wallet sign-in page). It
 * reads this tab's origin marker once (utils/studioAuth; default
 * `/ai-thumbnails/generate`, whose create form restores the brief the visitor
 * wrote before signing up), clears it and goes there, never through
 * base.tube's onboarding:
 *
 *   - a Clerk sign-up (the sign-up page, or a new account made on the sign-in
 *     page) arms the welcome credits confirmation with the page's opt-in box;
 *     the gate's own sign-up or sign-in keeps its record (StudioFunnelBridge
 *     confirms);
 *   - a PENDING wallet account completes its onboarding quietly first (on
 *     failure it still goes on; the error is logged).
 */
export default function AIThumbnailsAuthContinue() {
  const navigate = useNavigate();
  const { account, resolved, createdAt = null } = useStudioAccountState();
  const { user: walletUser, setUser } = useAuth();
  // Read once: StrictMode and later renders must not see it cleared.
  const [origin] = useState(() => readStudioAuthOrigin());

  useEffect(() => {
    if (!resolved) return undefined;
    clearStudioAuthOrigin();
    const go = () => navigate(origin?.destination ?? STUDIO_AUTH_DEFAULT_DESTINATION, { replace: true });
    if (origin && account.startsWith('clerk:')) {
      const newAccount = createdAt !== null && Math.abs(Date.now() - createdAt) <= STUDIO_NEW_ACCOUNT_WINDOW_MS;
      if (origin.intent === 'sign-up' || newAccount)
        armStudioAuthConfirm({ marketingConsent: origin.consent === true, signUpStartedAt: origin.startedAt });
    }
    if (account.startsWith('web3:') && walletUser) return finishStudioWalletSignIn(walletUser, setUser, go);
    go();
    return undefined;
  }, [resolved, account, createdAt, origin, walletUser, setUser, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0b]">
      <p role="status" className="flex items-center gap-2 text-sm text-zinc-400">
        <Loader2 className="h-4 w-4 animate-spin text-[#fa7517]" aria-hidden="true" />
        Signing you in…
      </p>
    </div>
  );
}
