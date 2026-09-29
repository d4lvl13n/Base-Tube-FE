// src/components/pages/CTREngine/components/EmailGateModal.tsx
//
// The AI Thumbnails account gate (spec §17.3). Shown when a visitor asks for
// something that needs an account (generate, edit, audit, save) or when the
// free audits for visitors are used up for today. It says why and what comes
// with the account: the free trial after the sign-up (owner decision, 29
// September 2026), or the welcome credits once the email is verified while
// that gift is turned on (GET /tool/welcome-offer). It has an explicit, never
// pre-checked marketing consent. Then, without leaving the page:
//
//   1. "Create my free account" shows the AI Thumbnails sign-up in place (the
//      same Clerk component and look as /ai-thumbnails/sign-up, routing
//      "virtual"); "I already have an account" shows the AI Thumbnails sign-in
//      in place, and the wallet sign-in (/ai-thumbnails/sign-in). In place,
//      Clerk handles the email and its code; Google and Discord continue on
//      the full AI Thumbnails page (see below). Every way ends on
//      /ai-thumbnails/auth/continue, which comes straight back here without
//      base.tube's onboarding (utils/studioAuth), and a new account sees the
//      AI Thumbnails welcome card;
//   2. once signed in, StudioFunnelBridge calls /tool/email-capture/confirm
//      exactly once (consent, and the referral code of a sign-up started here)
//      and this window shows the result.
//
// The window has no state of its own that matters: its phase lives in
// sessionStorage (utils/studioFunnel) so it survives Google or Discord
// redirects and full-page reloads, and it is mounted once above the
// routes by StudioFunnelBridge (hidden on the sign-in, sign-up, continue and
// onboarding pages).

import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, CheckCircle, Loader2, AlertCircle, ArrowLeft, Wallet } from 'lucide-react';
import { AIThumbnailsSignIn, AIThumbnailsSignUp } from '../auth/AIThumbnailsClerk';
import { StudioErrorDetail } from './studio/StudioErrorDetail';
import {
  deferredWelcomeMessage,
  freeCreditsText,
  gateOfferLine,
  useWelcomeOffer,
  WELCOME_CREDITS_GIVEN_OUT,
} from '../../../../hooks/useWelcomeOffer';
import { catalogTrial, useSubscriptionPlans } from '../../../../hooks/useSubscription';
import { startStudioAuth, STUDIO_SIGN_IN_PATH, STUDIO_SIGN_UP_PATH } from '../../../../utils/studioAuth';
import {
  backToEmailGateOffer,
  closeEmailGate,
  EmailGateFlow,
  EmailGateReason,
  EmailGateRecord,
  saveEmailGate,
  startEmailGateSignIn,
} from '../../../../utils/studioFunnel';

const titles: Record<EmailGateReason, string> = {
  generate: 'Generating needs a free account',
  edit: 'Editing needs a free account',
  audit: 'Auditing needs a free account',
  save: 'Saving needs a free account',
  audit_capacity: 'Free audits are used up for today',
  account: 'Create your free account',
};

/**
 * What to tell the creator when the welcome credits were not added. `message`:
 * the server's own sentence for a refusal (never a server error's text), shown
 * for an email already in use.
 */
export function emailGateRefusalMessage(code: string, cause: string | null, message?: string): string {
  if (code === 'EMAIL_IN_USE')
    return message || 'This email is already linked to another base.tube account, so its welcome credits were already used.';
  if (code === 'EMAIL_DISPOSABLE') return 'Welcome credits need a permanent email address.';
  if (code === 'WELCOME_LIMIT_NETWORK') return 'Welcome credits are limited per network. You can still buy credits.';
  if (code === 'EMAIL_NOT_VERIFIED') {
    if (cause === 'web3_no_email')
      return 'Welcome credits are not available for wallet accounts. They need an account with a verified email address.';
    if (cause === 'verification_check_failed' || cause === 'user_not_found')
      return 'We could not check your email address just now. Try again in a moment.';
    return 'Your email address is not verified yet. Verify it with the code or link we sent you, then select Try again.';
  }
  if (code === 'ACCOUNT_BANNED') return 'Welcome credits are not available for this account.';
  return 'We could not add your credits yet. Try again in a moment.';
}

