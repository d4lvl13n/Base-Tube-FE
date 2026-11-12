import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Flag, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { REPORT_REASON_MAX_LENGTH, reportFailureOf, type ReportFailure, type ReportResult } from '../../../api/report';

export type ReportSubject = 'video' | 'comment';

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** What is being reported; only changes the wording. */
  subject: ReportSubject;
  /** Sends the report. `reason` is the chosen label, plus ": detail" when given. */
  onSubmit: (reason: string) => Promise<ReportResult>;
}

const REASONS = [
  'Spam or misleading',
  'Hateful or abusive',
  'Sexual content',
  'Violence or dangerous acts',
  'Copyright',
  'Something else',
] as const;

/** Leaves room for the longest label and ": " inside the backend's 1000 characters. */
const DETAIL_MAX_LENGTH = 900;

const failureMessage = (failure: ReportFailure, subject: ReportSubject): string => {
  switch (failure) {
    case 'sign_in_required':
      return 'You need to be signed in to report. Sign in, then try again.';
    case 'account_blocked':
      return 'Your account cannot send reports right now.';
    case 'not_found':
      return subject === 'video' ? 'This video is no longer available.' : 'This comment no longer exists.';
    case 'rate_limited':
      return 'You sent many reports in a short time. Wait a minute, then try again.';
    case 'invalid_reason':
      return 'This report could not be sent. Shorten the details, then try again.';
    case 'network':
      return 'We could not reach Base.Tube. Check your connection, then try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
};

type Status =
  | { kind: 'form' }
  | { kind: 'sending' }
  | { kind: 'sent'; alreadyReported: boolean }
  | { kind: 'failed'; failure: ReportFailure };

export const ReportDialog: React.FC<ReportDialogProps> = ({ isOpen, onClose, subject, onSubmit }) => {
  const [reason, setReason] = useState<string | null>(null);
  const [detail, setDetail] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'form' });
  // Survives close / reopen: a report still on its way is never sent twice.
  const sendingRef = useRef(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const location = useLocation();
  const ids = useId();
  const titleId = `${ids}-title`;
  const detailId = `${ids}-detail`;

  // Fresh form on every open, unless the previous report is still sending.
  useEffect(() => {
    if (!isOpen) return;
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!sendingRef.current) {
      setReason(null);
      setDetail('');
      setStatus({ kind: 'form' });
    }
    const frame = requestAnimationFrame(() => {
      const firstReason = dialogRef.current?.querySelector<HTMLElement>('input[type="radio"]:not([disabled])');
      (firstReason ?? dialogRef.current)?.focus();
    });
    return () => {
      cancelAnimationFrame(frame);
      const opener = openerRef.current;
      if (opener && document.contains(opener)) opener.focus();
    };
  }, [isOpen]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!reason || sendingRef.current) return;
      sendingRef.current = true;
      setStatus({ kind: 'sending' });
      const trimmed = detail.trim();
      const text = (trimmed ? `${reason}: ${trimmed}` : reason).slice(0, REPORT_REASON_MAX_LENGTH);
      try {
        const result = await onSubmit(text);
        setStatus({ kind: 'sent', alreadyReported: result.alreadyReported });
      } catch (error) {
        setStatus({ kind: 'failed', failure: reportFailureOf(error) });
      } finally {
        sendingRef.current = false;
      }
    },
    [detail, onSubmit, reason],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled])',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  const sending = status.kind === 'sending';
  const noun = subject === 'video' ? 'video' : 'comment';
  const signInHref = `/sign-in?redirect_url=${encodeURIComponent(`${location.pathname}${location.search}`)}`;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            onKeyDown={handleKeyDown}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-[420px] max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-black/95 p-6 text-white shadow-2xl focus:outline-none"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-full p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#fa7517]/60"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-5 flex items-center gap-3 pr-10">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-[#fa7517]/40 bg-[#fa7517]/15">
                <Flag className="h-[18px] w-[18px] text-[#fa7517]" aria-hidden="true" />
              </div>
              <h2 id={titleId} className="text-xl font-bold">
                Report this {noun}
              </h2>
            </div>

            {status.kind === 'sent' ? (
              <div>
                <p role="status" className="text-gray-200">
                  {status.alreadyReported
                    ? `You already reported this ${noun}. Our team will review it.`
                    : `Thanks. Our team will review this ${noun}.`}
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-6 w-full rounded-full bg-[#fa7517] px-6 py-2.5 font-medium text-black transition-colors hover:bg-[#fa7517]/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <fieldset disabled={sending}>
                  <legend className="mb-3 text-sm text-gray-400">What is wrong with this {noun}?</legend>
                  <div className="space-y-2">
                    {REASONS.map((label) => (
                      <label
                        key={label}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 text-sm transition-colors ${
                          reason === label
                            ? 'border-[#fa7517]/60 bg-[#fa7517]/10 text-white'
                            : 'border-white/5 bg-white/5 text-gray-200 hover:border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`${ids}-reason`}
                          value={label}
                          checked={reason === label}
                          onChange={() => setReason(label)}
                          className="h-4 w-4 accent-[#fa7517]"
                        />
                        {label}
                      </label>
                    ))}
                  </div>

                  <label htmlFor={detailId} className="mt-5 block text-sm text-gray-400">
                    Add details (optional)
                  </label>
                  <textarea
                    id={detailId}
                    value={detail}
                    onChange={(event) => setDetail(event.target.value.slice(0, DETAIL_MAX_LENGTH))}
                    maxLength={DETAIL_MAX_LENGTH}
                    rows={3}
                    className="mt-2 w-full resize-none rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white placeholder-gray-500 focus:border-[#fa7517]/60 focus:outline-none"
                    placeholder="Anything that helps our team understand"
                  />
                  <p className="mt-1 text-right text-xs text-gray-500">
                    {detail.length}/{DETAIL_MAX_LENGTH}
                  </p>
                </fieldset>

                {status.kind === 'failed' && (
                  <div role="alert" className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                    {failureMessage(status.failure, subject)}
                    {status.failure === 'sign_in_required' && (
                      <>
                        {' '}
                        <Link to={signInHref} className="font-medium text-[#fa7517] underline-offset-2 hover:underline">
                          Sign in
                        </Link>
                      </>
                    )}
                  </div>
                )}

                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 rounded-full border border-white/10 px-6 py-2.5 text-sm font-medium text-gray-200 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#fa7517]/60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!reason || sending}
                    className="flex-1 rounded-full bg-[#fa7517] px-6 py-2.5 text-sm font-medium text-black transition-colors hover:bg-[#fa7517]/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sending ? 'Sending…' : 'Send report'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default ReportDialog;
