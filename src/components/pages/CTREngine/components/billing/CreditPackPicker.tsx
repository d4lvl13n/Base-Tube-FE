// The one-time credit packs (top-ups): what each buys at today's prices and one
// checkout button with the price. Used in the Buy credits window and on the
// pricing page.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Loader2, Lock } from 'lucide-react';
import { creditsApi } from '../../../../../api/credits';
import type { CreditPack, CreditPricingCatalog } from '../../../../../types/ctr';
import { formatMoney } from '../../../../../utils/money';
import { plainApiError, type PlainApiError } from '../../../../../utils/plainApiError';
import { startStudioAuth, STUDIO_SIGN_UP_PATH } from '../../../../../utils/studioAuth';
import { TechnicalErrorDetail } from '../../../../common/TechnicalErrorDetail';
import { goToPackCheckout, type CheckoutContext } from './billingActions';

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

export function CreditPackPicker({
  pricing,
  context,
  signedIn = true,
  signUpReturnPath,
  disabled = false,
  onBusyChange,
}: {
  pricing: CreditPricingCatalog | null;
  /** Where Stripe brings the creator back, and the action waiting there. */
  context: CheckoutContext;
  /** A visitor's checkout button opens the AI Thumbnails sign-up page instead. */
  signedIn?: boolean;
  /** The page a visitor returns to after signing up. */
  signUpReturnPath?: string;
  /** Another checkout is opening. */
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [packs, setPacks] = useState<CreditPack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<PlainApiError | null>(null);
  const [checkoutError, setCheckoutError] = useState<PlainApiError | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const checkingOut = useRef(false);
  const mounted = useRef(true);
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

  const selected = packs.find((pack) => pack.id === selectedId) || null;
  const bestId = packs.length > 1 ? bestValuePackId(packs) : null;
  const locked = isCheckingOut || disabled;

  const checkout = async () => {
    if (!selected || checkingOut.current || disabled) return;
    checkingOut.current = true;
    setIsCheckingOut(true);
    onBusyChange?.(true);
    setCheckoutError(null);
    try {
      // Stripe Checkout; the success page brings the creator back to this screen.
      if (await goToPackCheckout(selected.id, context)) return;
      if (mounted.current) setCheckoutError(CHECKOUT_UNAVAILABLE);
    } catch (err) {
      if (mounted.current) setCheckoutError(plainApiError(err, 'Checkout did not open. Please try again.'));
    }
    checkingOut.current = false;
    onBusyChange?.(false);
    if (mounted.current) setIsCheckingOut(false);
  };

  const buttonLabel = selected
    ? `Continue to secure checkout · ${formatMoney(selected.priceCents, selected.currency)}`
    : 'Continue to secure checkout';
  const buttonClass =
    'flex w-full items-center justify-center gap-2 rounded-xl bg-[#fa7517] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#fa7517]/20 transition-colors hover:bg-[#fb8a3c] disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <div className="space-y-3">
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
        <p className="py-6 text-center text-sm text-zinc-400">No credit packs are available right now.</p>
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
                disabled={locked}
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
                  <span className="block text-base font-semibold text-white">{formatMoney(pack.priceCents, pack.currency)}</span>
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

      {checkoutError && (
        <p role="alert" className="text-sm text-red-300">
          {checkoutError.message}
          <TechnicalErrorDetail detail={checkoutError.technical} />
        </p>
      )}
      {signedIn ? (
        <button type="button" onClick={() => void checkout()} disabled={!selected || locked || isLoading} className={buttonClass}>
          {isCheckingOut ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Opening secure checkout…
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" aria-hidden="true" />
              {buttonLabel}
            </>
          )}
        </button>
      ) : (
        // A visitor creates a free account first (the AI Thumbnails page, never a modal), then comes back.
        <Link
          to={STUDIO_SIGN_UP_PATH}
          onClick={() => startStudioAuth('sign-up', signUpReturnPath || '/ai-thumbnails/pricing')}
          className={buttonClass}
        >
          <Lock className="h-4 w-4" aria-hidden="true" />
          {buttonLabel}
        </Link>
      )}
    </div>
  );
}

export default CreditPackPicker;