interface EmailGateModalProps {
  record: EmailGateRecord | null;
  /** A signed-in visitor never sees the offer or the sign-in screens. */
  signedIn: boolean;
  /** Hidden on sign-in, sign-up and onboarding screens. */
  hidden?: boolean;
  onRetryConfirm: () => void;
}

export const EmailGateModal: React.FC<EmailGateModalProps> = ({ record, signedIn, hidden = false, onRetryConfirm }) => {
  const location = useLocation();
  const titleId = useId();
  const offer = useWelcomeOffer();
  const open = Boolean(record?.open) && !hidden && !(signedIn && record?.phase === 'form');
  // Without the welcome gift, the offer is the free trial that follows the sign-up (read once the gate opens).
  const plans = useSubscriptionPlans(open && offer.credits === null);
  const gift = offer.credits;
  const view = !record ? null
    : record.phase === 'awaiting_sign_in' ? (signedIn ? 'confirming' : record.flow)
      : record.phase;
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus returns to what opened the window (when it is still on the page).
  const opener = useRef<HTMLElement | null>(null);
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open && !wasOpen.current) {
      const active = document.activeElement;
      opener.current = active instanceof HTMLElement && active !== document.body ? active : null;
    }
    if (!open && wasOpen.current) {
      const target = opener.current;
      opener.current = null;
      const active = document.activeElement;
      const lost = !active || active === document.body || !active.isConnected || Boolean(dialogRef.current?.contains(active));
      if (target?.isConnected && lost) target.focus();
    }
    wasOpen.current = open;
  }, [open]);

  // Every step (including one restored after a redirect) starts on its heading or
  // its main action, unless another window has the focus.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    const active = document.activeElement;
    if (active instanceof HTMLElement && active !== document.body && !dialog.contains(active)
      && active.closest('[role="dialog"], [aria-modal="true"], .cl-rootBox')) return;
    dialog.querySelector<HTMLElement>('[data-gate-focus]')?.focus({ preventScroll: true });
  }, [open, view]);

  // The page behind the window is hidden from assistive technology and cannot be
  // reached with the keyboard. Only the app root: the window is outside it.
  useEffect(() => {
    if (!open) return;
    const background = document.getElementById('root');
    if (!background || background.contains(dialogRef.current)) return;
    const inert = background.hasAttribute('inert');
    const hiddenBefore = background.getAttribute('aria-hidden');
    background.setAttribute('inert', '');
    background.setAttribute('aria-hidden', 'true');
    return () => {
      if (!inert) background.removeAttribute('inert');
      if (hiddenBefore === null) background.removeAttribute('aria-hidden');
      else background.setAttribute('aria-hidden', hiddenBefore);
    };
  }, [open]);

  // Tab stays in the window; Escape closes it only from inside it.
  const onKeyDown = (event: React.KeyboardEvent) => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (event.key === 'Escape') {
      event.stopPropagation();
      closeEmailGate();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ));
    if (!focusable.length) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !dialog.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
      event.preventDefault();
      first.focus();
    }
  };

  // The anonymous screen saves its brief first, and this page is remembered as
  // the one to come back to (utils/studioAuth), so the continue screen (or the
  // signed-in create screen after a redirect) finds both.
  const choose = (flow: EmailGateFlow) => {
    if (record?.phase !== 'form') return;
    startStudioAuth(flow, location.pathname + location.search, flow === 'sign-up' ? record.marketingConsent : undefined);
    startEmailGateSignIn(flow, record.marketingConsent);
  };

  if (typeof document === 'undefined') return null;
  const button = 'w-full py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-[#fa7517] to-orange-500 hover:from-[#fa7517]/90 hover:to-orange-500/90 shadow-lg shadow-[#fa7517]/25 transition-all disabled:cursor-not-allowed disabled:bg-none disabled:bg-white/10 disabled:text-gray-400 disabled:shadow-none';
  const secondary = 'w-full py-3 px-4 rounded-xl border border-white/15 text-sm font-medium text-white hover:bg-white/5';
  const inPlace = view === 'sign-up' || view === 'sign-in';
  const handOff = 'mt-3 flex items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/5';
  const back = (label: string) => (
    <div className="mb-3 flex items-center gap-2 pr-10">
      <button type="button" onClick={() => backToEmailGateOffer()} aria-label="Back" className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white">
        <ArrowLeft className="h-4 w-4" />
      </button>
      <h2 id={titleId} tabIndex={-1} data-gate-focus className="text-sm font-semibold text-white focus:outline-none">{label}</h2>
    </div>
  );

  return createPortal(
    <AnimatePresence>
      {open && record && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] overflow-y-auto bg-black/70 backdrop-blur-sm"
          onClick={() => closeEmailGate()}
        >
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              onKeyDown={onKeyDown}
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ type: 'spring', damping: 24, stiffness: 260 }}
              onClick={(event) => event.stopPropagation()}
              className={`relative w-full ${inPlace ? 'max-w-[440px]' : 'max-w-md'} bg-gradient-to-br from-[#111114] to-[#0a0a0c] border border-white/10 rounded-2xl shadow-2xl`}
            >
              {/* No overflow clipping: the sign-up's own menus must not be cut. */}
              <div className="h-1 w-full rounded-t-2xl bg-gradient-to-r from-[#fa7517] to-orange-500" />
              <button
                type="button"
                onClick={() => closeEmailGate()}
                className="absolute top-3 right-3 z-20 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className={inPlace ? 'p-3 sm:p-4' : 'p-6 sm:p-7'}>
                {view === 'form' && record.phase === 'form' && (
                  <>
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#fa7517]/20 to-orange-500/20 flex items-center justify-center mb-4">
                      <Sparkles className="w-5 h-5 text-[#fa7517]" />
                    </div>
                    <h2 id={titleId} className="pr-8 text-xl font-bold text-white">{titles[record.reason]}</h2>
                    <p className="mt-2 text-sm text-gray-400">
                      {gift === null
                        ? gateOfferLine(offer, catalogTrial(plans.data))
                        : offer.givenOut
                          ? WELCOME_CREDITS_GIVEN_OUT
                          : <>New accounts get <span className="text-[#fa7517] font-semibold">{freeCreditsText(gift)}</span> once the email is verified.</>}
                    </p>
                    {/* Explicit opt-in — unchecked by default */}
                    <label className="mt-5 flex items-start gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={record.marketingConsent}
                        onChange={(event) => saveEmailGate({ ...record, marketingConsent: event.target.checked, updatedAt: Date.now() })}
                        className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/5 cursor-pointer accent-[#fa7517]"
                      />
                      <span className="text-xs text-gray-400 leading-relaxed">
                        Send me occasional product tips and updates. Optional — you can unsubscribe any time.
                      </span>
                    </label>
                    <div className="mt-5 space-y-2">
                      <button type="button" data-gate-focus className={button} onClick={() => choose('sign-up')}>Create my free account</button>
                      <button type="button" className={secondary} onClick={() => choose('sign-in')}>I already have an account</button>
                    </div>
                  </>
                )}

                {/* In place, Clerk handles the email and its code. Its Google and Discord
                    buttons hand off to the full AI Thumbnails page: in place ("virtual"),
                    Clerk sends a sign-up's provider return to the dashboard's sign-up
                    address (base.tube's /sign-up in production, the Account Portal in
                    development), while the full pages get it, and Clerk's "continue"
                    step, on their own sub-paths. The sign-in in place does the same. */}
                {view === 'sign-up' && (
                  <>
                    {back('Create your free account')}
                    <AIThumbnailsSignUp routing="virtual" withSocialButtons={false} />
                    <Link to={STUDIO_SIGN_UP_PATH} className={handOff}>Continue with Google or Discord</Link>
                  </>
                )}

                {view === 'sign-in' && (
                  <>
                    {back('Sign in to your account')}
                    <AIThumbnailsSignIn routing="virtual" withSocialButtons={false} />
                    <Link to={STUDIO_SIGN_IN_PATH} className={handOff}>Continue with Google or Discord</Link>
                    <Link to={STUDIO_SIGN_IN_PATH} state={{ wallet: true }} className={handOff}>
                      <Wallet className="h-4 w-4 text-[#fa7517]" aria-hidden="true" />
                      Sign in with a wallet
                    </Link>
                  </>
                )}

                {view === 'confirming' && (
                  <div className="py-8 text-center" role="status">
                    <Loader2 className="w-10 h-10 mx-auto text-[#fa7517] animate-spin mb-4" />
                    <h2 id={titleId} tabIndex={-1} data-gate-focus className="text-sm text-gray-300 font-medium focus:outline-none">{gift === null ? 'Setting up your account…' : 'Adding your credits…'}</h2>
                  </div>
                )}

                {view === 'granted' && record.phase === 'granted' && (
                  <div className="py-2 text-center">
                    <div className="w-14 h-14 mx-auto rounded-full bg-green-500/15 flex items-center justify-center mb-4">
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                    <h2 id={titleId} className="text-xl font-bold text-white mb-2">
                      {record.granted ? record.credits ? `${record.credits} credits added` : 'Welcome credits added' : 'You’re signed in'}
                    </h2>
                    <p className="text-sm text-gray-400 mb-6" role="status">
                      {record.granted
                        ? typeof record.balance === 'number' ? `You now have ${record.balance} credits.` : 'They are in your account.'
                        : record.deferred ? deferredWelcomeMessage(record.credits, record.grantOn)
                          : gift === null ? 'Your account is ready.' : 'Your account is ready. The welcome credits were not added.'}
                    </p>
                    <button type="button" data-gate-focus onClick={() => closeEmailGate()} className={button}>Continue</button>
                  </div>
                )}

                {/* Without the welcome gift there is nothing to claim: a refusal only means the account is ready. */}
                {view === 'refused' && record.phase === 'refused' && gift === null && (
                  <div className="py-2 text-center">
                    <div className="w-14 h-14 mx-auto rounded-full bg-green-500/15 flex items-center justify-center mb-4">
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                    <h2 id={titleId} tabIndex={-1} data-gate-focus className="text-xl font-bold text-white mb-2 focus:outline-none">You&apos;re signed in</h2>
                    <p className="text-sm text-gray-400 mb-6" role="status">Your account is ready.</p>
                    <button type="button" onClick={() => closeEmailGate()} className={button}>Continue</button>
                  </div>
                )}

                {view === 'refused' && record.phase === 'refused' && gift !== null && (
                  <div className="py-2 text-center">
                    <AlertCircle className="w-10 h-10 mx-auto text-amber-400 mb-4" />
                    <h2 id={titleId} tabIndex={-1} data-gate-focus className="text-lg font-bold text-white mb-2 focus:outline-none">You&apos;re signed in</h2>
                    <p className="text-sm text-amber-200 mb-5" role="alert">
                      {emailGateRefusalMessage(record.code, record.cause, record.message)}
                      <StudioErrorDetail error={{ code: record.code, status: record.status }} />
                    </p>
                    <div className="space-y-2">
                      {record.retryable && <button type="button" className={button} onClick={onRetryConfirm}>Try again</button>}
                      <button type="button" className={secondary} onClick={() => closeEmailGate()}>Close</button>
                    </div>
                    {record.retryable && <p className="mt-3 text-xs text-gray-400">You can finish this later from AI Thumbnails.</p>}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default EmailGateModal;
