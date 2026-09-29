// Settings › Subscription: the plan, its status, the next invoice, the plan
// credits and when they expire, videos left, and one "Manage or cancel" button
// (Stripe's customer portal). No plan: a short pitch and the pricing page.
import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowUpRight } from 'lucide-react';
import type { AccountSubscription, MySubscription } from '../../../../../types/subscription';
import { hasLivePlan, useMySubscription, videosLeftText } from '../../../../../hooks/useSubscription';
import { formatMoney } from '../../../../../utils/money';
import { plainApiError } from '../../../../../utils/plainApiError';
import { TechnicalErrorDetail } from '../../../../common/TechnicalErrorDetail';
import { ManageBillingButton } from '../billing/ManageBillingButton';
import { subscriptionCreditsLine } from '../billing/PlanCreditsSummary';

const RETURN_PATH = '/ai-thumbnails/settings/subscription';

const longDate = (iso: string | null | undefined) => {
  if (!iso) return '';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
};

/** The status in plain words, and whether it needs the creator. */
export function subscriptionStatusText(subscription: AccountSubscription, now = Date.now()): { text: string; warning: boolean } {
  const end = longDate(subscription.currentPeriodEnd);
  const ended = Date.parse(subscription.currentPeriodEnd) <= now;
  switch (subscription.status) {
    case 'active':
    case 'trialing':
      return subscription.cancelAtPeriodEnd
        ? { text: `Canceled — ends on ${end}`, warning: true }
        : { text: 'Active', warning: false };
    case 'past_due':
    case 'unpaid':
      return { text: 'Payment failed — update your card', warning: true };
    case 'canceled':
      return { text: ended ? `Canceled — ended on ${end}` : `Canceled — ends on ${end}`, warning: true };
    case 'incomplete':
      return { text: 'Waiting for the first payment', warning: true };
    case 'incomplete_expired':
      return { text: 'The first payment did not go through', warning: true };
    case 'paused':
      return { text: 'Paused', warning: true };
    default:
      return { text: subscription.status, warning: false };
  }
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-white/[0.06] py-2.5 text-sm">
      <dt className="text-zinc-400">{label}</dt>
      <dd className="text-right text-white">{children}</dd>
    </div>
  );
}

function PlanDetails({ me }: { me: MySubscription }) {
  const subscription = me.subscription!;
  const status = subscriptionStatusText(subscription);
  const renews = !subscription.cancelAtPeriodEnd && subscription.nextInvoiceAt && subscription.status !== 'canceled';
  return (
    <div className="space-y-5">
      {status.warning && (subscription.status === 'past_due' || subscription.status === 'unpaid') && (
        <p role="alert" className="flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/[.06] px-3 py-2.5 text-sm text-amber-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
          Your last payment failed. Update your card in Manage or cancel. No new credits are added until it is paid.
        </p>
      )}
      <dl>
        <Row label="Plan">
          {subscription.planName} · {subscription.interval === 'year' ? 'yearly' : 'monthly'}
        </Row>
        <Row label="Status">
          <span className={status.warning ? 'text-amber-200' : 'text-emerald-300'}>{status.text}</span>
        </Row>
        <Row label="Next invoice">
          {renews ? `${longDate(subscription.nextInvoiceAt)} · ${formatMoney(subscription.amountCents, subscription.currency)}` : 'None'}
        </Row>
        <Row label="Videos left">{videosLeftText(me.videosRemaining)}</Row>
        <Row label="Subscription credits">{subscriptionCreditsLine(me)}</Row>
        <Row label="Other credits">{me.credits.other.available.toLocaleString()} from packs and gifts, no expiry</Row>
        <Row label="Channel profiles">
          {me.channelProfiles.used.toLocaleString()} of {me.channelProfiles.limit.toLocaleString()} used
        </Row>
      </dl>
      <div className="flex flex-wrap items-center gap-3">
        <ManageBillingButton returnPath={RETURN_PATH} />
        <Link to="/ai-thumbnails/pricing" className="inline-flex items-center gap-1 text-sm text-zinc-300 underline hover:text-white">
          Compare plans
        </Link>
      </div>
      <p className="text-xs text-zinc-500">Change your card, see invoices, switch plans or cancel on Stripe's secure billing page.</p>
    </div>
  );
}

function NoPlan({ me }: { me: MySubscription }) {
  const ended = me.subscription?.status === 'canceled' ? me.subscription : null;
  const endedText = ended
    ? `Your ${ended.planName} plan ${Date.parse(ended.currentPeriodEnd) <= Date.now() ? 'ended' : 'ends'} on ${longDate(ended.currentPeriodEnd)}.`
    : 'You have no plan.';
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <p className="text-sm font-medium text-white">{endedText}</p>
        <p className="mt-1 text-sm text-zinc-400">
          A plan gives you credits for a set number of videos every month. The price of one designer thumbnail, for your whole month.
        </p>
        <Link
          to="/ai-thumbnails/pricing"
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#fa7517] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#fb8a3c]"
        >
          See plans
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      <dl>
        {me.credits.subscription.available > 0 && <Row label="Subscription credits">{subscriptionCreditsLine(me)}</Row>}
        <Row label="Other credits">{me.credits.other.available.toLocaleString()} from packs and gifts, no expiry</Row>
        <Row label="Channel profiles">
          {me.channelProfiles.used.toLocaleString()} of {me.channelProfiles.limit.toLocaleString()} used
        </Row>
      </dl>
      {ended && <ManageBillingButton label="See past invoices" returnPath={RETURN_PATH} />}
    </div>
  );
}

export default function SettingsSubscriptionSection() {
  const me = useMySubscription();
  if (me.isPending) {
    return (
      <p role="status" className="text-sm text-zinc-400">
        Loading your plan…
      </p>
    );
  }
  if (me.error || !me.data) {
    const problem = plainApiError(me.error, 'Your plan did not load. Please try again.');
    return (
      <p role="alert" className="text-sm text-red-300">
        {problem.message}
        <TechnicalErrorDetail detail={problem.technical} />{' '}
        <button type="button" className="underline" onClick={() => void me.refetch()}>
          Try again
        </button>
      </p>
    );
  }
  return hasLivePlan(me.data) ? <PlanDetails me={me.data} /> : <NoPlan me={me.data} />;
}
