import React, { useEffect, useState } from 'react';
import { PlayCircle, Wallet, Clock3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UnlockButton from './UnlockButton';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useCryptoDirectBuy } from '../../hooks/useOnchainPass';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import CryptoPurchaseModal from './CryptoPurchaseModal';
import PassConsentBoxes from './PassConsentBoxes';
import type { CryptoPurchasePhase } from '../../types/onchainPass';
import { readCryptoCheckoutContext } from '../../utils/checkoutStorage';
import { getPassErrorMessage } from '../../utils/passErrorMessages';
import { saleConsentPayload, type SaleConsentPublic } from '../../constants/passConsent';

interface PassActionButtonProps {
  pass: {
    id: string;
    onchain_pass_id?: number | null;
    tier: string;
    formatted_price: string;
    price_cents?: number;
    currency?: string;
    supply_cap?: number;
    minted_count?: number;
    sold_count?: number;
    available_count?: number | null;
    can_purchase?: boolean;
    publish_status?: string;
    purchase_block_reason_code?: string | null;
    purchase_block_reason?: string | null;
    sale_consent?: SaleConsentPublic;
  };
  alreadyOwns: boolean;
  isAccessLoading: boolean;
}

const BLOCK_REASON_FALLBACKS: Record<string, string> = {
  PASS_NOT_PUBLISHED: 'This pass is not for sale yet.',
  PASS_NOT_ONCHAIN: 'This pass is not for sale yet.',
  PASS_SALE_INACTIVE: 'This pass is not currently on sale.',
  PASS_SOLD_OUT: 'This pass is sold out.',
};

function getBlockMessage(pass: PassActionButtonProps['pass']): string | null {
  if (pass.can_purchase !== false) return null;
  if (pass.purchase_block_reason) return pass.purchase_block_reason;
  if (pass.purchase_block_reason_code) {
    return BLOCK_REASON_FALLBACKS[pass.purchase_block_reason_code] ?? 'This pass cannot be purchased right now.';
  }
  return 'This pass cannot be purchased right now.';
}

// Mirrors base-be passQuantity.ts: one grantKeys batch until batching is resumable.
const MAX_CHECKOUT_QUANTITY = 20;

function remainingForPass(pass: PassActionButtonProps['pass']): number | null {
  if (pass.available_count != null) return Math.max(0, pass.available_count);
  if (pass.supply_cap && pass.supply_cap > 0) {
    return Math.max(0, pass.supply_cap - (pass.sold_count ?? pass.minted_count ?? 0));
  }
  return null;
}

function formatCheckoutTotal(priceCents: number, quantity: number, currency?: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: (currency || 'EUR').toUpperCase(),
      minimumFractionDigits: 2,
    }).format((priceCents * quantity) / 100);
  } catch {
    return `${((priceCents * quantity) / 100).toFixed(2)}`;
  }
}

const FROST_BORDER = 'border-[rgba(214,235,253,0.19)]';

function QuantityStepper({
  quantity,
  max,
  remaining,
  disabled,
  onChange,
  totalLabel,
}: {
  quantity: number;
  max: number;
  remaining: number | null;
  disabled?: boolean;
  onChange: (next: number) => void;
  totalLabel?: string | null;
}) {
  const clamp = (n: number) => Math.min(max, Math.max(1, n));
  const remainingLabel =
    remaining == null
      ? null
      : remaining === 1
        ? '1 remaining'
        : `${remaining} remaining`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <span className="text-xs uppercase text-[#a1a4a5]" style={{ letterSpacing: '0.12em' }}>
          Quantity
        </span>
        <div className={`inline-flex items-center rounded-full border ${FROST_BORDER} overflow-hidden`}>
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={disabled || quantity <= 1}
            onClick={() => onChange(clamp(quantity - 1))}
            className="px-3 py-1.5 text-sm text-[#f0f0f0] disabled:opacity-40 hover:bg-white/[0.04]"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            max={max}
            value={quantity}
            disabled={disabled}
            onChange={(e) => {
              const n = Number.parseInt(e.target.value, 10);
              if (Number.isFinite(n)) onChange(clamp(n));
            }}
            className="w-14 bg-transparent text-center text-sm text-[#f0f0f0] tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <button
            type="button"
            aria-label="Increase quantity"
            disabled={disabled || quantity >= max}
            onClick={() => onChange(clamp(quantity + 1))}
            className="px-3 py-1.5 text-sm text-[#f0f0f0] disabled:opacity-40 hover:bg-white/[0.04]"
          >
            +
          </button>
        </div>
        {remainingLabel ? (
          <span className="text-xs text-[#5c5c5c]">{remainingLabel}</span>
        ) : null}
      </div>
      {totalLabel ? (
        <p className="text-sm text-[#f0f0f0]">
          Total {totalLabel}
        </p>
      ) : null}
    </div>
  );
}

