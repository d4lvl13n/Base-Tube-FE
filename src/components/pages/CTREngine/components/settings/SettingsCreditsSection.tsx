// Settings › Credits: balance, what each action costs (live pricing), Buy credits,
// and purchases/bonuses read from the credit ledger.
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Coins } from 'lucide-react';
import { creditsApi } from '../../../../../api/credits';
import type { CTRUsageAccess, CreditLedgerEntry } from '../../../../../types/ctr';
import { useStudioPricing } from '../../../../../hooks/useStudioCapabilities';
import { useStudioAccount } from '../../../../../hooks/useStudioAccount';
import { useStudioBalanceLoadFailure } from '../../../../../hooks/useStudioBalance';
import { studioCreditsLabel } from '../../../../../utils/studioPricing';
import { plainApiError } from '../../../../../utils/plainApiError';
import { TechnicalErrorDetail } from '../../../../common/TechnicalErrorDetail';
import { BuyCreditsModal, formatMoney } from '../BuyCreditsModal';
import { CTRQuotaDisplay } from '../CTRQuotaDisplay';

/** Ledger entries a person thinks of as money in or out; reservations for work are left out. */
const HISTORY_TYPES = new Set(['purchase', 'grant', 'refund', 'adjustment']);
const GRANT_LABELS: Record<string, string> = {
  bonus: 'Bonus credits',
  referral: 'Referral reward',
  signup_grant: 'Welcome credits',
};

export function creditHistoryLabel(entry: CreditLedgerEntry): string {
  if (entry.type === 'purchase') return 'Credit purchase';
  if (entry.type === 'refund') return 'Refund';
  // A refunded or disputed purchase takes its credits back as an adjustment.
  if (entry.type === 'adjustment') return entry.metadata?.creditPurchaseId ? 'Refund' : 'Balance adjustment';
  const source = typeof entry.metadata?.source === 'string' ? entry.metadata.source : '';
  return GRANT_LABELS[source] || 'Credits added';
}

const paidAmount = (entry: CreditLedgerEntry): string | null => {
  const cents = entry.metadata?.priceCents;
  const currency = entry.metadata?.currency;
  return typeof cents === 'number' && typeof currency === 'string' ? formatMoney(cents, currency) : null;
};

const formatDate = (iso: string) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

function CreditHistory() {
  const account = useStudioAccount();
  // The newest 100 ledger rows (the endpoint's maximum), of which only top-ups are shown.
  const ledger = useQuery({
    queryKey: ['credits', account, 'ledger'],
    queryFn: () => creditsApi.getCreditLedger({ limit: 100 }),
    enabled: account !== 'anonymous',
    retry: false,
    staleTime: 30_000,
  });
  const entries = (ledger.data ?? []).filter((entry) => entry.type && HISTORY_TYPES.has(entry.type)).slice(0, 12);

  if (ledger.isPending) {
    return (
      <p role="status" className="text-sm text-zinc-500">
        Loading your history…
      </p>
    );
  }
  if (ledger.error) {
    const problem = plainApiError(ledger.error, 'Your credit history did not load. Please try again.');
    return (
      <p role="alert" className="text-sm text-red-300">
        {problem.message}
        <TechnicalErrorDetail detail={problem.technical} />{' '}
        <button type="button" className="underline" onClick={() => void ledger.refetch()}>
          Try again
        </button>
      </p>
    );
  }
  if (entries.length === 0) return <p className="text-sm text-zinc-500">No purchases yet.</p>;
  return (
    <ul className="divide-y divide-white/[0.06] rounded-xl border border-white/10">
      {entries.map((entry, index) => {
        const paid = paidAmount(entry);
        return (
          <li key={entry.id ?? `${entry.createdAt}-${index}`} className="flex items-center gap-3 px-3 py-2.5 text-sm">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-zinc-100">{creditHistoryLabel(entry)}</span>
              <span className="block text-xs text-zinc-500">
                {[formatDate(entry.createdAt), paid].filter(Boolean).join(' · ')}
              </span>
            </span>
            <span className={`shrink-0 font-medium ${entry.balanceDelta >= 0 ? 'text-emerald-300' : 'text-zinc-400'}`}>
              {entry.balanceDelta >= 0 ? '+' : '−'}
              {Math.abs(entry.balanceDelta).toLocaleString()}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default function SettingsCreditsSection({
  usageAccess,
  isLoadingQuota,
}: {
  usageAccess: CTRUsageAccess | null;
  isLoadingQuota: boolean;
}) {
  const [buying, setBuying] = useState(false);
  const pricing = useStudioPricing() ?? (usageAccess?.mode === 'credits' ? usageAccess.pricing : null);
  const balanceLoad = useStudioBalanceLoadFailure();
  const credits = usageAccess?.mode === 'credits' ? usageAccess.creditInfo : null;

  const prices: Array<[string, number | null]> = [
    ['New concept', pricing?.ctr.generatePerConcept ?? null],
    ['AI edit', pricing?.thumbnail.editPerImage ?? null],
    ['Thumbnail audit', pricing?.ctr.audit ?? null],
    ['Audit with viewer personas', pricing?.ctr.auditWithPersonas ?? null],
    ['Text change', 0],
  ];

  if (usageAccess?.mode === 'quota') return <CTRQuotaDisplay usageAccess={usageAccess} variant="full" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
        {credits ? (
          <div className="flex items-end gap-8">
            <div>
              <p className="text-xs text-zinc-500">Available</p>
              <p className="flex items-center gap-2 text-3xl font-semibold text-white">
                <Coins className="h-6 w-6 text-[#fa7517]" aria-hidden="true" />
                {credits.available.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Reserved</p>
              <p className="text-lg font-medium text-zinc-300">{credits.reserved.toLocaleString()}</p>
            </div>
          </div>
        ) : isLoadingQuota ? (
          <p role="status" className="text-sm text-zinc-400">
            Loading your balance…
          </p>
        ) : balanceLoad.failed ? (
          <p role="alert" className="text-sm text-amber-200">
            Your balance did not load.{' '}
            <button type="button" className="underline disabled:opacity-50" disabled={balanceLoad.retrying} onClick={balanceLoad.retry}>
              {balanceLoad.retrying ? 'Retrying…' : 'Try again'}
            </button>
          </p>
        ) : (
          <p className="text-sm text-zinc-400">Your balance is not available yet.</p>
        )}
        <button
          type="button"
          onClick={() => setBuying(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#fa7517] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#fb8a3c]"
        >
          <Coins className="h-4 w-4" aria-hidden="true" />
          Buy credits
        </button>
      </div>
      {credits && credits.reserved > 0 && (
        <p className="-mt-3 text-xs text-zinc-500">Reserved credits are held for work in progress. They come back if it fails.</p>
      )}

      <div>
        <h3 className="mb-2 text-sm font-semibold text-white">What each action costs</h3>
        <dl className="grid gap-x-6 sm:grid-cols-2">
          {prices.map(([label, cost]) => (
            <div key={label} className="flex items-center justify-between border-b border-white/[0.06] py-2 text-sm">
              <dt className="text-zinc-400">{label}</dt>
              <dd className="text-white">{cost === null ? '—' : cost === 0 ? 'Free' : studioCreditsLabel(cost)}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-white">Purchases and bonuses</h3>
        <CreditHistory />
      </div>

      <BuyCreditsModal isOpen={buying} onClose={() => setBuying(false)} />
    </div>
  );
}
