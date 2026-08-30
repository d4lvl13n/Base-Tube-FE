// src/components/pages/CreatorHub/ManagePasses/StripeConnectStrip.tsx
import React, { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStartStripeConnect, useStripeConnectStatus } from '../../../../hooks/usePass';
import { cx, form } from '../shared/hubStyles';

/**
 * Card sales on a fiat pass pay the creator through a Stripe (test) Connect
 * account; without one, "Buy with card" answers CONNECT_ACCOUNT_NOT_READY.
 * Crypto checkout does not need it.
 *
 * A quiet strip, not a second call to action: "Create pass" stays the only
 * orange thing on the page. Stripe sends the creator back to
 * `/creator-hub/passes?stripe=return|refresh`; that query is the cue to
 * re-read the status so the strip disappears the moment `ready` is true.
 *
 * The status query failing must never block the page — the strip just
 * stays out of the way.
 */
/** The API answers `{ error: "<sentence>" }`; show it when it reads as one, else a generic line. */
function onboardingErrorText(error: unknown): string {
  const fromServer = (error as { response?: { data?: { error?: unknown } } })?.response?.data?.error;
  if (typeof fromServer === 'string' && fromServer.trim().length > 12) return fromServer.trim();
  return 'Stripe could not be opened. Try again in a moment.';
}

const StripeConnectStrip: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: status, isError, refetch } = useStripeConnectStatus();
  const startConnect = useStartStripeConnect();
  const returned = searchParams.get('stripe');
  const handledReturn = useRef<string | null>(null);

  useEffect(() => {
    if (!returned || handledReturn.current === returned) return;
    handledReturn.current = returned;
    void refetch();
    // Drop `?stripe=…` so a reload does not re-trigger, and the URL is clean.
    const next = new URLSearchParams(searchParams);
    next.delete('stripe');
    setSearchParams(next, { replace: true });
  }, [returned, refetch, searchParams, setSearchParams]);

  if (isError || !status || status.ready) return null;

  return (
    <div
      className="flex flex-col gap-3 rounded-xl border border-gray-800/60 bg-white/[0.02] px-4 py-3 md:flex-row md:items-center md:justify-between"
      role="status"
    >
      <div className="min-w-0">
        <p className="text-sm text-gray-300">
          Card sales that pay you in euros need a Stripe test account. Crypto checkout does not.
        </p>
        {startConnect.isError && (
          <p className={cx(form.errorText, 'mt-1')}>{onboardingErrorText(startConnect.error)}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => startConnect.mutate()}
        disabled={startConnect.isPending}
        className={cx(form.secondaryButton, 'shrink-0')}
      >
        {startConnect.isPending ? 'Opening Stripe…' : 'Connect Stripe test account'}
      </button>
    </div>
  );
};

export default StripeConnectStrip;
