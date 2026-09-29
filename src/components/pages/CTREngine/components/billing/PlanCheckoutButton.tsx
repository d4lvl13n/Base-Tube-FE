// One click: Stripe Checkout for one plan (the free trial is added by the
// server when the account can have it). Says so while it opens, and in plain
// words when it does not.
import React, { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { billingErrorDetails } from '../../../../../api/subscriptions';
import { subscriptionKey } from '../../../../../hooks/useSubscription';
import { useStudioAccount } from '../../../../../hooks/useStudioAccount';
import type { BillingInterval, SubscriptionPlanId } from '../../../../../types/subscription';
import { plainApiError, type PlainApiError } from '../../../../../utils/plainApiError';
import { TechnicalErrorDetail } from '../../../../common/TechnicalErrorDetail';
import { goToPlanCheckout, type CheckoutContext } from './billingActions';

export function PlanCheckoutButton({
  planId,
  interval = 'month',
  label,
  context,
  className = 'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#fa7517] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#fa7517]/20 transition-colors hover:bg-[#fb8a3c] disabled:cursor-not-allowed disabled:opacity-40',
  disabled = false,
  onBusyChange,
}: {
  planId: SubscriptionPlanId;
  interval?: BillingInterval;
  label: string;
  context: CheckoutContext;
  className?: string;
  /** Another checkout is opening. */
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
}) {
  const account = useStudioAccount();
  const client = useQueryClient();
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<PlainApiError | null>(null);
  const busy = useRef(false);
  const mounted = useRef(true);
  useEffect(() => () => {
    mounted.current = false;
  }, []);

  const start = async () => {
    if (busy.current || disabled) return;
    busy.current = true;
    setOpening(true);
    onBusyChange?.(true);
    setError(null);
    try {
      if (await goToPlanCheckout(planId, interval, context)) return;
      if (mounted.current)
        setError({ message: 'Checkout is not available right now. Please try again in a moment.', technical: 'no checkout URL in the response', status: null, code: null });
    } catch (failure) {
      if (mounted.current) {
        if (billingErrorDetails(failure).code === 'SUBSCRIPTION_EXISTS') {
          setError({ message: 'You already have a plan.', technical: 'SUBSCRIPTION_EXISTS', status: 409, code: 'SUBSCRIPTION_EXISTS' });
          // The page reads the plan again and shows it.
          void client.invalidateQueries({ queryKey: subscriptionKey(account) });
        } else setError(plainApiError(failure, 'Checkout did not open. Please try again.'));
      }
    }
    busy.current = false;
    onBusyChange?.(false);
    if (mounted.current) setOpening(false);
  };

  return (
    <span className="flex flex-col items-center gap-1.5">
      <button type="button" onClick={() => void start()} disabled={disabled || opening} className={className}>
        {opening ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Opening secure checkout…
          </>
        ) : (
          label
        )}
      </button>
      {error && (
        <span role="alert" className="text-xs text-red-300">
          {error.message}
          <TechnicalErrorDetail detail={error.technical} />
        </span>
      )}
    </span>
  );
}

export default PlanCheckoutButton;
