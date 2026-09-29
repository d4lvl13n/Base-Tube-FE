// /ai-thumbnails/pricing — the monthly plans in videos per month (monthly or
// yearly), then the one-time credit packs as top-ups. Every button carries its
// price and is one click. A visitor, or an account that never had a plan, sees
// "Start 7-day free trial" (then the price) on every plan. A visitor goes to the
// AI Thumbnails sign-up page, then straight on to Stripe Checkout for the plan
// clicked (auth/AIThumbnailsAuthContinue).
import React, { useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import AIThumbnailsLayout from './AIThumbnailsLayout';
import useCTREngine from '../../../hooks/useCTREngine';
import { useStudioPricing } from '../../../hooks/useStudioCapabilities';
import { catalogTrial, hasLivePlan, trialTermsText, useMySubscription, useSubscriptionPlans } from '../../../hooks/useSubscription';
import { useStudioAccountState } from '../../../hooks/useStudioAccount';
import { readPendingPaidAction, studioReturnDestination } from '../../../utils/studioDraft';
import { plainApiError } from '../../../utils/plainApiError';
import { TechnicalErrorDetail } from '../../common/TechnicalErrorDetail';
import { PlanChoices } from './components/billing/PlanChoices';
import { CreditPackPicker } from './components/billing/CreditPackPicker';
import type { CheckoutContext } from './components/billing/billingActions';
import type { PlanIntentNotice } from './auth/AIThumbnailsAuthContinue';

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
  // A visitor, or an account that never had a plan: every plan starts with the free trial.
  const trial = catalogTrial(catalog);
  const trialOffered = Boolean(trial) && (signedIn ? me.data?.trialEligible === true && !hasLivePlan(me.data) : resolved);
  // The plan chosen before the sign-up could not open its checkout (AIThumbnailsAuthContinue).
  const locationState = useLocation().state as PlanIntentNotice | null;
  const notice = locationState?.planNotice ? locationState : null;

  return (
    <AIThumbnailsLayout usageAccess={access.usageAccess} isLoadingQuota={access.isLoadingQuota}>
      <div className="space-y-10 pb-10 text-white">
        <header className="space-y-2 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#fa7517]">AI Thumbnails plans</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Thumbnails for every video you publish</h1>
          <p className="text-base text-zinc-300">The price of one designer thumbnail, for your whole month.</p>
          {trial && trialOffered && <p className="text-sm font-medium text-[#fb923c]">{trialTermsText(trial)}</p>}
          {catalog && (
            <p className="text-sm text-zinc-500">
              One video = {catalog.videoBreakdown.concepts} concepts, {catalog.videoBreakdown.edits} AI edits and{' '}
              {catalog.videoBreakdown.audits} audit ({catalog.videoCredits} credits).
            </p>
          )}
        </header>

        <section aria-label="Plans" className="space-y-4">
          {notice && (
            <p role="alert" className="mx-auto flex max-w-2xl items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/[.06] px-4 py-3 text-sm text-amber-100">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
              {notice.planNotice === 'no-trial'
                ? "This account can't start a free trial: the trial is for accounts that never had a plan. Pick a plan below."
                : `${notice.message} Pick your plan again below.`}
            </p>
          )}
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
