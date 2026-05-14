import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  Wallet,
  X,
  XCircle,
  Clock3,
} from 'lucide-react';
import type { CryptoPurchasePhase } from '../../types/onchainPass';

/**
 * Full-screen progress modal for the crypto purchase flow.
 * Styled after the rest of the content-pass page (Resend tokens: pure black,
 * frost borders, near-white primary text, silver secondary, orange accent).
 */

interface CryptoPurchaseModalProps {
  open: boolean;
  phase: CryptoPurchasePhase;
  errorMessage?: string | null;
  txHash?: string | null;
  explorerUrl?: string | null;
  hardConflict?: boolean;
  onClose: () => void;
  onRetry?: () => void;
  watchRoute?: string | null; // e.g. /watch/:passId for the success CTA
}

const FROST_BORDER = 'border-[rgba(214,235,253,0.19)]';
const FROST_BORDER_ALT = 'border-[rgba(217,237,254,0.145)]';
const TEXT_PRIMARY = 'text-[#f0f0f0]';
const TEXT_SECONDARY = 'text-[#a1a4a5]';
const TEXT_TERTIARY = 'text-[#5c5c5c]';
const ACCENT_ORANGE = '#ff801f';
const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

type StepKey = 'signature' | 'on-chain' | 'confirming' | 'done';
const STEPS: { key: StepKey; label: string }[] = [
  { key: 'signature', label: 'Signature' },
  { key: 'on-chain', label: 'On-chain' },
  { key: 'confirming', label: 'Confirming' },
  { key: 'done', label: 'Access' },
];

const PHASE_TO_STEP_INDEX: Record<CryptoPurchasePhase, number> = {
  idle: -1,
  reserving: 0, // wallet is about to prompt
  'awaiting-signature': 0,
  'tx-pending': 1,
  confirming: 2,
  polling: 2, // treated as the same visual stage
  completed: 3,
  failed: -1,
};

const PHASE_COPY: Record<
  CryptoPurchasePhase,
  { title: string; body: string; icon: 'spin' | 'check' | 'x' | 'wallet' | 'clock' }
> = {
  idle: {
    title: 'Ready',
    body: '',
    icon: 'wallet',
  },
  reserving: {
    title: 'Reserving quote',
    body: 'Locking a price on the ledger.',
    icon: 'spin',
  },
  'awaiting-signature': {
    title: 'Confirm in your wallet',
    body: 'Approve the transaction in the wallet that just opened.',
    icon: 'wallet',
  },
  'tx-pending': {
    title: 'Transaction pending',
    body: 'The network is including your purchase in a block.',
    icon: 'spin',
  },
  confirming: {
    title: 'Confirming purchase',
    body: 'Finalizing with the server. This usually takes a few seconds.',
    icon: 'spin',
  },
  polling: {
    title: 'Finishing up',
    body: 'Reconciling the on-chain state. One more moment.',
    icon: 'clock',
  },
  completed: {
    title: 'Access unlocked',
    body: 'Your pass is yours. Enjoy the collection.',
    icon: 'check',
  },
  failed: {
    title: 'Something went wrong',
    body: '',
    icon: 'x',
  },
};

const isInFlight = (phase: CryptoPurchasePhase) =>
  phase === 'reserving' ||
  phase === 'awaiting-signature' ||
  phase === 'tx-pending' ||
  phase === 'confirming' ||
  phase === 'polling';

const shortenHash = (hash: string) =>
  hash.length > 14 ? `${hash.slice(0, 8)}…${hash.slice(-6)}` : hash;

const PhaseIcon: React.FC<{ kind: (typeof PHASE_COPY)[CryptoPurchasePhase]['icon'] }> = ({ kind }) => {
  switch (kind) {
    case 'spin':
      return (
        <Loader2
          className="w-7 h-7 animate-spin"
          style={{ color: ACCENT_ORANGE }}
        />
      );
    case 'check':
      return <CheckCircle2 className="w-7 h-7" style={{ color: ACCENT_ORANGE }} />;
    case 'x':
      return <XCircle className="w-7 h-7 text-red-400" />;
    case 'wallet':
      return <Wallet className="w-7 h-7" style={{ color: ACCENT_ORANGE }} />;
    case 'clock':
      return <Clock3 className="w-7 h-7" style={{ color: ACCENT_ORANGE }} />;
    default:
      return null;
  }
};

