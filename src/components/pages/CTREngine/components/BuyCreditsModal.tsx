// src/components/pages/CTREngine/components/BuyCreditsModal.tsx
// Get more credits — in one window: the monthly plans (no plan yet) or the
// one-click upgrade to the next plan (a plan already), then the one-time
// credit packs. Rendered in a portal on document.body so no page card, helper
// or transformed parent can cover or clip it.
//
// Opened for a priced action the credits did not cover (`pendingAction`): after
// paying on Stripe the creator comes back to the same screen, where that action
// is offered again as its one priced button; after an upgrade in place the
// window closes and the action's button works again. Nothing starts on its own.

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins } from 'lucide-react';
import { useStudioPricing } from '../../../../hooks/useStudioCapabilities';
import { useStudioBalance } from '../../../../hooks/useStudioBalance';
import { useStudioAccount } from '../../../../hooks/useStudioAccount';
import { hasLivePlan, useMySubscription, useSubscriptionPlans } from '../../../../hooks/useSubscription';
import { rememberPendingPaidAction, type PendingPaidAction } from '../../../../utils/studioDraft';
import { CreditPackPicker } from './billing/CreditPackPicker';
import { PlanChoices } from './billing/PlanChoices';
import { UpgradeAction } from './billing/UpgradeAction';
import { currentStudioReturnPath, type CheckoutContext } from './billing/billingActions';

export { formatMoney } from '../../../../utils/money';
export { bestValuePackId, packYield } from './billing/CreditPackPicker';

interface BuyCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** The priced action the credits did not cover, offered again once they are there. */
  pendingAction?: PendingPaidAction | null;
  /** The balance the opening page shows, used until this window's own read has loaded. */
  availableCredits?: number;
}

function BuyCreditsDialog({
  onClose,
  pendingAction,
  availableCredits,
}: {
  onClose: () => void;
  pendingAction?: PendingPaidAction | null;
  availableCredits?: number;
}) {
  const titleId = useId();
  const pricing = useStudioPricing();
  const account = useStudioAccount();
  const { usageAccess } = useStudioBalance(account, account !== 'anonymous');
  const available = usageAccess?.mode === 'credits' ? usageAccess.creditInfo.available : availableCredits ?? null;
  const me = useMySubscription();
  const plans = useSubscriptionPlans();

  const [checkingOut, setCheckingOut] = useState(false);
  const checkingOutRef = useRef(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  // Read once when the window opens: the screen Stripe brings the creator back to.
  const [returnPath] = useState(currentStudioReturnPath);
  const context: CheckoutContext = { returnPath, pendingAction, availableCredits: available };

  const setBusy = useCallback((busy: boolean) => {
    checkingOutRef.current = busy;
    setCheckingOut(busy);
  }, []);

  const close = useCallback(() => {
    if (!checkingOutRef.current) onClose();
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

  // A plan already: its next plan up, if any. No plan: the plans. Plan unknown (read failed): packs only.
  const catalog = plans.data;
  const live = hasLivePlan(me.data);
  const nextPlan = live && me.data?.upgradeTo ? catalog?.plans.find((plan) => plan.id === me.data!.upgradeTo) ?? null : null;
  const offerPlans = Boolean(catalog && catalog.plans.length > 0 && me.data?.canSubscribe);
  const planName = me.data?.subscription?.planName;

  const upgraded = () => {
    // Back to the page: the action's own button works again and runs only when clicked.
    if (pendingAction && returnPath) {
      rememberPendingPaidAction(pendingAction, returnPath, available);
      onClose();
    }
  };

  const needs =
    pendingAction && pendingAction.credits !== null ? ` ${pendingAction.label} costs ${pendingAction.credits.toLocaleString()}.` : '';

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
          className="pointer-events-auto flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0e0e10] shadow-2xl shadow-black/60 outline-none"
        >
          <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-5 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#fa7517]/25 bg-[#fa7517]/10">
                <Coins className="h-4 w-4 text-[#fa7517]" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 id={titleId} className="text-base font-semibold text-white">
                  Get more credits
                </h2>
                <p className="text-xs text-zinc-400">
                  {available !== null ? `You have ${available.toLocaleString()} credits.` : 'Pick a plan or a one-time pack.'}
                  {needs}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={close}
              disabled={checkingOut}
              className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-4">
            {offerPlans && catalog && (
              <section aria-labelledby={`${titleId}-plans`} className="space-y-3">
                <div>
                  <h3 id={`${titleId}-plans`} className="text-sm font-semibold text-white">
                    Subscribe: credits for a set number of videos every month
                  </h3>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    One video = {catalog.videoBreakdown.concepts} concepts, {catalog.videoBreakdown.edits} AI edits and{' '}
                    {catalog.videoBreakdown.audits} audit ({catalog.videoCredits} credits).{' '}
                    <Link
                      to={`/ai-thumbnails/pricing${returnPath ? `?return=${encodeURIComponent(returnPath)}` : ''}`}
                      onClick={() => {
                        // A plan bought there brings the creator back here, with this action waiting.
                        if (returnPath) rememberPendingPaidAction(pendingAction, returnPath, available);
                        onClose();
                      }}
                      className="text-[#fb923c] underline hover:text-orange-300"
                    >
                      Compare plans
                    </Link>
                  </p>
                </div>
                <PlanChoices
                  catalog={catalog}
                  me={me.data}
                  signedIn
                  variant="compact"
                  context={context}
                  disabled={checkingOut}
                  onBusyChange={setBusy}
                />
              </section>
            )}

            {nextPlan && (
              <section aria-labelledby={`${titleId}-upgrade`} className="space-y-3">
                <div>
                  <h3 id={`${titleId}-upgrade`} className="text-sm font-semibold text-white">
                    Upgrade to {nextPlan.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    {planName ? `You're on ${planName}. ` : ''}
                    {`${nextPlan.name} gives ${nextPlan.videosPerMonth.toLocaleString()} videos a month (${nextPlan.creditsPerMonth.toLocaleString()} credits). The change is immediate.`}
                  </p>
                </div>
                <UpgradeAction planId={nextPlan.id} planName={nextPlan.name} returnPath={returnPath} onUpgraded={upgraded} />
              </section>
            )}

            <section aria-labelledby={`${titleId}-packs`} className="space-y-3">
              <div>
                <h3 id={`${titleId}-packs`} className="text-sm font-semibold text-white">
                  {offerPlans || nextPlan ? 'Or buy a one-time pack' : 'Buy a one-time pack'}
                </h3>
                <p className="mt-0.5 text-xs text-zinc-400">No subscription. Pack credits never expire.</p>
              </div>
              <CreditPackPicker pricing={pricing} context={context} disabled={checkingOut} onBusyChange={setBusy} />
            </section>
          </div>

          <div className="border-t border-white/[0.08] px-5 py-3">
            <p className="text-center text-[11px] text-zinc-500">Secure payment by Stripe. You'll come back to this page.</p>
          </div>
        </motion.div>
      </div>
    </>
  );
}

export const BuyCreditsModal: React.FC<BuyCreditsModalProps> = ({ isOpen, onClose, pendingAction, availableCredits }) => {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <BuyCreditsDialog key="buy-credits" onClose={onClose} pendingAction={pendingAction} availableCredits={availableCredits} />
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default BuyCreditsModal;
