import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useAuth as useClerkAuth, useClerk } from '@clerk/clerk-react';
import { ShieldAlert } from 'lucide-react';
import { useAuth as useWeb3Auth } from '../../contexts/AuthContext';
import web3AuthApi from '../../api/web3authapi';
import { getAccountBlock, subscribeAccountBlock } from '../../utils/accountBlock';

const SUPPORT_EMAIL = 'hello@base.tube';

const COPY = {
  suspended: {
    title: 'Your account is suspended',
    body: 'While it is suspended, you cannot upload, comment or buy on Base.Tube. You can still watch public videos after you sign out.',
  },
  banned: {
    title: 'Your account has been banned',
    body: 'This account can no longer upload, comment or buy on Base.Tube. You can still watch public videos after you sign out.',
  },
} as const;

/**
 * One blocking notice for a suspended or banned account, shown as soon as any
 * API call answers 403 `ACCOUNT_SUSPENDED` / `ACCOUNT_BANNED` (see
 * `utils/accountBlock`). Signed-out visitors never receive those codes, so
 * they never see it. Signing out reloads the home page with no session, which
 * clears the notice and cannot bring it back.
 */
const AccountBlockedNotice: React.FC = () => {
  const block = useSyncExternalStore(subscribeAccountBlock, getAccountBlock, getAccountBlock);
  const { isSignedIn } = useClerkAuth();
  const { signOut } = useClerk();
  const { disconnect } = useWeb3Auth();
  const [signingOut, setSigningOut] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!block) return;
    dialogRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [block]);

  const handleSignOut = useCallback(async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      if (localStorage.getItem('auth_method') === 'web3') {
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_method');
        // Clears the wallet session cookie (the route needs no sign-in; never throws).
        await web3AuthApi.logout();
        try {
          await Promise.resolve(disconnect());
        } catch {
          // The cookie is already gone; the wallet state resets on reload.
        }
      }
      if (isSignedIn) {
        await signOut();
      }
    } catch (error) {
      console.warn('Sign out failed', error);
    } finally {
      // A fresh page with no session: nothing left can answer "suspended".
      window.location.assign('/');
    }
  }, [disconnect, isSignedIn, signOut, signingOut]);

  // Keep keyboard focus inside the notice: it is the only thing on the page.
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab' || !dialogRef.current) return;
    const focusable = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'),
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === dialogRef.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }, []);

  if (!block) return null;
  const copy = COPY[block];

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="account-blocked-title"
        aria-describedby="account-blocked-body"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#09090B] p-8 text-center text-white shadow-2xl focus:outline-none"
      >
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-[#fa7517]/40 bg-[#fa7517]/15">
          <ShieldAlert className="h-6 w-6 text-[#fa7517]" aria-hidden="true" />
        </div>
        <h1 id="account-blocked-title" className="text-2xl font-semibold">
          {copy.title}
        </h1>
        <div id="account-blocked-body" className="mt-3 space-y-3 text-sm leading-relaxed text-gray-300">
          <p>{copy.body}</p>
          <p>
            If you think this is a mistake, write to{' '}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-[#fa7517] underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#fa7517]/60 rounded"
            >
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="mt-7 w-full rounded-full bg-[#fa7517] px-6 py-2.5 font-medium text-black transition-colors hover:bg-[#fa7517]/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </div>
  );
};

export default AccountBlockedNotice;
