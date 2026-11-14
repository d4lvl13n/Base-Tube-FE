import React, { useState } from 'react';
import { AlertTriangle, ArrowLeft, Banknote, Check, Coins, Lock } from 'lucide-react';
import { cx, form, heroGlow, note, selectable } from '../../Business/businessStyles';
import type { CreatorSettlementPreference } from '../../../../../types/pass';
import {
  FROZEN_AFTER_FIRST_SALE,
  NO_CAP_SET,
  SUPPLY_CAP_HELP,
  defaultMaxPerBuyer,
  passesText,
  perPersonText,
  validateMaxPerBuyer,
  validateSupplyCap,
} from '../../../../../utils/passTerms';
import { FieldError, FieldHelp, FieldLabel, WizardCard, describedBy, wizardInput, wizardInputInvalid } from '../wizardUi';

export interface PublishSummary {
  title: string;
  priceLabel: string;
  /** Missing on a draft created before every pass had a cap: it cannot be published until one is set. */
  supplyCap?: number | null;
  maxPerBuyer?: number | null;
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
  /** Read-only facts for the summary at the top. */
  summary: PublishSummary;
  onBack: () => void;
  /** Saves a cap (and per-person limit) on a draft that has none. */
  onSetLimits?: (limits: { supplyCap: number; maxPerBuyer: number }) => Promise<void>;
  isSavingLimits?: boolean;
}

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

