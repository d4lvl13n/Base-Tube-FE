// src/components/pages/CTREngine/components/EmailGateModal.tsx
//
// Freemium email gate (Phase D). Fires when an anonymous user exhausts their
// free previews (the `usePublicThumbnailGenerator` hook dispatches the
// `tool:email-gate:open` window event, or a parent can drive it via the
// `isOpen` prop). Collects an email + an EXPLICIT, opt-in (never pre-checked)
// marketing-consent checkbox, then:
//
//   1. POST /api/v1/tool/email-capture   (stash email + consent + referral)
//   2. Open Clerk's sign-in/verification modal (reusing the app's Clerk flow —
//      we do NOT build a new auth flow), prefilled with the email.
//   3. The instant a Clerk session exists post-verification, POST
//      /api/v1/tool/email-capture/confirm to claim the one-time +8 credits.
//
// Self-mounting: renders through a portal to <body>, so it can live at the top
// of a layout without disturbing page flow. Uncontrolled by default (listens to
// the window event); pass `isOpen`/`onClose` to control it explicitly.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser, useClerk } from '@clerk/clerk-react';
import { Mail, X, Sparkles, CheckCircle, Loader2, ShieldCheck, Gift } from 'lucide-react';
import { emailCapture, confirmSignup, getToolFingerprint } from '../../../../api/toolFunnel';
import type { ConfirmSignupData } from '../../../../types/toolFunnel';
import {
  getPendingReferralCode,
  clearPendingReferralCode,
} from '../../../../utils/referralAttribution';

export const EMAIL_GATE_OPEN_EVENT = 'tool:email-gate:open';

type GatePhase = 'form' | 'verifying' | 'granting' | 'done';

interface EmailGateModalProps {
  /** Controlled visibility. Omit to let the modal self-manage via the window event. */
  isOpen?: boolean;
  /** Called when the user dismisses the modal. */
  onClose?: () => void;
  /** Called after the signup grant succeeds (credits claimed). */
  onGranted?: (data: ConfirmSignupData) => void;
}