const StepIndicator: React.FC<{ phase: CryptoPurchasePhase }> = ({ phase }) => {
  const currentIndex = PHASE_TO_STEP_INDEX[phase];
  return (
    <ol className="flex items-center gap-3">
      {STEPS.map((step, i) => {
        const state: 'done' | 'current' | 'upcoming' | 'failed' =
          phase === 'failed'
            ? i < currentIndex
              ? 'done'
              : i === currentIndex
              ? 'failed'
              : 'upcoming'
            : i < currentIndex
            ? 'done'
            : i === currentIndex
            ? 'current'
            : 'upcoming';

        return (
          <li key={step.key} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                  state === 'done' || state === 'current'
                    ? ''
                    : 'bg-white/10'
                }`}
                style={
                  state === 'done' || state === 'current'
                    ? { backgroundColor: ACCENT_ORANGE }
                    : undefined
                }
              />
              <span
                className={`text-[11px] uppercase ${
                  state === 'current'
                    ? TEXT_PRIMARY
                    : state === 'done'
                    ? TEXT_SECONDARY
                    : TEXT_TERTIARY
                }`}
                style={{ letterSpacing: '0.16em' }}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span
                className={`w-6 h-px ${
                  state === 'done' ? '' : 'bg-white/10'
                }`}
                style={state === 'done' ? { backgroundColor: ACCENT_ORANGE } : undefined}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
};

const CryptoPurchaseModal: React.FC<CryptoPurchaseModalProps> = ({
  open,
  phase,
  errorMessage,
  txHash,
  explorerUrl,
  hardConflict,
  onClose,
  onRetry,
  watchRoute,
}) => {
  const navigate = useNavigate();
  const copy = PHASE_COPY[phase] ?? PHASE_COPY.idle;
  const inFlight = isInFlight(phase);

  // Prevent body scroll while modal is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close on Escape (only when not in-flight — never trap the user on error).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="crypto-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: EASE_OUT }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="crypto-modal-title"
        >
          {/* Scrim */}
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onClose()}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
            className={`relative w-full max-w-lg rounded-3xl border ${FROST_BORDER} bg-black overflow-hidden`}
          >
            {/* Subtle warm glow */}
            <div
              aria-hidden
              className="absolute -top-24 left-1/2 -translate-x-1/2 w-[420px] h-[160px] pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at center, ${ACCENT_ORANGE}1f 0%, transparent 70%)`,
                filter: 'blur(40px)',
              }}
            />

            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="Close"
              className={`absolute top-4 right-4 w-8 h-8 rounded-full border ${FROST_BORDER} bg-black/50 backdrop-blur-sm flex items-center justify-center ${TEXT_SECONDARY} hover:text-white transition-colors`}
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div className="relative p-8 md:p-10">
              {/* Step indicator */}
              <div className="mb-10 flex justify-center">
                <StepIndicator phase={phase} />
              </div>

              {/* Phase icon + title + body */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={phase}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3, ease: EASE_OUT }}
                  className="flex flex-col items-center text-center"
                >
                  <div
                    className={`w-16 h-16 rounded-full border ${FROST_BORDER} flex items-center justify-center mb-6`}
                  >
                    <PhaseIcon kind={copy.icon} />
                  </div>
                  <h2
                    id="crypto-modal-title"
                    className={`${TEXT_PRIMARY} font-medium mb-3`}
                    style={{
                      fontSize: 'clamp(1.5rem, 2.6vw, 1.875rem)',
                      letterSpacing: '-0.03em',
                      lineHeight: 1.15,
                    }}
                  >
                    {copy.title}
                  </h2>
                  {copy.body && (
                    <p
                      className={`text-base leading-relaxed ${TEXT_SECONDARY} max-w-sm`}
                    >
                      {copy.body}
                    </p>
                  )}

                  {/* Error message (failed state) */}
                  {phase === 'failed' && errorMessage && (
                    <p className="mt-4 text-sm text-red-300 max-w-sm leading-relaxed">
                      {errorMessage}
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Tx hash link */}
              {txHash && phase !== 'idle' && (
                <div className={`mt-8 pt-6 border-t ${FROST_BORDER_ALT} text-center`}>
                  <div
                    className={`text-[10px] uppercase ${TEXT_TERTIARY} mb-2`}
                    style={{ letterSpacing: '0.16em' }}
                  >
                    Transaction
                  </div>
                  {explorerUrl ? (
                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 text-sm ${TEXT_PRIMARY} hover:opacity-80 transition-opacity`}
                      style={{
                        fontFamily:
                          "'Commit Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
                      }}
                    >
                      {shortenHash(txHash)}
                      <ExternalLink className={`w-3.5 h-3.5 ${TEXT_SECONDARY}`} />
                    </a>
                  ) : (
                    <span
                      className={`text-sm ${TEXT_PRIMARY}`}
                      style={{
                        fontFamily:
                          "'Commit Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
                      }}
                    >
                      {shortenHash(txHash)}
                    </span>
                  )}
                </div>
              )}

              {/* Safe-to-close hint during the ambient-pending phases */}
              {inFlight && phase !== 'awaiting-signature' && phase !== 'reserving' && (
                <p
                  className={`mt-6 text-xs ${TEXT_TERTIARY} text-center`}
                  style={{ letterSpacing: '0.04em' }}
                >
                  You can close this — we&rsquo;ll finish the purchase in the background.
                </p>
              )}

              {/* Terminal-state CTAs */}
              {phase === 'completed' && (
                <div className="mt-10 flex flex-col gap-3">
                  {watchRoute && (
                    <button
                      onClick={() => {
                        navigate(watchRoute);
                        onClose();
                      }}
                      className="w-full px-6 py-3 rounded-full bg-white text-black font-medium text-sm hover:bg-white/90 transition-colors"
                      style={{ letterSpacing: '-0.01em' }}
                    >
                      Start watching
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className={`w-full px-6 py-3 rounded-full bg-transparent ${TEXT_PRIMARY} text-sm border ${FROST_BORDER} hover:bg-white/[0.04] transition-colors`}
                  >
                    Close
                  </button>
                </div>
              )}

              {phase === 'failed' && (
                <div className="mt-10 flex flex-col gap-3">
                  {onRetry && !hardConflict && (
                    <button
                      onClick={onRetry}
                      className="w-full px-6 py-3 rounded-full bg-white text-black font-medium text-sm hover:bg-white/90 transition-colors"
                    >
                      Try again
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className={`w-full px-6 py-3 rounded-full bg-transparent ${TEXT_PRIMARY} text-sm border ${FROST_BORDER} hover:bg-white/[0.04] transition-colors`}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CryptoPurchaseModal;
