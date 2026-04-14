import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useUser } from '@clerk/clerk-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock3,
  ExternalLink,
  Gift,
  Loader2,
  RefreshCw,
  Wallet,
  X,
} from 'lucide-react';
import { useCheckoutStatus, usePassDetails } from '../hooks/usePass';
import { useClaim, usePurchaseStatus } from '../hooks/useOnchainPass';
import { clearCheckoutContext, readCheckoutContext } from '../utils/checkoutStorage';
import {
  canClaimPurchase,
  getExplorerTxUrl,
  getPurchaseDisplayCopy,
  hasPurchaseEntitlement,
  isNegativePurchaseStatus,
} from '../utils/purchaseStatus';
import { useLinkWallet } from '../hooks/useLinkWallet';

const DEFAULT_CHAIN_ID = 8453;

const CheckoutSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');
  const storedCheckout = useMemo(() => {
    const checkout = readCheckoutContext();
    if (!checkout) return null;
    if (sessionId && checkout.session_id !== sessionId) return null;
    return checkout;
  }, [sessionId]);
  const purchaseIdFromQuery = searchParams.get('purchase_id');
  const [purchaseId, setPurchaseId] = useState<string | null>(purchaseIdFromQuery || storedCheckout?.purchase_id || null);
  const [statusOverride, setStatusOverride] = useState<string | null>(null);

  const { isConnected, address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { isSignedIn } = useUser();
  const { linkWallet, isLinking, modalState: linkModalState, clearModal: clearLinkModal } = useLinkWallet();
  const claim = useClaim();

  const hasAttemptedLinkRef = useRef(false);

  const {
    data: checkoutResolver,
    error: checkoutError,
    isLoading: isCheckoutResolving,
    isError: isCheckoutError,
  } = useCheckoutStatus(sessionId, {
    enabled: Boolean(sessionId) && !purchaseId,
  });

  const {
    data: purchaseStatusResponse,
    isLoading: isPurchaseLoading,
  } = usePurchaseStatus(purchaseId, {
    enabled: Boolean(purchaseId),
    intervalMs: 3000,
  });

  const resolvedPurchaseId = checkoutResolver?.purchase_id || null;

  useEffect(() => {
    if (!sessionId && !purchaseIdFromQuery && !storedCheckout?.purchase_id) {
      navigate('/');
    }
  }, [navigate, purchaseIdFromQuery, sessionId, storedCheckout?.purchase_id]);

  useEffect(() => {
    if (resolvedPurchaseId && resolvedPurchaseId !== purchaseId) {
      setPurchaseId(resolvedPurchaseId);
    }
  }, [purchaseId, resolvedPurchaseId]);

  const purchase = purchaseStatusResponse?.data;
  const effectiveStatus = statusOverride || purchase?.status || checkoutResolver?.status || 'reserved';
  const display = getPurchaseDisplayCopy(effectiveStatus);
  const passId = purchase?.passId || checkoutResolver?.pass_id || storedCheckout?.passId || null;
  const { data: passDetails } = usePassDetails(passId ?? undefined, { enabled: Boolean(passId) });

  useEffect(() => {
    if (['claimed', 'minted', 'completed', 'failed', 'expired', 'refunded', 'disputed'].includes(effectiveStatus)) {
      clearCheckoutContext();
    }
  }, [effectiveStatus]);

  useEffect(() => {
    const authMethod = localStorage.getItem('auth_method');
    const isClerkUser = authMethod === 'clerk' || isSignedIn;

    if (isConnected && address && isClerkUser && !hasAttemptedLinkRef.current) {
      hasAttemptedLinkRef.current = true;
      linkWallet().catch(() => {
        hasAttemptedLinkRef.current = false;
      });
    }
  }, [address, isConnected, isSignedIn, linkWallet]);

  useEffect(() => {
    if (!isConnected) {
      hasAttemptedLinkRef.current = false;
    }
  }, [isConnected]);

  const txHash = purchase?.claimTxHash || purchase?.mintTxHash || purchase?.txHash || null;
  const txUrl = getExplorerTxUrl(txHash, DEFAULT_CHAIN_ID);
  const hasEntitlement = hasPurchaseEntitlement(effectiveStatus);
  const showClaimButton = canClaimPurchase(effectiveStatus, purchase?.paymentType);
  const isExpired = effectiveStatus === 'expired';
  const hasFatalError = isCheckoutError || isNegativePurchaseStatus(effectiveStatus);
  const isStillResolving = !purchaseId && isCheckoutResolving;
  const isClaiming = claim.isPending || statusOverride === 'minting' || effectiveStatus === 'minting';

  const handleClaim = async () => {
    if (!purchaseId) return;

    if (!isConnected || !address) {
      sessionStorage.setItem('wallet_connect_intent', 'link');
      openConnectModal?.();
      return;
    }

    try {
      setStatusOverride('minting');
      await claim.mutateAsync({ purchaseId, walletAddress: address });
      setStatusOverride(null);
    } catch {
      setStatusOverride(null);
    }
  };

  if (!sessionId && !purchaseId) return null;

  if (isStillResolving) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="space-y-6 text-center max-w-lg p-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            className="mx-auto w-12 h-12 text-orange-500"
          >
            <RefreshCw className="w-12 h-12" />
          </motion.div>
          <h1 className="text-3xl font-bold">Confirming your payment…</h1>
          <p className="text-gray-300">
            We are checking your reservation and waiting for the payment result.
          </p>
        </div>
      </div>
    );
  }

  if (hasFatalError || isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white px-4">
        <div className="space-y-6 text-center max-w-lg p-8 bg-red-900/20 rounded-xl border border-red-500/20">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
          <h1 className="text-3xl font-bold">{isExpired ? 'Checkout expired' : 'Purchase issue'}</h1>
          <p className="text-gray-300">
            {isExpired
              ? 'This reservation expired before payment completed. Start a new checkout to continue.'
              : checkoutError?.message || purchase?.lastStatusReason || display.helper}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
            <Link
              to={passId ? `/p/${passDetails?.slug || passId}` : '/discover'}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#fa7517] hover:bg-[#fa8527] text-black rounded-lg transition-colors font-semibold"
            >
              Restart checkout
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Return home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <Link to="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Return home</span>
          </Link>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">{display.label}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#111] via-[#0d0d14] to-black p-6 sm:p-8 shadow-2xl shadow-orange-500/10"
        >
          <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
            <div className="space-y-6">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-orange-300/80 mb-3">Content Pass</p>
                <h1 className="text-3xl sm:text-4xl font-bold mb-3">
                  {passDetails?.title || 'Purchase confirmed'}
                </h1>
                <p className="text-white/70 text-base sm:text-lg">{display.helper}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-wider text-white/45 mb-1">Payment</div>
                  <div className="text-lg font-semibold">{passDetails?.formatted_price || `${((purchase?.priceCents || 0) / 100).toFixed(2)} ${purchase?.currency || ''}`}</div>
                  <div className="text-sm text-white/55 mt-1">{purchase?.paymentType === 'crypto' ? 'Crypto purchase' : 'Card checkout'}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-wider text-white/45 mb-1">Status</div>
                  <div className="text-lg font-semibold">{display.label}</div>
                  <div className="text-sm text-white/55 mt-1">
                    {purchaseId ? `Purchase ID ${purchaseId.slice(0, 8)}…` : 'Waiting for purchase record'}
                  </div>
                </div>
              </div>

              {purchase?.reservationExpiresAt && effectiveStatus === 'reserved' && (
                <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4 flex items-start gap-3">
                  <Clock3 className="w-5 h-5 text-orange-300 mt-0.5" />
                  <div>
                    <div className="font-medium text-orange-100">Reservation active</div>
                    <p className="text-sm text-orange-100/75">
                      This checkout is reserved until {new Date(purchase.reservationExpiresAt).toLocaleString()}.
                    </p>
                  </div>
                </div>
              )}

              {hasEntitlement && (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                  <div className="font-medium text-emerald-200">Paid, access unlocked</div>
                  <p className="text-sm text-emerald-100/75 mt-1">
                    You can start watching immediately from your pass page.
                  </p>
                </div>
              )}

              {txUrl && (
                <a
                  href={txUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-orange-300 hover:text-orange-200 text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  View transaction on Basescan
                </a>
              )}
            </div>

            <div className="space-y-4">
              {showClaimButton && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <Gift className="w-5 h-5 text-orange-300" />
                    <h2 className="text-lg font-semibold">Claim NFT</h2>
                  </div>
                  <p className="text-sm text-white/65 mb-4">
                    Your payment is complete and access is unlocked. The NFT is not minted yet.
                  </p>
                  {isConnected ? (
                    <button
                      onClick={handleClaim}
                      disabled={isClaiming || isLinking}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-[#fa7517] to-orange-500 text-black font-semibold disabled:opacity-60"
                    >
                      {isClaiming || isPurchaseLoading ? 'Minting to your wallet…' : 'Claim NFT'}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        sessionStorage.setItem('wallet_connect_intent', 'link');
                        openConnectModal?.();
                      }}
                      className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 font-semibold flex items-center justify-center gap-2"
                    >
                      <Wallet className="w-4 h-4" />
                      Connect wallet to claim
                    </button>
                  )}
                </div>
              )}

              {effectiveStatus === 'minting' && (
                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <Loader2 className="w-5 h-5 text-blue-300 animate-spin" />
                    <h2 className="text-lg font-semibold">Minting to your wallet</h2>
                  </div>
                  <p className="text-sm text-white/65">
                    Your claim is in progress. You still have access while the NFT is being minted.
                  </p>
                </div>
              )}

              {['claimed', 'minted', 'completed'].includes(effectiveStatus) && (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle className="w-5 h-5 text-emerald-300" />
                    <h2 className="text-lg font-semibold">NFT in your wallet</h2>
                  </div>
                  <p className="text-sm text-white/65">
                    {purchase?.ownerAddress
                      ? `Minted to ${purchase.ownerAddress}.`
                      : 'Your content pass NFT is already in your wallet.'}
                  </p>
                </div>
              )}

              <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                <div className="text-sm font-semibold mb-3">Next steps</div>
                <ul className="space-y-2 text-sm text-white/65">
                  <li>Watch your premium content immediately once access is unlocked.</li>
                  <li>Use Claim NFT for paid Stripe purchases that are still pending.</li>
                  <li>Come back later if you want to mint after payment.</li>
                </ul>
              </div>

              <div className="flex flex-col gap-3">
                <Link
                  to={passId ? `/watch/${passId}` : '/my-passes'}
                  className="w-full py-3 rounded-xl bg-white text-black font-semibold text-center hover:bg-white/90 transition-colors"
                >
                  {hasEntitlement ? 'Open unlocked content' : 'Go to my passes'}
                </Link>
                <Link
                  to="/my-passes"
                  className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 font-semibold text-center transition-colors"
                >
                  View all passes
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {linkModalState.type && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={clearLinkModal}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-md w-full"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Wallet Link</h3>
                <button
                  onClick={clearLinkModal}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div
                className={`p-4 rounded-xl ${
                  linkModalState.type === 'success'
                    ? 'bg-green-500/10 border border-green-500/30'
                    : 'bg-red-500/10 border border-red-500/30'
                }`}
              >
                <div
                  className={`flex items-center gap-2 mb-2 ${
                    linkModalState.type === 'success' ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {linkModalState.type === 'success' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5" />
                  )}
                  <span className="font-medium">{linkModalState.message}</span>
                </div>
                {linkModalState.details && (
                  <p
                    className={`text-sm ${
                      linkModalState.type === 'success' ? 'text-green-300/80' : 'text-red-300/80'
                    }`}
                  >
                    {linkModalState.details}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CheckoutSuccessPage;
