// The monthly plans, shown in videos per month with a monthly / yearly switch.
// Every plan button carries its price and is one click: Stripe Checkout for a
// new plan, an in-place upgrade for a bigger one, the billing portal for the rest.
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Check, Loader2 } from 'lucide-react';
import type {
  BillingInterval,
  MySubscription,
  SubscriptionCatalog,
  SubscriptionPlan,
} from '../../../../../types/subscription';
import { billingErrorDetails } from '../../../../../api/subscriptions';
import { hasLivePlan, subscriptionKey } from '../../../../../hooks/useSubscription';
import { useStudioAccount } from '../../../../../hooks/useStudioAccount';
import { formatPlanMoney } from '../../../../../utils/money';
import { plainApiError, type PlainApiError } from '../../../../../utils/plainApiError';
import { startStudioAuth, STUDIO_SIGN_UP_PATH } from '../../../../../utils/studioAuth';
import { TechnicalErrorDetail } from '../../../../common/TechnicalErrorDetail';
import { goToPlanCheckout, type CheckoutContext } from './billingActions';
import { ManageBillingButton } from './ManageBillingButton';
import { UpgradeAction } from './UpgradeAction';

/** "Start Creator · $24/month", "Start Creator · $199/year". */
export function startPlanLabel(plan: SubscriptionPlan, interval: BillingInterval): string {
  const price = plan.prices[interval];
  return `Start ${plan.name} · ${formatPlanMoney(price.amountCents, price.currency)}/${interval}`;
}

/** "6 videos a month". */
export const videosPerMonthText = (videos: number) => `${videos.toLocaleString()} video${videos === 1 ? '' : 's'} a month`;

/** The best yearly saving in the catalog, as the server computed it. */
export const bestYearlySaving = (plans: SubscriptionPlan[]) =>
  plans.reduce((best, plan) => Math.max(best, plan.prices.year.savingsPercent || 0), 0);