const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export const EmailGateModal: React.FC<EmailGateModalProps> = ({
  isOpen,
  onClose,
  onGranted,
}) => {
  const isControlled = isOpen !== undefined;
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();

  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? (isOpen as boolean) : internalOpen;

  const [email, setEmail] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false); // opt-in, never pre-checked
  const [phase, setPhase] = useState<GatePhase>('form');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConfirmSignupData | null>(null);

  // Tracks whether the email-capture step has completed for this session, so the
  // confirm effect only fires after the user actually went through the gate.
  const capturedRef = useRef(false);
  // Single-flight guard for the confirm→grant call so it runs exactly once per
  // engaged gate. Without this, the confirm effect (which calls setPhase) would
  // re-trigger its own cleanup and discard the response, hanging on "granting".
  const confirmingRef = useRef(false);

  // Listen for the anon-quota-exhausted trigger dispatched by the generator hook.
  useEffect(() => {
    if (isControlled) return;
    const handler = () => setInternalOpen(true);
    window.addEventListener(EMAIL_GATE_OPEN_EVENT, handler);
    return () => window.removeEventListener(EMAIL_GATE_OPEN_EVENT, handler);
  }, [isControlled]);

  const close = useCallback(() => {
    if (!isControlled) setInternalOpen(false);
    onClose?.();
  }, [isControlled, onClose]);

  // Reset transient state whenever the modal transitions to closed.
  useEffect(() => {
    if (!open) {
      capturedRef.current = false;
      confirmingRef.current = false;
      setPhase('form');
      setSubmitting(false);
      setError(null);
      setResult(null);
      setMarketingConsent(false);
    }
  }, [open]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isValidEmail(email)) {
        setError('Please enter a valid email address.');
        return;
      }
      setSubmitting(true);
      setError(null);

      const trimmed = email.trim();
      const fingerprint = getToolFingerprint();
      const referralCode = getPendingReferralCode();

      try {
        await emailCapture({
          email: trimmed,
          marketingConsent,
          referralCode,
          fingerprint,
        });
        capturedRef.current = true;
        setPhase('verifying');

        // Reuse the app's existing Clerk flow — prefill the email so the user
        // lands straight on verification. openSignIn resolves when the modal
        // closes; the confirm step is driven off `isSignedIn` below so it fires
        // regardless of how the session is established.
        try {
          await (openSignIn as (props?: unknown) => Promise<unknown> | void)({
            initialValues: { emailAddress: trimmed },
          });
        } catch {
          /* user closed the Clerk modal — the confirm effect still guards on isSignedIn */
        }
      } catch (err) {
        const message =
          (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data
            ?.error?.message || 'Something went wrong. Please try again.';
        setError(message);
        setPhase('form');
      } finally {
        setSubmitting(false);
      }
    },
    [email, marketingConsent, openSignIn]
  );

  // The moment a Clerk session exists after the gate was engaged, claim the
  // one-time signup credits (idempotent server-side).
  useEffect(() => {
    if (!open || !isSignedIn || !capturedRef.current) return;
    if (confirmingRef.current) return; // single-flight: already confirmed / in flight
    confirmingRef.current = true;

    // `active` flips only on a REAL teardown (unmount, or open/isSignedIn change) —
    // NOT when we call setPhase, because `phase` is intentionally not a dependency.
    let active = true;
    setPhase('granting');
    setError(null);
    (async () => {
      try {
        const data = await confirmSignup({
          marketingConsent,
          referralCode: getPendingReferralCode(),
          fingerprint: getToolFingerprint(),
        });
        if (!active) return;
        setResult(data);
        setPhase('done');
        clearPendingReferralCode();
        onGranted?.(data);
      } catch (err) {
        if (!active) return;
        confirmingRef.current = false; // allow a retry after a transient failure
        const code = (err as { response?: { data?: { error?: { code?: string } } } })?.response
          ?.data?.error?.code;
        setError(
          code === 'EMAIL_NOT_VERIFIED'
            ? 'Please verify your email to claim your credits, then try again.'
            : 'We could not confirm your account yet. Please try again in a moment.'
        );
        setPhase('verifying');
      }
    })();

    return () => {
      active = false;
    };
    // `phase` deliberately excluded: including it makes the effect cancel itself
    // the instant it sets 'granting', discarding the confirm response.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isSignedIn, marketingConsent, onGranted]);

  if (typeof document === 'undefined') return null;

  const grantedCredits = result?.signupCredits ?? 8;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={close}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: 'spring', damping: 24, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-gradient-to-br from-[#111114] to-[#0a0a0c] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Accent bar */}
            <div className="h-1 w-full bg-gradient-to-r from-[#fa7517] to-orange-500" />

            <button
              onClick={close}
              className="absolute top-3 right-3 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 sm:p-7">
              {/* -------- FORM -------- */}
              {phase === 'form' && (
                <>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#fa7517]/20 to-orange-500/20 flex items-center justify-center mb-4">
                    <Sparkles className="w-6 h-6 text-[#fa7517]" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">
                    Keep creating — it&apos;s free
                  </h2>
                  <p className="text-sm text-gray-400 mb-5">
                    You&apos;ve used your free previews. Add your email and verify to unlock{' '}
                    <span className="text-[#fa7517] font-semibold">+8 credits</span> and save your
                    thumbnails.
                  </p>

                  <form onSubmit={handleSubmit}>
                    <div className="relative mb-4">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        autoFocus
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm
                                   placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#fa7517]/50
                                   focus:border-[#fa7517]/50 transition-all"
                      />
                    </div>

                    {/* Explicit opt-in — unchecked by default */}
                    <label className="flex items-start gap-3 mb-5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={marketingConsent}
                        onChange={(e) => setMarketingConsent(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/5 text-[#fa7517]
                                   focus:ring-[#fa7517]/50 focus:ring-offset-0 cursor-pointer accent-[#fa7517]"
                      />
                      <span className="text-xs text-gray-400 leading-relaxed">
                        Send me occasional product tips and updates. Optional — you can unsubscribe
                        any time.
                      </span>
                    </label>

                    {error && (
                      <p className="text-sm text-red-400 mb-4" role="alert">
                        {error}
                      </p>
                    )}

                    <motion.button
                      type="submit"
                      disabled={submitting || !email.trim()}
                      whileHover={{ scale: submitting || !email.trim() ? 1 : 1.02 }}
                      whileTap={{ scale: submitting || !email.trim() ? 1 : 0.98 }}
                      className={`w-full py-3.5 px-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all
                                 ${
                                   submitting || !email.trim()
                                     ? 'bg-white/10 cursor-not-allowed text-gray-400'
                                     : 'bg-gradient-to-r from-[#fa7517] to-orange-500 hover:from-[#fa7517]/90 hover:to-orange-500/90 shadow-lg shadow-[#fa7517]/25'
                                 }`}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Please wait...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Continue
                        </>
                      )}
                    </motion.button>
                    <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      We&apos;ll send a verification link to confirm it&apos;s you.
                    </p>
                  </form>
                </>
              )}

              {/* -------- VERIFYING -------- */}
              {phase === 'verifying' && (
                <div className="py-6 text-center">
                  <div className="w-14 h-14 mx-auto rounded-full border-2 border-[#fa7517]/30 border-t-[#fa7517] animate-spin mb-5" />
                  <h2 className="text-lg font-bold text-white mb-2">Check your email</h2>
                  <p className="text-sm text-gray-400 mb-4">
                    Verify your email in the sign-in window to claim your credits. This unlocks
                    automatically once you&apos;re verified.
                  </p>
                  {error && (
                    <p className="text-sm text-amber-400 mb-4" role="alert">
                      {error}
                    </p>
                  )}
                  <button
                    onClick={() =>
                      (openSignIn as (props?: unknown) => Promise<unknown> | void)({
                        initialValues: { emailAddress: email.trim() },
                      })
                    }
                    className="text-sm text-[#fa7517] hover:text-orange-400 font-medium transition-colors"
                  >
                    Reopen verification
                  </button>
                </div>
              )}

              {/* -------- GRANTING -------- */}
              {phase === 'granting' && (
                <div className="py-8 text-center">
                  <Loader2 className="w-10 h-10 mx-auto text-[#fa7517] animate-spin mb-4" />
                  <p className="text-sm text-gray-300 font-medium">Claiming your credits...</p>
                </div>
              )}

              {/* -------- DONE -------- */}
              {phase === 'done' && (
                <div className="py-6 text-center">
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-16 h-16 mx-auto rounded-full bg-green-500/15 flex items-center justify-center mb-4"
                  >
                    <CheckCircle className="w-9 h-9 text-green-400" />
                  </motion.div>
                  <h2 className="text-xl font-bold text-white mb-2">You&apos;re all set!</h2>
                  <p className="text-sm text-gray-400 mb-4">
                    {result?.alreadyGranted
                      ? 'Your account is verified — welcome back.'
                      : `We've added your welcome credits to your account.`}
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#fa7517]/10 border border-[#fa7517]/20 rounded-full mb-6">
                    <Gift className="w-4 h-4 text-[#fa7517]" />
                    <span className="text-[#fa7517] font-semibold">
                      {result?.alreadyGranted ? 'Credits ready' : `+${grantedCredits} credits`}
                    </span>
                    {typeof result?.balance === 'number' && (
                      <span className="text-gray-500 text-sm">• {result.balance} total</span>
                    )}
                  </div>
                  <button
                    onClick={close}
                    className="w-full py-3.5 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-[#fa7517] to-orange-500 hover:from-[#fa7517]/90 hover:to-orange-500/90 shadow-lg shadow-[#fa7517]/25 transition-all"
                  >
                    Start creating
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default EmailGateModal;
