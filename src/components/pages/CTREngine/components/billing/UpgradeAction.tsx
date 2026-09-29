import React, { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowUpCircle, CheckCircle, Loader2 } from 'lucide-react';
import { subscriptionsApi, billingErrorDetails } from '../../../../../api/subscriptions';
import type { MySubscription, SubscriptionPlanId } from '../../../../../types/subscription';
import { subscriptionKey, useUpgradePreview } from '../../../../../hooks/useSubscription';
import { useStudioAccount } from '../../../../../hooks/useStudioAccount';
import { notifyStudioUsageChanged } from '../../../../../hooks/useStudioBalance';
import { formatMoney } from '../../../../../utils/money';
import { plainApiError, type PlainApiError } from '../../../../../utils/plainApiError';
import { TechnicalErrorDetail } from '../../../../common/TechnicalErrorDetail';
import { ManageBillingButton } from './ManageBillingButton';

type Quote = { amountDueCents: number; currency: string; prorationDate: number };
type Problem = { kind: 'declined' } | { kind: 'other'; error: PlainApiError };

/** "pay $12.40 now", or "nothing to pay now". */
export const upgradeChargeText = (quote: Pick<Quote, 'amountDueCents' | 'currency'>) =>
  quote.amountDueCents > 0 ? `pay ${formatMoney(quote.amountDueCents, quote.currency)} now` : 'nothing to pay now';

const primary =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-[#fa7517] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#fa7517]/20 transition-colors hover:bg-[#fb8a3c] disabled:cursor-not-allowed disabled:opacity-40';

/**
 * One click upgrade in place: the charge is read as soon as this is on screen
 * and shown on the button ("Upgrade to Pro · pay $12.40 now"). A declined card
 * points to billing; a changed amount shows the new one on the same button
 * (the only confirmation). No page leaves for Stripe.
 */
export function UpgradeAction({
  planId,
  planName,
  label = (charge) => `Upgrade to ${planName} · ${charge}`,
  returnPath,
  onUpgraded,
  className = '',
  buttonClassName = primary,
}: {
  planId: SubscriptionPlanId;
  planName: string;
  /** The button's words around the charge. */
  label?: (charge: string) => string;
  returnPath?: string;
  /** The upgrade went through; `me` is the account's new plan and credits. */
  onUpgraded?: (me: MySubscription) => void;
  className?: string;
  buttonClassName?: string;
}) {
  const account = useStudioAccount();
  const client = useQueryClient();
  const preview = useUpgradePreview(planId);
  const [changed, setChanged] = useState<Quote | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<MySubscription | null>(null);
  const running = useRef(false);
  const mounted = useRef(true);
  useEffect(() => () => {
    mounted.current = false;
  }, []);

  const quote: Quote | null = changed ?? preview.data ?? null;

  const upgrade = async () => {
    if (!quote || running.current) return;
    running.current = true;
    setBusy(true);
    setProblem(null);
    try {
      const me = await subscriptionsApi.upgrade({ planId, prorationDate: quote.prorationDate });
      client.setQueryData(subscriptionKey(account), me);
      void client.invalidateQueries({ queryKey: ['thumbnail-studio', account, 'subscription-upgrade'] });
      // The new credits: every balance on screen reads the server again.
      notifyStudioUsageChanged();
      if (mounted.current) setDone(me);
      onUpgraded?.(me);
    } catch (failure) {
      const { code, details } = billingErrorDetails(failure);
      if (!mounted.current) return;
      if (code === 'PAYMENT_FAILED') setProblem({ kind: 'declined' });
      else if (
        code === 'PRICE_CHANGED' &&
        details &&
        typeof details.amountDueCents === 'number' &&
        typeof details.currency === 'string' &&
        typeof details.prorationDate === 'number'
      ) {
        // The new amount goes on the same button: one more click is the confirmation.
        setChanged({ amountDueCents: details.amountDueCents, currency: details.currency, prorationDate: details.prorationDate });
      } else setProblem({ kind: 'other', error: plainApiError(failure, 'The upgrade did not go through. Please try again.') });
    } finally {
      running.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  if (done) {
    const plan = done.subscription?.planName || planName;
    return (
      <p role="status" className={`flex items-center gap-2 text-sm text-emerald-200 ${className}`}>
        <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
        {`You're on ${plan} now.`}
        {!changed && preview.data?.creditsAddedNow ? ` ${preview.data.creditsAddedNow.toLocaleString()} credits were added.` : ''}
      </p>
    );
  }

  if (preview.error && !changed) {
    const error = plainApiError(preview.error, 'This upgrade is not available right now.');
    return (
      <p role="alert" className={`text-sm text-amber-200 ${className}`}>
        {error.message}
        <TechnicalErrorDetail detail={error.technical} />
      </p>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <button type="button" onClick={() => void upgrade()} disabled={!quote || busy} className={buttonClassName}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ArrowUpCircle className="h-4 w-4" aria-hidden="true" />}
        {busy ? 'Upgrading…' : label(quote ? upgradeChargeText(quote) : '…')}
      </button>
      {changed && !busy && !problem && (
        <p role="status" className="text-xs text-amber-200">
          The amount changed. It is now {formatMoney(changed.amountDueCents, changed.currency)}.
        </p>
      )}
      {!changed && preview.data && preview.data.creditsAddedNow > 0 && (
        <p className="text-xs text-zinc-400">Adds {preview.data.creditsAddedNow.toLocaleString()} credits now.</p>
      )}
      {problem?.kind === 'declined' && (
        <div role="alert" className="space-y-2 text-sm text-red-200">
          <p>Your card was declined. Update it in Manage billing.</p>
          <ManageBillingButton label="Manage billing" returnPath={returnPath} />
        </div>
      )}
      {problem?.kind === 'other' && (
        <p role="alert" className="text-sm text-red-200">
          {problem.error.message}
          <TechnicalErrorDetail detail={problem.error.technical} />
        </p>
      )}
    </div>
  );
}

export default UpgradeAction;
