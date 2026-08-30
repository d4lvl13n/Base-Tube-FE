import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, Banknote, Coins } from 'lucide-react';
import { cx, editorial, form, motionPresets, selectable } from '../../shared/hubStyles';
import type { CreatorSettlementPreference } from '../../../../../types/pass';

export interface PublishSummary {
  title: string;
  priceLabel: string;
  supplyCap?: number;
  videoCount: number;
}

interface StepPublishProps {
  settlementPreference: CreatorSettlementPreference | '';
  onSettlementChange: (value: CreatorSettlementPreference) => void;
  payoutAddress: string;
  onPayoutAddressChange: (value: string) => void;
  linkedWallet?: string | null;
  isPublishing?: boolean;
  publishError?: string | null;
  onPublish: () => void;
  /** Read-only facts for the masthead strip. */
  summary: PublishSummary;
  onBack: () => void;
}

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

const STAGGER = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const StepPublish: React.FC<StepPublishProps> = ({
  settlementPreference,
  onSettlementChange,
  payoutAddress,
  onPayoutAddressChange,
  linkedWallet,
  isPublishing,
  publishError,
  onPublish,
  summary,
  onBack,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const fadeUp = prefersReducedMotion ? undefined : motionPresets.fadeUp;
  const fadeUpSmall = prefersReducedMotion ? undefined : motionPresets.fadeUpSmall;

  const [touchedAddress, setTouchedAddress] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const trimmed = payoutAddress.trim();
  const addressValid = trimmed === '' || ADDRESS_RE.test(trimmed);
  const hasDestination = Boolean(linkedWallet) || ADDRESS_RE.test(trimmed);
  const canPublish = Boolean(settlementPreference) && hasDestination && addressValid && !isPublishing;
  const shownError = localError || publishError;

  const handlePublishClick = () => {
    if (isPublishing) return;
    if (!settlementPreference) {
      setLocalError('Choose how you want to get paid first.');
      return;
    }
    if (!hasDestination || !addressValid) {
      setTouchedAddress(true);
      setLocalError(
        'Paste a test wallet address first. Publishing still needs one to register the pass, even if you want euros later.'
      );
      return;
    }
    setLocalError(null);
    onPublish();
  };

  const settlementOptions: Array<{
    value: CreatorSettlementPreference;
    label: string;
    detail: string;
    Icon: typeof Banknote;
  }> = [
    { value: 'fiat', label: 'Bank / card (euros)', detail: 'You receive euros. Card sales use Stripe test payouts.', Icon: Banknote },
    { value: 'crypto', label: 'Crypto (USDC)', detail: 'You receive test USDC on Base Sepolia.', Icon: Coins },
  ];

  return (
    <motion.div
      initial={prefersReducedMotion ? false : 'hidden'}
      whileInView="visible"
      viewport={{ once: true }}
      variants={prefersReducedMotion ? undefined : STAGGER}
      className="space-y-10 py-6 text-[#f0f0f0]"
    >
      {/* ── Masthead ───────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-5 text-center">
        <motion.p variants={fadeUpSmall} className={editorial.eyebrow} style={{ letterSpacing: '0.3em' }}>
          Publish
        </motion.p>
        <motion.h2
          variants={fadeUp}
          className={cx(editorial.masthead, '[text-wrap:balance]')}
          style={editorial.mastheadStyle}
        >
          {summary.title || 'Untitled pass'}
        </motion.h2>
        <motion.div variants={fadeUpSmall} className={editorial.strip} style={{ letterSpacing: '0.16em' }}>
          <span className="tabular-nums">{summary.priceLabel}</span>
          <span aria-hidden className={editorial.textTertiary}>·</span>
          <span className="tabular-nums">
            {summary.supplyCap ? `${summary.supplyCap} ${summary.supplyCap === 1 ? 'pass' : 'passes'}` : 'Unlimited'}
          </span>
          <span aria-hidden className={editorial.textTertiary}>·</span>
          <span className="tabular-nums">
            {summary.videoCount} video{summary.videoCount !== 1 ? 's' : ''}
          </span>
        </motion.div>
      </div>

      {/* ── Settlement ─────────────────────────────────────────────────── */}
      <motion.section variants={fadeUp} className={editorial.panel} aria-labelledby="settlement-title">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 left-1/2 h-[200px] w-[500px] -translate-x-1/2"
          style={editorial.glowStyle}
        />

        <div className="relative space-y-8 p-6 md:p-10">
          <div className="space-y-2">
            <p className={editorial.eyebrow} style={{ letterSpacing: '0.3em' }}>Settlement</p>
            <h3 id="settlement-title" className={cx('text-xl font-medium', editorial.textPrimary)} style={{ letterSpacing: '-0.02em' }}>
              How do you want to get paid?
            </h3>
            <p className={cx('text-sm leading-6', editorial.textSecondary)}>
              Fans can still pay by card or crypto. This only chooses where <em>your</em> share goes.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2" role="radiogroup" aria-labelledby="settlement-title">
            {settlementOptions.map(({ value, label, detail, Icon }) => {
              const active = settlementPreference === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onSettlementChange(value)}
                  className={cx(selectable.base, 'p-5', active ? selectable.active : selectable.idle)}
                >
                  <Icon className={cx('mb-3 h-4 w-4', active ? 'text-[#fa7517]' : 'text-gray-500')} aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-100">{label}</p>
                  <p className="mt-1 text-sm text-gray-400">{detail}</p>
                </button>
              );
            })}
          </div>

          <div className={cx('space-y-4 pt-8', editorial.divider)}>
            <div className="space-y-1">
              <p className={cx('text-sm font-medium', editorial.textPrimary)}>Where should it arrive?</p>
              <p className={cx('text-sm leading-6', editorial.textSecondary)}>
                Every published pass is registered on the test network, even if you chose euros.
                Use a wallet you already control on Base Sepolia. We do not create one for you.
              </p>
            </div>

            {linkedWallet ? (
              <p className="truncate rounded-md border border-gray-800/60 bg-white/5 px-3 py-2 font-mono text-xs text-gray-200">
                Linked wallet: {linkedWallet}
              </p>
            ) : (
              <p className={cx('text-sm', editorial.textSecondary)}>
                No wallet is linked yet. Paste a test address below, or connect one in your profile.
              </p>
            )}

            <div className="space-y-1.5">
              <label htmlFor="payout-address" className={form.fieldLabel}>
                {linkedWallet ? 'Or use a different test address (optional)' : 'Test wallet address'}
              </label>
              <input
                id="payout-address"
                type="text"
                value={payoutAddress}
                onChange={(e) => {
                  onPayoutAddressChange(e.target.value);
                  setLocalError(null);
                }}
                onBlur={() => setTouchedAddress(true)}
                placeholder="0x…"
                autoComplete="off"
                spellCheck={false}
                aria-invalid={touchedAddress && !hasDestination ? true : undefined}
                className={cx(form.input, 'font-mono', touchedAddress && !hasDestination && 'border-red-500/60')}
              />
              {touchedAddress && !addressValid && (
                <p className={form.errorText}>That does not look like a 0x wallet address.</p>
              )}
              {touchedAddress && addressValid && !hasDestination && (
                <p className={form.errorText}>Paste a test wallet address to continue.</p>
              )}
            </div>
          </div>

          {shownError && (
            <div className={form.errorNote} role="alert">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-medium">Could not publish</p>
                <p className="mt-0.5 text-red-300/90">{shownError}</p>
              </div>
            </div>
          )}
        </div>
      </motion.section>

      {/* ── Actions ────────────────────────────────────────────────────── */}
      <motion.div variants={fadeUpSmall} className="flex flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <button type="button" onClick={onBack} className={editorial.secondaryButton}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </button>
          <button
            type="button"
            onClick={handlePublishClick}
            disabled={isPublishing}
            style={canPublish || isPublishing ? undefined : { opacity: 0.7 }}
            className={editorial.primaryButton}
          >
            {isPublishing ? 'Publishing…' : 'Publish pass'}
          </button>
        </div>
        <p className={cx('text-center text-xs', editorial.textTertiary)}>
          Publishing registers the pass on the test network. Fans cannot buy it until this succeeds.
        </p>
      </motion.div>
    </motion.div>
  );
};

export default StepPublish;
