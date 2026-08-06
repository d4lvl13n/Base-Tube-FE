// src/components/pages/CTREngine/components/BuyCreditsModal.tsx
// Buy Credits — fetches the pack catalog and starts a Stripe Checkout session.

import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins, Check, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { creditsApi } from '../../../../api/credits';
import { CreditPack } from '../../../../types/ctr';

interface BuyCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Format money purely from priceCents + currency — never hardcode prices.
const formatMoney = (priceCents: number, currency: string): string => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: (currency || 'usd').toUpperCase(),
    }).format(priceCents / 100);
  } catch {
    // Fallback if the currency code is not recognised by Intl.
    return `${(priceCents / 100).toFixed(2)} ${(currency || '').toUpperCase()}`;
  }
};

// Best value = most credits per unit of currency.
const bestValuePackId = (packs: CreditPack[]): string | null => {
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

export const BuyCreditsModal: React.FC<BuyCreditsModalProps> = ({ isOpen, onClose }) => {
  const [packs, setPacks] = useState<CreditPack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutPackId, setCheckoutPackId] = useState<string | null>(null);

  const loadPacks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await creditsApi.getPacks();
      setPacks(result);
    } catch (err) {
      setError('Could not load credit packs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCheckoutPackId(null);
      loadPacks();
    }
  }, [isOpen, loadPacks]);

  const handleSelect = useCallback(
    async (pack: CreditPack) => {
      setError(null);
      setCheckoutPackId(pack.id);
      try {
        const session = await creditsApi.createCheckout(pack.id);
        if (session?.url) {
          // Hand off to Stripe Checkout.
          window.location.href = session.url;
        } else {
          setError('Checkout is temporarily unavailable. Please try again.');
          setCheckoutPackId(null);
        }
      } catch (err) {
        setError('Could not start checkout. Please try again.');
        setCheckoutPackId(null);
      }
    },
    []
  );

  const bestId = bestValuePackId(packs);
  const isCheckingOut = checkoutPackId !== null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]"
            onClick={isCheckingOut ? undefined : onClose}
          />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto w-full max-w-lg bg-[#0b0b0b] border border-gray-800/60 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#fa7517]/20 to-orange-500/10 flex items-center justify-center border border-[#fa7517]/20">
                    <Coins className="w-5 h-5 text-[#fa7517]" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-white">Buy credits</h2>
                    <p className="text-xs text-gray-500">Top up your balance to keep creating.</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  disabled={isCheckingOut}
                  className="text-gray-400 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-lg disabled:opacity-40"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-5">
                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-red-400">{error}</p>
                      <button
                        onClick={loadPacks}
                        className="mt-1 text-xs font-medium text-[#fa7517] hover:text-orange-400 transition-colors"
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                )}

                {isLoading ? (
                  <div className="flex items-center justify-center py-12 text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin text-[#fa7517]" />
                  </div>
                ) : packs.length === 0 && !error ? (
                  <div className="py-12 text-center text-sm text-gray-500">
                    No credit packs are available right now.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {packs.map((pack) => {
                      const isBest = pack.id === bestId && packs.length > 1;
                      const isThisCheckingOut = checkoutPackId === pack.id;
                      return (
                        <button
                          key={pack.id}
                          onClick={() => handleSelect(pack)}
                          disabled={isCheckingOut}
                          className={`w-full flex items-center justify-between gap-4 px-4 py-4 rounded-xl border text-left transition-all disabled:cursor-not-allowed
                            ${
                              isBest
                                ? 'border-[#fa7517]/50 bg-[#fa7517]/10 hover:bg-[#fa7517]/15'
                                : 'border-gray-800/60 bg-black/40 hover:border-gray-700 hover:bg-black/60'
                            }
                            ${isCheckingOut && !isThisCheckingOut ? 'opacity-40' : ''}`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-white truncate">
                                  {pack.label}
                                </span>
                                {isBest && (
                                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-[#fa7517] bg-[#fa7517]/20 border border-[#fa7517]/30">
                                    <Sparkles className="w-2.5 h-2.5" />
                                    Best value
                                  </span>
                                )}
                              </div>
                              <span className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                                <Coins className="w-3 h-3 text-[#fa7517]" />
                                {pack.credits.toLocaleString()} credits
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-base font-semibold text-white">
                              {formatMoney(pack.priceCents, pack.currency)}
                            </span>
                            {isThisCheckingOut ? (
                              <Loader2 className="w-4 h-4 animate-spin text-[#fa7517]" />
                            ) : (
                              <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                                  isBest ? 'border-[#fa7517]/50 text-[#fa7517]' : 'border-gray-700 text-gray-600'
                                }`}
                              >
                                <Check className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                <p className="mt-5 text-center text-[11px] text-gray-600">
                  Secure checkout by Stripe. You'll return here after paying.
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BuyCreditsModal;
