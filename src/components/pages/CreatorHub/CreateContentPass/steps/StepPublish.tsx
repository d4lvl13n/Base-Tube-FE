import React, { useState } from 'react';
import { AlertTriangle, Banknote, Coins, Wallet } from 'lucide-react';
import * as S from '../styles';
import type { CreatorSettlementPreference } from '../../../../../types/pass';

interface StepPublishProps {
  settlementPreference: CreatorSettlementPreference | '';
  onSettlementChange: (value: CreatorSettlementPreference) => void;
  payoutAddress: string;
  onPayoutAddressChange: (value: string) => void;
  linkedWallet?: string | null;
  isPublishing?: boolean;
  publishError?: string | null;
  onPublish: () => void;
}

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

const StepPublish: React.FC<StepPublishProps> = ({
  settlementPreference,
  onSettlementChange,
  payoutAddress,
  onPayoutAddressChange,
  linkedWallet,
  isPublishing,
  publishError,
  onPublish,
}) => {
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">How do you want to get paid?</h2>
        <p className="mt-2 text-sm leading-6 text-gray-400">
          Fans can still pay by card or crypto. This only chooses where <em>your</em> share goes.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={() => onSettlementChange('fiat')}
          className={`rounded-2xl border p-5 text-left transition-colors ${
            settlementPreference === 'fiat'
              ? 'border-[#fa7517] bg-[#fa7517]/10'
              : 'border-white/10 bg-white/[0.03] hover:border-white/20'
          }`}
        >
          <Banknote className={`mb-3 h-6 w-6 ${settlementPreference === 'fiat' ? 'text-[#fa7517]' : 'text-gray-400'}`} />
          <p className="font-medium text-white">Bank / card (euros)</p>
          <p className="mt-1 text-sm text-gray-400">
            You receive euros. Card sales use Stripe test payouts.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onSettlementChange('crypto')}
          className={`rounded-2xl border p-5 text-left transition-colors ${
            settlementPreference === 'crypto'
              ? 'border-[#fa7517] bg-[#fa7517]/10'
              : 'border-white/10 bg-white/[0.03] hover:border-white/20'
          }`}
        >
          <Coins className={`mb-3 h-6 w-6 ${settlementPreference === 'crypto' ? 'text-[#fa7517]' : 'text-gray-400'}`} />
          <p className="font-medium text-white">Crypto (USDC)</p>
          <p className="mt-1 text-sm text-gray-400">
            You receive test USDC on Base Sepolia.
          </p>
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-start gap-3">
          <Wallet className="mt-0.5 h-5 w-5 text-[#fa7517]" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-white">Where should it arrive?</p>
            <p className="mt-1 text-sm leading-6 text-gray-400">
              Every published pass is registered on the test network, even if you chose euros.
              Use a wallet you already control on Base Sepolia. We do not create one for you.
            </p>

            {linkedWallet ? (
              <p className="mt-3 truncate rounded-lg bg-black/40 px-3 py-2 font-mono text-xs text-gray-200">
                Linked wallet: {linkedWallet}
              </p>
            ) : (
              <p className="mt-3 text-sm text-gray-400">
                No wallet is linked yet. Paste a test address below, or connect one in your profile.
              </p>
            )}

            <label className="mt-4 block text-sm text-gray-300">
              {linkedWallet ? 'Or use a different test address (optional)' : 'Test wallet address'}
              <input
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
                className={`mt-2 w-full rounded-xl border bg-black/40 px-4 py-3 font-mono text-sm text-white outline-none focus:border-[#fa7517] ${
                  touchedAddress && !hasDestination
                    ? 'border-red-400'
                    : 'border-white/10'
                }`}
              />
            </label>
            {touchedAddress && !addressValid && (
              <p className="mt-2 text-sm text-red-300">That does not look like a 0x wallet address.</p>
            )}
            {touchedAddress && addressValid && !hasDestination && (
              <p className="mt-2 text-sm text-red-300">Paste a test wallet address to continue.</p>
            )}
          </div>
        </div>
      </div>

      {shownError && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-red-300" />
            <div>
              <p className="font-medium text-red-200">Could not publish</p>
              <p className="mt-1 text-sm text-red-100/90">{shownError}</p>
            </div>
          </div>
        </div>
      )}

      <S.LaunchButton
        type="button"
        onClick={handlePublishClick}
        disabled={isPublishing}
        style={canPublish || isPublishing ? undefined : { opacity: 0.7 }}
        whileHover={!isPublishing ? { scale: 1.02 } : undefined}
        whileTap={!isPublishing ? { scale: 0.98 } : undefined}
      >
        {isPublishing ? 'Publishing…' : 'Publish pass'}
      </S.LaunchButton>

      <p className="text-center text-xs text-gray-500">
        Publishing registers the pass on the test network. Fans cannot buy it until this succeeds.
      </p>
    </div>
  );
};

export default StepPublish;
