import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { plainApiError, type PlainApiError } from '../../../../../utils/plainApiError';
import { TechnicalErrorDetail } from '../../../../common/TechnicalErrorDetail';
import { goToBillingPortal } from './billingActions';

const PORTAL_UNAVAILABLE: PlainApiError = {
  message: 'Billing is not available right now. Please try again in a moment.',
  technical: 'no portal URL in the response',
  status: null,
  code: null,
};

/** "Manage or cancel": one click to Stripe's customer portal. */
export function ManageBillingButton({
  label = 'Manage or cancel',
  returnPath,
  className = 'inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:border-white/35 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40',
}: {
  label?: string;
  returnPath?: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<PlainApiError | null>(null);
  const mounted = useRef(true);
  useEffect(() => () => {
    mounted.current = false;
  }, []);
  const open = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (await goToBillingPortal(returnPath)) return;
      if (mounted.current) setError(PORTAL_UNAVAILABLE);
    } catch (failure) {
      if (mounted.current) setError(plainApiError(failure, 'Billing did not open. Please try again.'));
    }
    if (mounted.current) setBusy(false);
  };
  return (
    <span className="inline-flex flex-col items-start gap-1.5">
      <button type="button" onClick={() => void open()} disabled={busy} className={className}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ExternalLink className="h-4 w-4" aria-hidden="true" />}
        {busy ? 'Opening billing…' : label}
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

export default ManageBillingButton;