/** A legacy draft with no cap: the two numbers, set here before publishing. */
const SetLimitsCard: React.FC<{
  onSave: NonNullable<StepPublishProps['onSetLimits']>;
  saving?: boolean;
}> = ({ onSave, saving }) => {
  const [capInput, setCapInput] = useState('');
  const [perBuyerInput, setPerBuyerInput] = useState('');
  const [touched, setTouched] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const cap = capInput === '' ? undefined : Number.parseInt(capInput, 10);
  const perBuyer = perBuyerInput === '' ? (cap ? defaultMaxPerBuyer(cap) : undefined) : Number.parseInt(perBuyerInput, 10);
  const capCheck = validateSupplyCap(cap);
  const perBuyerCheck = validateMaxPerBuyer(perBuyer, cap);
  const capError = touched && capCheck !== true ? capCheck : null;
  const perBuyerError = touched && capCheck === true && perBuyerCheck !== true ? perBuyerCheck : null;

  const save = async () => {
    setTouched(true);
    setSaveError(null);
    if (capCheck !== true || perBuyerCheck !== true || cap === undefined || perBuyer === undefined) return;
    try {
      await onSave({ supplyCap: cap, maxPerBuyer: perBuyer });
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save. Try again.');
    }
  };

  return (
    <WizardCard
      id="set-limits"
      title={
        <span className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
          {NO_CAP_SET}
        </span>
      }
      description={SUPPLY_CAP_HELP}
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="legacy-supply-cap">Number of passes</FieldLabel>
          <input
            id="legacy-supply-cap"
            type="text"
            inputMode="numeric"
            placeholder="250"
            value={capInput}
            aria-invalid={capError ? true : undefined}
            aria-describedby={describedBy(capError && 'legacy-supply-cap-error')}
            onChange={(e) => setCapInput(e.target.value.replace(/\D/g, '').slice(0, 7))}
            className={cx(wizardInput, 'tabular-nums', capError && wizardInputInvalid)}
          />
          <FieldError id="legacy-supply-cap-error">{capError}</FieldError>
        </div>
        <div>
          <FieldLabel htmlFor="legacy-max-per-buyer" hint={cap && capCheck === true ? `1 to ${cap.toLocaleString('en-US')}` : undefined}>
            Most passes one person can buy
          </FieldLabel>
          <input
            id="legacy-max-per-buyer"
            type="text"
            inputMode="numeric"
            placeholder={String(defaultMaxPerBuyer(cap))}
            value={perBuyerInput}
            aria-invalid={perBuyerError ? true : undefined}
            aria-describedby={describedBy('legacy-max-per-buyer-help', perBuyerError && 'legacy-max-per-buyer-error')}
            onChange={(e) => setPerBuyerInput(e.target.value.replace(/\D/g, '').slice(0, 7))}
            className={cx(wizardInput, 'tabular-nums', perBuyerError && wizardInputInvalid)}
          />
          <FieldError id="legacy-max-per-buyer-error">{perBuyerError}</FieldError>
          <FieldHelp id="legacy-max-per-buyer-help">Leave empty to use {defaultMaxPerBuyer(cap)}.</FieldHelp>
        </div>
      </div>
      {saveError && (
        <div className={cx(form.errorNote, 'mt-4')} role="alert">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <p>{saveError}</p>
        </div>
      )}
      <div className="mt-5 flex justify-end border-t border-gray-800/50 pt-4">
        <button type="button" onClick={() => void save()} disabled={saving} className={form.secondaryButton}>
          {saving ? 'Saving…' : 'Save these numbers'}
        </button>
      </div>
    </WizardCard>
  );
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
  onSetLimits,
  isSavingLimits,
}) => {
  const [touchedAddress, setTouchedAddress] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const trimmed = payoutAddress.trim();
  const addressValid = trimmed === '' || ADDRESS_RE.test(trimmed);
  const hasDestination = Boolean(linkedWallet) || ADDRESS_RE.test(trimmed);
  const hasCap = typeof summary.supplyCap === 'number' && summary.supplyCap > 0;
  const canPublish = hasCap && Boolean(settlementPreference) && hasDestination && addressValid && !isPublishing;
  const shownError = localError || publishError;

  const handlePublishClick = () => {
    if (isPublishing) return;
    if (!hasCap) {
      setLocalError('Set how many passes exist first.');
      return;
    }
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

  const facts: Array<{ label: string; value: string; missing?: boolean }> = [
    { label: 'Price', value: summary.priceLabel },
    { label: 'Passes', value: hasCap ? passesText(summary.supplyCap as number) : 'No cap set', missing: !hasCap },
    ...(summary.maxPerBuyer ? [{ label: 'Per person', value: perPersonText(summary.maxPerBuyer) }] : []),
    { label: 'Videos', value: `${summary.videoCount} video${summary.videoCount !== 1 ? 's' : ''}` },
  ];

  return (
    <div className="space-y-5">
      {/* ── What is being published ───────────────────────────────────── */}
      <WizardCard id="publish-summary" style={heroGlow}>
        <p className="text-sm text-gray-400">You are publishing</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-white [text-wrap:balance] sm:text-3xl">
          {summary.title || 'Untitled pass'}
        </h2>
        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-gray-800/50 pt-5 sm:grid-cols-4">
          {facts.map((fact) => (
            <div key={fact.label} className="min-w-0">
              <dt className="text-xs text-gray-400">{fact.label}</dt>
              <dd className={cx('mt-0.5 truncate text-base font-semibold tabular-nums', fact.missing ? 'text-amber-300' : 'text-white')}>
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-gray-400">
          <Lock className="mt-px h-3.5 w-3.5 shrink-0 text-gray-500" aria-hidden="true" />
          {FROZEN_AFTER_FIRST_SALE}
        </p>
      </WizardCard>

      {!hasCap && onSetLimits && <SetLimitsCard onSave={onSetLimits} saving={isSavingLimits} />}

      {/* ── Settlement ─────────────────────────────────────────────────── */}
      <WizardCard
        id="settlement"
        title="How do you want to get paid?"
        description={
          <>
            Fans can still pay by card or crypto. This only chooses where <em className="not-italic text-gray-200">your</em> share goes.
          </>
        }
      >
        <div className="grid gap-3 md:grid-cols-2" role="radiogroup" aria-labelledby="settlement-title">
          {settlementOptions.map(({ value, label, detail, Icon }) => {
            const active = settlementPreference === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => {
                  onSettlementChange(value);
                  setLocalError(null);
                }}
                className={cx(selectable.base, 'p-4', active ? selectable.active : selectable.idle)}
              >
                <span className="flex items-start justify-between gap-3">
                  <Icon className={cx('h-5 w-5', active ? 'text-[#fa7517]' : 'text-gray-400')} aria-hidden="true" />
                  <span
                    aria-hidden="true"
                    className={cx(
                      'flex h-4 w-4 items-center justify-center rounded-full border',
                      active ? 'border-[#fa7517] bg-[#fa7517] text-black' : 'border-gray-600',
                    )}
                  >
                    {active && <Check className="h-3 w-3" />}
                  </span>
                </span>
                <span className="mt-3 block text-sm font-medium text-gray-100">{label}</span>
                <span className="mt-1 block text-sm text-gray-400">{detail}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 space-y-4 border-t border-gray-800/50 pt-6">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-200">Where should it arrive?</p>
            <p className="text-sm leading-6 text-gray-400">
              Every published pass is registered on the test network, even if you chose euros.
              Use a wallet you already control on Base Sepolia. We do not create one for you.
            </p>
          </div>

          {linkedWallet ? (
            <p className={cx(note.neutral, 'truncate font-mono')}>
              Linked wallet: {linkedWallet}
            </p>
          ) : (
            <p className="text-sm text-gray-400">
              No wallet is linked yet. Paste a test address below, or connect one in your profile.
            </p>
          )}

          <div>
            <FieldLabel htmlFor="payout-address">
              {linkedWallet ? 'Or use a different test address (optional)' : 'Test wallet address'}
            </FieldLabel>
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
              className={cx(wizardInput, 'font-mono', touchedAddress && !hasDestination && wizardInputInvalid)}
            />
            {touchedAddress && !addressValid && <FieldError>That does not look like a 0x wallet address.</FieldError>}
            {touchedAddress && addressValid && !hasDestination && <FieldError>Paste a test wallet address to continue.</FieldError>}
          </div>
        </div>

        {shownError && (
          <div className={cx(form.errorNote, 'mt-5')} role="alert">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-medium">Could not publish</p>
              <p className="mt-0.5 text-red-300/90">{shownError}</p>
            </div>
          </div>
        )}
      </WizardCard>

      {/* ── Actions ────────────────────────────────────────────────────── */}
      <div className="flex flex-col-reverse gap-3 border-t border-gray-800/50 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={onBack} className={form.ghostButton}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </button>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <button
            type="button"
            onClick={handlePublishClick}
            disabled={isPublishing}
            aria-disabled={!canPublish || undefined}
            className={cx(form.primaryButton, 'h-10 px-5', !canPublish && !isPublishing && 'opacity-60')}
          >
            {isPublishing ? 'Publishing…' : 'Publish pass'}
          </button>
          <p className="text-xs text-gray-400 sm:text-right">
            Publishing registers the pass on the test network. Fans cannot buy it until this succeeds.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StepPublish;
