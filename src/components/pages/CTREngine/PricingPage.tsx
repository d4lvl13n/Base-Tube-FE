// /ai-thumbnails/pricing — the monthly plans in videos per month (monthly or
// yearly), then the one-time credit packs as top-ups. Every button carries its
// price and is one click. A visitor goes to the AI Thumbnails sign-up page and
// comes back here.
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AIThumbnailsLayout from './AIThumbnailsLayout';
import useCTREngine from '../../../hooks/useCTREngine';
import { useStudioPricing } from '../../../hooks/useStudioCapabilities';
import { useMySubscription, useSubscriptionPlans } from '../../../hooks/useSubscription';
import { useStudioAccountState } from '../../../hooks/useStudioAccount';
import { readPendingPaidAction, studioReturnDestination } from '../../../utils/studioDraft';
import { plainApiError } from '../../../utils/plainApiError';
import { TechnicalErrorDetail } from '../../common/TechnicalErrorDetail';
import { PlanChoices } from './components/billing/PlanChoices';
import { CreditPackPicker } from './components/billing/CreditPackPicker';
import type { CheckoutContext } from './components/billing/billingActions';

const PRICING_PATH = '/ai-thumbnails/pricing';

export default function PricingPage() {
  const access = useCTREngine();
  const { account, resolved } = useStudioAccountState();
  const signedIn = account !== 'anonymous';
  const [params] = useSearchParams();
  // Opened from another AI Thumbnails screen (`?return=`): Stripe brings the creator back there.
  const [returnPath] = useState(() => studioReturnDestination(params.get('return')));
  const plans = useSubscriptionPlans();
  const me = useMySubscription();
  const pricing = useStudioPricing() ?? (access.usageAccess?.mode === 'credits' ? access.usageAccess.pricing : null);
  const available = access.usageAccess?.mode === 'credits' ? access.usageAccess.creditInfo.available : null;
  const [busy, setBusy] = useState(false);
  // The priced action waiting on that screen stays remembered through this checkout.
  const [pendingAction] = useState(() => (returnPath ? readPendingPaidAction(returnPath) : null));
  const context: CheckoutContext = { returnPath, pendingAction, availableCredits: available };
  const catalog = plans.data;

  return (
    <AIThumbnailsLayout usageAccess={access.usageAccess} isLoadingQuota={access.isLoadingQuota}>
      <div className="space-y-10 pb-10 text-white">
        <header className="space-y-2 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#fa7517]">AI Thumbnails plans</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Thumbnails for every video you publish</h1>
          <p className="text-base text-zinc-300">The price of one designer thumbnail, for your whole month.</p>
          {catalog && (
            <p className="text-sm text-zinc-500">
              One video = {catalog.videoBreakdown.concepts} concepts, {catalog.videoBreakdown.edits} AI edits and{' '}
              {catalog.videoBreakdown.audits} audit ({catalog.videoCredits} credits).
            </p>
          )}
        </header>

        <section aria-label="Plans" className="space-y-4">
          {plans.isPending ? (
            <div role="status" aria-label="Loading plans" className="grid gap-4 md:grid-cols-3">
              {[0, 1, 2].map((card) => (
                <div key={card} className="h-80 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.03]" />
              ))}
            </div>
          ) : plans.error || !catalog ? (
            (() => {
              const problem = plainApiError(plans.error, 'Plans did not load. Please try again.');
              return (
                <p role="alert" className="text-center text-sm text-red-300">
                  {problem.message}
                  <TechnicalErrorDetail detail={problem.technical} />{' '}
                  <button type="button" className="underline" onClick={() => void plans.refetch()}>
                    Try again
                  </button>
                </p>
              );
            })()
          ) : (
            <PlanChoices
              catalog={catalog}
              me={me.data}
              meLoading={signedIn && (me.isPending || !resolved)}
              signedIn={signedIn}
              variant="page"
              context={context}
              signUpReturnPath={PRICING_PATH}
              disabled={busy}
              onBusyChange={setBusy}
            />
          )}
          {catalog && (
            <p className="text-center text-xs text-zinc-500">
              {catalog.rolloverMonths > 0
                ? `Plan credits you don't use carry over for ${catalog.rolloverMonths} month${catalog.rolloverMonths === 1 ? '' : 's'}. `
                : "Plan credits don't carry over to the next month. "}
              Cancel any time from your billing page.
            </p>
          )}
        </section>

        <section aria-labelledby="pricing-packs" className="mx-auto max-w-md space-y-3">
          <div>
            <h2 id="pricing-packs" className="text-lg font-semibold">
              Need a few more? Top up with a pack
            </h2>
            <p className="text-sm text-zinc-400">One-time purchase, for any account with or without a plan. Pack credits never expire.</p>
          </div>
          <CreditPackPicker
            pricing={pricing}
            context={context}
            signedIn={signedIn}
            signUpReturnPath={PRICING_PATH}
            disabled={busy}
            onBusyChange={setBusy}
          />
          <p className="text-center text-[11px] text-zinc-500">Secure payment by Stripe.</p>
        </section>
      </div>
    </AIThumbnailsLayout>
  );
}