const PRIMARY_PILL =
  'w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white text-black font-medium text-sm tracking-tight transition-colors hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed';

const SECONDARY_PILL = `w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-transparent text-[#f0f0f0] font-medium text-sm tracking-tight border ${FROST_BORDER} transition-colors hover:bg-white/[0.04] disabled:opacity-50 disabled:cursor-not-allowed`;

/**
 * Crypto-button label for inline display, driven by the crypto flow phase.
 * Modal renders the full progress UI; this label is the CTA surface only.
 */
function cryptoButtonLabel(
  phase: CryptoPurchasePhase,
  isConnected: boolean,
): string {
  switch (phase) {
    case 'reserving':
      return 'Reserving quote…';
    case 'awaiting-signature':
      return 'Confirm in wallet…';
    case 'tx-pending':
      return 'Transaction pending…';
    case 'confirming':
      return 'Confirming purchase…';
    case 'polling':
      return 'Finishing up…';
    case 'completed':
      return 'Purchase complete';
    case 'failed':
      return 'Try again';
    default:
      return isConnected ? 'Buy with crypto' : 'Connect wallet for crypto';
  }
}

const PassActionButton: React.FC<PassActionButtonProps> = ({
  pass,
  alreadyOwns,
  isAccessLoading,
}) => {
  const navigate = useNavigate();
  const { isConnected, address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const requireAuth = useRequireAuth();
  const cryptoDirect = useCryptoDirectBuy(pass.id);
  const { markCompletedFromResume, markConflictFromResume, retryPendingConfirmation } = cryptoDirect;
  const [cryptoReservationExpiresAt, setCryptoReservationExpiresAt] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const remaining = remainingForPass(pass);
  const maxQty = Math.max(1, Math.min(remaining ?? MAX_CHECKOUT_QUANTITY, MAX_CHECKOUT_QUANTITY));
  const [quantity, setQuantity] = useState(1);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutIntent, setCheckoutIntent] = useState<'card' | 'crypto' | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedWithdrawal, setAcceptedWithdrawal] = useState(false);
  const consentReady = acceptedTerms && acceptedWithdrawal;
  const consentPayload = saleConsentPayload(pass.sale_consent, acceptedTerms, acceptedWithdrawal);
  const canPurchase =
    pass.can_purchase === true &&
    (pass.publish_status === undefined || pass.publish_status === 'published');
  const blockMessage = getBlockMessage(pass);

  // Resume-hook success event may fire while the user is back on a pass page.
  // If it matches the pass we're rendering, surface the modal in completed state.
  useEffect(() => {
    const resumedHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        passId?: string;
        txHash?: string | null;
        explorerUrl?: string | null;
      } | undefined;
      if (detail?.passId && detail.passId === pass.id) {
        markCompletedFromResume({
          txHash: detail.txHash ?? null,
          explorerUrl: detail.explorerUrl ?? null,
        });
        setCheckoutIntent('crypto');
        setModalOpen(true);
      }
    };
    const conflictHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        passId?: string;
        message?: string;
        txHash?: string | null;
        explorerUrl?: string | null;
      } | undefined;
      if (detail?.passId && detail.passId === pass.id) {
        markConflictFromResume(detail.message || 'Purchase confirmation conflict', {
          txHash: detail.txHash ?? null,
          explorerUrl: detail.explorerUrl ?? null,
        });
        setCheckoutIntent('crypto');
        setModalOpen(true);
      }
    };
    window.addEventListener('crypto-purchase:resumed', resumedHandler);
    window.addEventListener('crypto-purchase:conflict', conflictHandler);
    return () => {
      window.removeEventListener('crypto-purchase:resumed', resumedHandler);
      window.removeEventListener('crypto-purchase:conflict', conflictHandler);
    };
  }, [markCompletedFromResume, markConflictFromResume, pass.id]);

  useEffect(() => {
    setQuantity((q) => Math.min(Math.max(1, q), maxQty));
  }, [maxQty]);

  if (isAccessLoading && !checkoutIntent) {
    return <div className="h-12 w-full bg-white/[0.04] rounded-full animate-pulse" />;
  }

  const cryptoInFlight =
    cryptoDirect.isPending ||
    cryptoDirect.phase === 'reserving' ||
    cryptoDirect.phase === 'awaiting-signature' ||
    cryptoDirect.phase === 'tx-pending' ||
    cryptoDirect.phase === 'confirming' ||
    cryptoDirect.phase === 'polling';

  const chooseMethod = (method: 'card' | 'crypto') => {
    if (cryptoInFlight) return;
    setCheckoutError(null);
    setCheckoutIntent(method);
  };

  const handleCryptoClick = async () => {
    try {
      console.log('[CryptoPay] click', {
        passId: pass.id,
        isConnected,
        address,
        quantity,
      });
    } catch {}

    if (!canPurchase) return;
    if (!consentReady) {
      setCheckoutIntent('crypto');
      return;
    }

    if (!isConnected) {
      try {
        sessionStorage.setItem('wallet_connect_intent', 'transaction');
      } catch {}
      openConnectModal?.();
      return;
    }

    // Reset any stale state from prior attempts.
    cryptoDirect.resetPhase();
    setCheckoutError(null);
    setModalOpen(true);

    try {
      const ok = await requireAuth();
      if (!ok) {
        setModalOpen(false);
        return;
      }
      const { hash, explorerUrl, expiresAt } = await cryptoDirect.mutateAsync({
        quantity,
        confirmations: 1,
        consent: consentPayload,
      });
      setCryptoReservationExpiresAt(expiresAt || null);
      if (explorerUrl) {
        try {
          window.dispatchEvent(
            new CustomEvent('tx:submitted', { detail: { hash, explorerUrl } }),
          );
        } catch {}
      }
    } catch (err) {
      // Hook already sets phase: 'failed' + errorMessage. Modal will render it.
      try {
        console.error('[CryptoPay] error', err);
      } catch {}
    }
  };

  const handleRetry = async () => {
    const pendingCtx = readCryptoCheckoutContext();
    if (pendingCtx?.passId === pass.id && pendingCtx.purchaseId && pendingCtx.txHash) {
      setModalOpen(true);
      const resumed = await retryPendingConfirmation();
      if (!resumed) {
        return;
      }
      return;
    }

    await handleCryptoClick();
  };

  const checkoutFinePrint = (
    <p className="text-xs text-[#a1a4a5] leading-relaxed">
      Card checkout unlocks access instantly. Claim the NFT to your wallet any time.
      <span className="inline-flex items-center gap-1 ml-1 text-[#5c5c5c]">
        <Clock3 className="w-3 h-3" />
        Crypto quotes hold inventory for ~5 minutes.
        {cryptoReservationExpiresAt ? (
          <span>
            {' '}
            Current hold ends{' '}
            {new Date(cryptoReservationExpiresAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
            .
          </span>
        ) : null}
      </span>
    </p>
  );

  return (
    <>
      <div className="flex flex-col gap-5">
        {/* Price — always visible, dimmed when blocked */}
        <div className="flex items-baseline gap-3">
          <div
            className={`text-5xl font-medium ${canPurchase ? 'text-[#f0f0f0]' : 'text-[#5c5c5c]'}`}
            style={{ letterSpacing: '-0.03em', lineHeight: 1 }}
          >
            {pass.formatted_price}
          </div>
          {alreadyOwns ? (
            <span
              className="text-[#a1a4a5] text-xs uppercase"
              style={{ letterSpacing: '0.12em' }}
            >
              Owned
            </span>
          ) : null}
        </div>

        {alreadyOwns ? (
          <button
            onClick={() => navigate(`/watch/${pass.id}`)}
            className={PRIMARY_PILL}
          >
            <PlayCircle className="w-4 h-4" />
            Start watching
          </button>
        ) : null}

        {canPurchase ? (
          checkoutIntent ? (
            <>
              <QuantityStepper
                quantity={quantity}
                max={maxQty}
                remaining={remaining}
                disabled={cryptoInFlight}
                onChange={setQuantity}
                totalLabel={
                  quantity > 1 && pass.price_cents != null
                    ? formatCheckoutTotal(pass.price_cents, quantity, pass.currency)
                    : null
                }
              />
              <PassConsentBoxes
                consent={pass.sale_consent}
                acceptedTerms={acceptedTerms}
                acceptedWithdrawal={acceptedWithdrawal}
                onAcceptedTerms={setAcceptedTerms}
                onAcceptedWithdrawal={setAcceptedWithdrawal}
                disabled={cryptoInFlight}
                autoFocus
              />

              {checkoutIntent === 'card' ? (
                <UnlockButton
                  passId={pass.id}
                  className={PRIMARY_PILL}
                  consent={consentPayload}
                  consentReady={consentReady}
                  quantity={quantity}
                  label="Continue to card"
                  onError={(err) => {
                    const parsed = getPassErrorMessage(err);
                    setCheckoutError(parsed.message);
                  }}
                />
              ) : (
                <button
                  disabled={cryptoInFlight || !consentReady}
                  onClick={handleCryptoClick}
                  className={PRIMARY_PILL}
                >
                  <Wallet className="w-4 h-4" />
                  {cryptoInFlight || cryptoDirect.phase === 'failed'
                    ? cryptoButtonLabel(cryptoDirect.phase, isConnected)
                    : isConnected
                      ? 'Continue with wallet'
                      : 'Connect wallet to continue'}
                </button>
              )}

              {checkoutError && (
                <p className="text-xs text-red-300 leading-relaxed -mt-2">
                  {checkoutError}
                </p>
              )}

              {!cryptoInFlight ? (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => chooseMethod(checkoutIntent === 'card' ? 'crypto' : 'card')}
                    className="text-xs text-[#a1a4a5] hover:text-[#f0f0f0] text-left"
                  >
                    {checkoutIntent === 'card' ? 'Pay with crypto instead' : 'Pay with card instead'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutIntent(null);
                      setCheckoutError(null);
                    }}
                    className="text-xs text-[#5c5c5c] hover:text-[#a1a4a5] text-left"
                  >
                    Back
                  </button>
                </div>
              ) : null}

              {checkoutFinePrint}
            </>
          ) : (
            <>
              <QuantityStepper
                quantity={quantity}
                max={maxQty}
                remaining={remaining}
                disabled={cryptoInFlight}
                onChange={setQuantity}
                totalLabel={
                  quantity > 1 && pass.price_cents != null
                    ? formatCheckoutTotal(pass.price_cents, quantity, pass.currency)
                    : null
                }
              />
              <button
                type="button"
                onClick={() => chooseMethod('card')}
                className={alreadyOwns ? SECONDARY_PILL : PRIMARY_PILL}
              >
                {alreadyOwns ? 'Buy more with card' : 'Buy with Card'}
              </button>
              <button
                type="button"
                onClick={() => chooseMethod('crypto')}
                className={SECONDARY_PILL}
              >
                <Wallet className="w-4 h-4" />
                {alreadyOwns ? 'Buy more with crypto' : 'Buy with crypto'}
              </button>
              {checkoutFinePrint}
            </>
          )
        ) : alreadyOwns ? null : (
          <p className="text-sm text-[#a1a4a5] leading-relaxed">
            {blockMessage}
          </p>
        )}
      </div>

      <CryptoPurchaseModal
        open={modalOpen}
        phase={cryptoDirect.phase}
        errorMessage={cryptoDirect.errorMessage}
        txHash={cryptoDirect.lastTxHash}
        explorerUrl={cryptoDirect.lastExplorerUrl}
        hardConflict={cryptoDirect.hardConflict}
        onClose={() => setModalOpen(false)}
        onRetry={handleRetry}
        watchRoute={`/watch/${pass.id}`}
      />
    </>
  );
};

export default PassActionButton;
