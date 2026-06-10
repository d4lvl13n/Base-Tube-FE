import React, { useEffect, useState } from 'react';
import { PlayCircle, Wallet, Clock3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UnlockButton from './UnlockButton';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useCryptoDirectBuy } from '../../hooks/useOnchainPass';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import CryptoPurchaseModal from './CryptoPurchaseModal';
import type { CryptoPurchasePhase } from '../../types/onchainPass';
import { readCryptoCheckoutContext } from '../../utils/checkoutStorage';
import { getPassErrorMessage } from '../../utils/passErrorMessages';

interface PassActionButtonProps {
  pass: {
    id: string;
    onchain_pass_id?: number | null;
    tier: string;
    formatted_price: string;
    supply_cap?: number;
    minted_count?: number;
    sold_count?: number;
    can_purchase?: boolean;
    purchase_block_reason_code?: string | null;
    purchase_block_reason?: string | null;
  };
  alreadyOwns: boolean;
  isAccessLoading: boolean;
}

const BLOCK_REASON_FALLBACKS: Record<string, string> = {
  PASS_NOT_ONCHAIN: 'Crypto unavailable for this pass yet.',
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

const FROST_BORDER = 'border-[rgba(214,235,253,0.19)]';

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
  const [quantity] = useState(1);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const canPurchase = pass.can_purchase !== false;
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

  if (isAccessLoading) {
    return <div className="h-12 w-full bg-white/[0.04] rounded-full animate-pulse" />;
  }

  if (alreadyOwns) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-baseline gap-3">
          <span
            className="text-[#f0f0f0] text-4xl font-medium"
            style={{ letterSpacing: '-0.03em' }}
          >
            {pass.formatted_price}
          </span>
          <span
            className="text-[#a1a4a5] text-xs uppercase"
            style={{ letterSpacing: '0.12em' }}
          >
            Owned
          </span>
        </div>

        <button
          onClick={() => navigate(`/watch/${pass.id}`)}
          className={PRIMARY_PILL}
        >
          <PlayCircle className="w-4 h-4" />
          Start watching
        </button>
      </div>
    );
  }

  const handleCryptoClick = async () => {
    try {
      console.log('[CryptoPay] click', {
        passId: pass.id,
        isConnected,
        address,
        quantity,
        useRelayer: process.env.REACT_APP_CRYPTO_USE_RELAYER,
      });
    } catch {}

    if (!canPurchase) return;

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

  const cryptoInFlight =
    cryptoDirect.isPending ||
    cryptoDirect.phase === 'reserving' ||
    cryptoDirect.phase === 'awaiting-signature' ||
    cryptoDirect.phase === 'tx-pending' ||
    cryptoDirect.phase === 'confirming' ||
    cryptoDirect.phase === 'polling';

  return (
    <>
      <div className="flex flex-col gap-5">
        {/* Price — always visible, dimmed when blocked */}
        <div
          className={`text-5xl font-medium ${canPurchase ? 'text-[#f0f0f0]' : 'text-[#5c5c5c]'}`}
          style={{ letterSpacing: '-0.03em', lineHeight: 1 }}
        >
          {pass.formatted_price}
        </div>

        {canPurchase ? (
          <>
            {/* Card CTA — white pill, primary */}
            <UnlockButton
              passId={pass.id}
              className={PRIMARY_PILL}
              onError={(err) => {
                const parsed = getPassErrorMessage(err);
                setCheckoutError(parsed.message);
              }}
            />

            {/* Checkout error — inline below the card button */}
            {checkoutError && (
              <p className="text-xs text-red-300 leading-relaxed -mt-2">
                {checkoutError}
              </p>
            )}

            {/* Crypto CTA — frost-bordered pill, secondary */}
            <button
              disabled={cryptoInFlight}
              onClick={handleCryptoClick}
              className={SECONDARY_PILL}
            >
              <Wallet className="w-4 h-4" />
              {cryptoButtonLabel(cryptoDirect.phase, isConnected)}
            </button>

            {/* Fine print */}
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
          </>
        ) : (
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