export function IntervalToggle({
  value,
  onChange,
  plans,
}: {
  value: BillingInterval;
  onChange: (value: BillingInterval) => void;
  plans: SubscriptionPlan[];
}) {
  const saving = bestYearlySaving(plans);
  const savings = new Set(plans.map((plan) => plan.prices.year.savingsPercent));
  const option = (interval: BillingInterval, label: string) => (
    <button
      type="button"
      aria-pressed={value === interval}
      onClick={() => onChange(interval)}
      className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
        value === interval ? 'bg-[#fa7517] font-semibold text-white' : 'text-zinc-400 hover:text-white'
      }`}
    >
      {label}
    </button>
  );
  return (
    <div role="group" aria-label="Billing period" className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
      {option('month', 'Monthly')}
      {option('year', saving > 0 ? `Yearly · save ${savings.size > 1 ? 'up to ' : ''}${saving}%` : 'Yearly')}
    </div>
  );
}

function PriceLines({ plan, interval, compact }: { plan: SubscriptionPlan; interval: BillingInterval; compact: boolean }) {
  const { month, year } = plan.prices;
  if (interval === 'month') {
    return compact ? null : (
      <p className="mt-3 flex items-baseline gap-1 text-white">
        <span className="text-3xl font-semibold">{formatPlanMoney(month.amountCents, month.currency)}</span>
        <span className="text-sm text-zinc-400">/month</span>
      </p>
    );
  }
  const billed = `Billed ${formatPlanMoney(year.amountCents, year.currency)} once a year${
    year.savingsPercent > 0 ? ` · save ${year.savingsPercent}%` : ''
  }`;
  if (compact) {
    return (
      <span className="block text-xs text-zinc-500">
        {formatPlanMoney(year.monthlyEquivalentCents, year.currency)}/month · {billed.charAt(0).toLowerCase() + billed.slice(1)}
      </span>
    );
  }
  return (
    <>
      <p className="mt-3 flex items-baseline gap-1 text-white">
        <span className="text-3xl font-semibold">{formatPlanMoney(year.monthlyEquivalentCents, year.currency)}</span>
        <span className="text-sm text-zinc-400">/month</span>
      </p>
      <p className="text-xs text-zinc-400">{billed}</p>
    </>
  );
}

export function PlanChoices({
  catalog,
  me,
  meLoading = false,
  signedIn,
  variant,
  context,
  signUpReturnPath = '/ai-thumbnails/pricing',
  disabled = false,
  onBusyChange,
  onUpgraded,
}: {
  catalog: SubscriptionCatalog;
  /** The account's plan; null or undefined when unknown (a visitor, or the read failed). */
  me?: MySubscription | null;
  /** The signed-in account's plan is still loading: plan buttons wait for it. */
  meLoading?: boolean;
  signedIn: boolean;
  variant: 'page' | 'compact';
  /** Where Stripe brings the creator back, and the priced action waiting there. */
  context: CheckoutContext;
  /** The page a visitor returns to after signing up. */
  signUpReturnPath?: string;
  /** Another checkout is opening. */
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
  onUpgraded?: (me: MySubscription) => void;
}) {
  const account = useStudioAccount();
  const client = useQueryClient();
  const live = hasLivePlan(me);
  const current = live ? catalog.plans.find((plan) => plan.id === me!.subscription!.planId) ?? null : null;
  const [interval, setBillingInterval] = useState<BillingInterval>(live && me?.subscription ? me.subscription.interval : 'month');
  const [opening, setOpening] = useState<string | null>(null);
  const [error, setError] = useState<PlainApiError | null>(null);
  const [exists, setExists] = useState(false);
  const busy = useRef(false);
  const mounted = useRef(true);
  useEffect(() => () => {
    mounted.current = false;
  }, []);
  const compact = variant === 'compact';
  // A plan that loads after the first render shows its own billing period.
  const liveInterval = live ? me?.subscription?.interval : undefined;
  useEffect(() => {
    if (liveInterval) setBillingInterval(liveInterval);
  }, [liveInterval]);

  const start = async (plan: SubscriptionPlan) => {
    if (busy.current || disabled) return;
    busy.current = true;
    setOpening(plan.id);
    onBusyChange?.(true);
    setError(null);
    setExists(false);
    try {
      if (await goToPlanCheckout(plan.id, interval, context)) return;
      if (mounted.current)
        setError({ message: 'Checkout is not available right now. Please try again in a moment.', technical: 'no checkout URL in the response', status: null, code: null });
    } catch (failure) {
      if (mounted.current) {
        if (billingErrorDetails(failure).code === 'SUBSCRIPTION_EXISTS') {
          setExists(true);
          void client.invalidateQueries({ queryKey: subscriptionKey(account) });
        } else setError(plainApiError(failure, 'Checkout did not open. Please try again.'));
      }
    }
    busy.current = false;
    onBusyChange?.(false);
    if (mounted.current) setOpening(null);
  };

  const primary = `inline-flex items-center justify-center gap-2 rounded-xl bg-[#fa7517] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#fa7517]/20 transition-colors hover:bg-[#fb8a3c] disabled:cursor-not-allowed disabled:opacity-40 ${
    compact ? '' : 'w-full'
  }`;

  const action = (plan: SubscriptionPlan) => {
    if (!signedIn) {
      // A visitor signs up on the AI Thumbnails page (never a modal) and comes back here.
      return (
        <Link to={STUDIO_SIGN_UP_PATH} onClick={() => startStudioAuth('sign-up', signUpReturnPath)} className={primary}>
          {startPlanLabel(plan, interval)}
        </Link>
      );
    }
    if (live && current) {
      if (plan.id === current.id)
        return (
          <span className={`inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2.5 text-sm font-medium text-emerald-200 ${compact ? '' : 'w-full'}`}>
            <Check className="h-4 w-4" aria-hidden="true" />
            Current plan
          </span>
        );
      if (plan.rank > current.rank)
        return (
          <UpgradeAction
            planId={plan.id}
            planName={plan.name}
            label={(charge) => `Upgrade · ${charge}`}
            returnPath={context.returnPath}
            onUpgraded={onUpgraded}
            buttonClassName={primary}
          />
        );
      return <ManageBillingButton returnPath={context.returnPath} />;
    }
    if (live && !current) return <ManageBillingButton returnPath={context.returnPath} />;
    return (
      <button type="button" onClick={() => void start(plan)} disabled={disabled || meLoading || opening !== null} className={primary}>
        {opening === plan.id ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Opening secure checkout…
          </>
        ) : (
          startPlanLabel(plan, interval)
        )}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      <div className={compact ? "" : "flex justify-center"}>
        <IntervalToggle value={interval} onChange={setBillingInterval} plans={catalog.plans} />
      </div>
      {compact ? (
        <ul className="space-y-2">
          {catalog.plans.map((plan) => (
            <li key={plan.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-white">{plan.name}</span>
                <span className="block text-xs text-zinc-300">
                  {videosPerMonthText(plan.videosPerMonth)} · {plan.creditsPerMonth.toLocaleString()} credits
                </span>
                <PriceLines plan={plan} interval={interval} compact />
              </span>
              <span className="shrink-0">{action(plan)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {catalog.plans.map((plan) => {
            const isCurrent = current?.id === plan.id;
            return (
              <article
                key={plan.id}
                aria-label={plan.name}
                className={`flex flex-col rounded-2xl border p-5 ${
                  isCurrent ? 'border-[#fa7517]/60 bg-[#fa7517]/[0.05]' : 'border-white/10 bg-white/[0.02]'
                }`}
              >
                <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                <p className="mt-1 text-sm text-zinc-300">{videosPerMonthText(plan.videosPerMonth)}</p>
                <PriceLines plan={plan} interval={interval} compact={false} />
                <p className="mt-1 text-xs text-zinc-500">{plan.creditsPerMonth.toLocaleString()} credits a month</p>
                <ul className="mt-4 flex-1 space-y-2">
                  {plan.highlights.map((line) => (
                    <li key={line} className="flex items-start gap-2 text-sm text-zinc-300">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#fa7517]" aria-hidden="true" />
                      {line}
                    </li>
                  ))}
                </ul>
                <div className="mt-5">{action(plan)}</div>
              </article>
            );
          })}
        </div>
      )}
      {exists && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-500/25 bg-amber-500/[.06] px-4 py-3 text-sm text-amber-100">
          You already have a plan.
          <ManageBillingButton returnPath={context.returnPath} />
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error.message}
          <TechnicalErrorDetail detail={error.technical} />
        </p>
      )}
    </div>
  );
}

export default PlanChoices;
