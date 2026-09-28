// src/components/pages/CTREngine/components/BuyCreditsModal.tsx
// Buy Credits — the pack catalog, what each pack buys at today's prices, and one
// primary action that opens Stripe Checkout. Rendered in a portal on
// document.body so no page card, helper or transformed parent can cover or clip it.

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins, Loader2, AlertCircle, Lock } from 'lucide-react';
import { creditsApi } from '../../../../api/credits';
import type { CreditPack, CreditPricingCatalog } from '../../../../types/ctr';
import { rememberCreditsReturn } from '../../../../utils/studioDraft';
import { useStudioPricing } from '../../../../hooks/useStudioCapabilities';
import { useStudioBalance } from '../../../../hooks/useStudioBalance';
import { useStudioAccount } from '../../../../hooks/useStudioAccount';
import { plainApiError, type PlainApiError } from '../../../../utils/plainApiError';
import { TechnicalErrorDetail } from '../../../common/TechnicalErrorDetail';

interface BuyCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Money comes from priceCents + currency only — never a hardcoded price.
export const formatMoney = (priceCents: number, currency: string, maximumFractionDigits = 2): string => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: (currency || 'usd').toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits,
    }).format(priceCents / 100);
  } catch {
    // The currency code is not one Intl knows.
    return `${(priceCents / 100).toFixed(2)} ${(currency || '').toUpperCase()}`;
  }
};

// Best value = most credits per unit of currency.
export const bestValuePackId = (packs: CreditPack[]): string | null => {
  if (packs.length === 0) return null;
  let bestId = packs[0].id;
  let bestRatio = -Infinity;
  for (const pack of packs) {
    const ratio = pack.priceCents > 0 ? pack.credits / pack.priceCents : Infinity;
    if (ratio > bestRatio) {
      bestRatio = ratio;
      bestId = pack.id;
    }
  }
  return bestId;
};

/**
 * What a pack buys at today's prices, each figure on its own:
 * "≈ 13 concepts · 11 edits · 100 audits". Null while prices are unknown.
 */
export function packYield(credits: number, pricing: CreditPricingCatalog | null): string | null {
  if (!pricing) return null;
  const parts = ([
    [pricing.ctr.generatePerConcept, 'concept'],
    [pricing.thumbnail.editPerImage, 'edit'],
    [pricing.ctr.audit, 'audit'],
  ] as const)
    .filter(([price]) => price > 0)
    .map(([price, noun]) => {
      const count = Math.floor(credits / price);
      return `${count.toLocaleString()} ${noun}${count === 1 ? '' : 's'}`;
    });
  return parts.length ? `≈ ${parts.join(' · ')}` : null;
}

const CHECKOUT_UNAVAILABLE: PlainApiError = {
  message: 'Checkout is not available right now. Please try again in a moment.',
  technical: 'no checkout URL in the response',
  status: null,
  code: null,
};

function BuyCreditsDialog({ onClose }: { onClose: () => void }) {
  const titleId = useId();
  const pricing = useStudioPricing();
  const account = useStudioAccount();
  const { usageAccess } = useStudioBalance(account, account !== 'anonymous');
  const available = usageAccess?.mode === 'credits' ? usageAccess.creditInfo.available : null;

  const [packs, setPacks] = useState<CreditPack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<PlainApiError | null>(null);
  const [checkoutError, setCheckoutError] = useState<PlainApiError | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const checkingOut = useRef(false);
  const mounted = useRef(true);
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const loadPacks = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await creditsApi.getPacks();
      if (!mounted.current) return;
      setPacks(result);
      // The best value pack starts selected, so the usual purchase is one click.
      setSelectedId((current) => (current && result.some((pack) => pack.id === current) ? current : bestValuePackId(result)));
    } catch (err) {
      if (mounted.current) setLoadError(plainApiError(err, 'Credit packs did not load. Please try again.'));
    } finally {
      if (mounted.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPacks();
  }, [loadPacks]);

  const close = useCallback(() => {
    if (!checkingOut.current) onClose();
  }, [onClose]);

  useEffect(() => {
    // Keyboard and screen reader users start inside the window.
    dialogRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [close]);

  const selected = packs.find((pack) => pack.id === selectedId) || null;
  const bestId = packs.length > 1 ? bestValuePackId(packs) : null;

  const checkout = async () => {
    if (!selected || checkingOut.current) return;
    checkingOut.current = true;
    setIsCheckingOut(true);
    setCheckoutError(null);
    try {
      const session = await creditsApi.createCheckout(selected.id);
      if (session?.url) {
        // Stripe Checkout; the success page brings the creator back to this screen.
        rememberCreditsReturn(window.location.pathname + window.location.search);
        window.location.href = session.url;
        return;
      }
      if (mounted.current) setCheckoutError(CHECKOUT_UNAVAILABLE);
    } catch (err) {
      if (mounted.current) setCheckoutError(plainApiError(err, 'Checkout did not open. Please try again.'));
    }
    checkingOut.current = false;
    if (mounted.current) setIsCheckingOut(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm"
        onClick={close}
        aria-hidden="true"
      />
      <div className="pointer-events-none fixed inset-0 z-[101] flex items-center justify-center p-4">
        <motion.div
          ref={dialogRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          initial={{ opacity: 0, scale: 0.97, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 8 }}
          transition={{ duration: 0.18 }}
          className="pointer-events-auto flex max-h-[calc(100vh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0e0e10] shadow-2xl shadow-black/60 outline-none"
        >
          <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-5 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#fa7517]/25 bg-[#fa7517]/10">
                <Coins className="h-4 w-4 text-[#fa7517]" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 id={titleId} className="text-base font-semibold text-white">
                  Buy credits
                </h2>
                <p className="text-xs text-zinc-400">
                  {available !== null
                    ? `You have ${available.toLocaleString()} credits · one-time purchase`
                    : 'One-time purchase, no subscription'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={close}
              disabled={isCheckingOut}
              className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {isLoading ? (
              <div role="status" aria-label="Loading credit packs" className="space-y-2">
                {[0, 1, 2].map((row) => (
                  <div key={row} className="h-[76px] animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.03]" />
                ))}
              </div>
            ) : loadError ? (
              <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />
                <div className="flex-1 text-sm text-red-200">
                  {loadError.message}
                  <TechnicalErrorDetail detail={loadError.technical} />
                  <button
                    type="button"
                    onClick={() => void loadPacks()}
                    className="mt-1 block text-xs font-medium text-[#fa7517] hover:text-orange-400"
                  >
                    Try again
                  </button>
                </div>
              </div>
            ) : packs.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-400">No credit packs are available right now.</p>
            ) : (
              <div role="radiogroup" aria-label="Credit packs" className="space-y-2">
                {packs.map((pack) => {
                  const isSelected = pack.id === selectedId;
                  const yieldText = packYield(pack.credits, pricing);
                  return (
                    <button
                      key={pack.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      disabled={isCheckingOut}
                      onClick={() => setSelectedId(pack.id)}
                      className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed ${
                        isSelected
                          ? 'border-[#fa7517] bg-[#fa7517]/[0.08] ring-1 ring-[#fa7517]/40'
                          : 'border-white/10 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.04]'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                          isSelected ? 'border-[#fa7517]' : 'border-zinc-600'
                        }`}
                      >
                        {isSelected && <span className="h-2 w-2 rounded-full bg-[#fa7517]" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-sm font-semibold text-white">{pack.label}</span>
                          {pack.id === bestId && (
                            <span className="rounded-full bg-[#fa7517]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#fb923c]">
                              Best value
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block text-xs text-zinc-300">{pack.credits.toLocaleString()} credits</span>
                        {yieldText && <span className="mt-0.5 block text-xs text-zinc-500">{yieldText}</span>}
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-base font-semibold text-white">
                          {formatMoney(pack.priceCents, pack.currency)}
                        </span>
                        {pack.credits > 0 && (
                          <span className="block text-[11px] text-zinc-500">
                            {formatMoney(pack.priceCents / pack.credits, pack.currency, 3)} / credit
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-white/[0.08] px-5 py-4">
            {checkoutError && (
              <p role="alert" className="mb-3 text-sm text-red-300">
                {checkoutError.message}
                <TechnicalErrorDetail detail={checkoutError.technical} />
              </p>
            )}
            <button
              type="button"
              onClick={() => void checkout()}
              disabled={!selected || isCheckingOut || isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#fa7517] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#fa7517]/20 transition-colors hover:bg-[#fb8a3c] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isCheckingOut ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Opening secure checkout…
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" aria-hidden="true" />
                  {selected
                    ? `Continue to secure checkout · ${formatMoney(selected.priceCents, selected.currency)}`
                    : 'Continue to secure checkout'}
                </>
              )}
            </button>
            <p className="mt-2.5 text-center text-[11px] text-zinc-500">Secure payment by Stripe. You'll come back to this page.</p>
          </div>
        </motion.div>
      </div>
    </>
  );
}

export const BuyCreditsModal: React.FC<BuyCreditsModalProps> = ({ isOpen, onClose }) => {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <AnimatePresence>{isOpen && <BuyCreditsDialog key="buy-credits" onClose={onClose} />}</AnimatePresence>,
    document.body,
  );
};

export default BuyCreditsModal;
