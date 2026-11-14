// src/components/pages/CreatorHub/ManagePasses/PassesOverview.tsx
import React from 'react';
import { Wallet } from 'lucide-react';
import type { Pass } from '../../../../types/pass';
import type { MoneyLine, PassRow } from '../../../../types/creatorBusiness';
import { cx, sheen, skeleton, surface } from '../Business/businessStyles';
import { EARNINGS_LABEL, formatCount, saleState, splitMoney } from '../Business/businessFormat';
import { passLifecycle } from './PassStatusPill';
import { soldCount } from './passHelpers';

interface PassesOverviewProps {
  passes: Pass[] | undefined;
  /** Each pass's business row (all time), to know which ones can be bought right now. */
  stats?: Map<string, PassRow>;
  /** Earnings since the first sale, one line per currency; undefined while loading. */
  money: MoneyLine[] | undefined;
  isLoading: boolean;
  /** The pass list failed. */
  error: unknown;
  /** The earnings could not be loaded (failed, or passes are off). The two counts still show. */
  moneyError: boolean;
}

/** Can someone buy it right now: the business API's answer when it is here, else the pass's own fields. */
const isOnSale = (pass: Pass, stat: PassRow | undefined): boolean =>
  stat ? saleState(stat, { videoCount: pass.videos?.length ?? 0 }).onSale : passLifecycle(pass) === 'live';

/**
 * Above the list, in one line: what the passes earned since they went on sale
 * (one amount per currency, never added together, all the same size), how many
 * passes can be bought right now, and how many passes were sold.
 */
const PassesOverview: React.FC<PassesOverviewProps> = ({ passes, stats, money, isLoading, error, moneyError }) => {
  const rows = passes ?? [];
  const onSale = rows.filter((pass) => isOnSale(pass, stats?.get(pass.id))).length;
  const sold = rows.reduce((sum, pass) => sum + soldCount(pass), 0);
  const listUnavailable = Boolean(error);
  const listLoading = !listUnavailable && isLoading;
  const moneyUnavailable = listUnavailable || moneyError;
  const moneyLoading = !moneyUnavailable && (isLoading || !money);

  const facts: Array<{ label: string; value: string; hint?: string }> = [
    { label: 'On sale now', value: formatCount(onSale), hint: `of ${formatCount(rows.length)} ${rows.length === 1 ? 'pass' : 'passes'}` },
    { label: 'Passes sold', value: formatCount(sold) },
  ];

  return (
    <section className={cx(surface.card, 'flex flex-col gap-5 p-5 md:p-6 lg:flex-row lg:items-center lg:gap-10')} aria-label="Pass totals">
      <div className={sheen} aria-hidden="true" />
      <div className="relative min-w-0 flex-1">
        <p className="flex items-center gap-2 text-sm text-gray-400">
          <Wallet className="h-4 w-4 text-[#fa7517]" aria-hidden="true" />
          {EARNINGS_LABEL}
        </p>
        {moneyUnavailable ? (
          <p className="mt-1.5 text-sm text-gray-400">Not available</p>
        ) : moneyLoading ? (
          <div className={cx(skeleton.block, 'mt-2 h-7 w-64')} aria-hidden="true" />
        ) : money && money.length ? (
          <p className="mt-1 flex flex-wrap items-baseline gap-x-6 gap-y-1 text-2xl font-bold tabular-nums tracking-tight text-white">
            {money.map((m) => {
              const parts = splitMoney(m.proceeds, m.currency, m.decimals);
              return (
                <span key={m.currency} className="whitespace-nowrap">
                  <span className="mr-1.5 text-base font-semibold tracking-normal text-gray-400">{parts.code}</span>
                  {parts.amount}
                </span>
              );
            })}
          </p>
        ) : (
          <p className="mt-1 text-2xl font-bold tracking-tight text-gray-400">Nothing yet</p>
        )}
      </div>
      <dl className="relative flex shrink-0 gap-10 border-t border-gray-800/50 pt-4 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
        {facts.map((fact) => (
          <div key={fact.label} className="min-w-0">
            <dt className="text-sm text-gray-400">{fact.label}</dt>
            {listUnavailable ? (
              <dd className="mt-1.5 text-sm text-gray-400">Not available</dd>
            ) : listLoading ? (
              <dd className={cx(skeleton.block, 'mt-2 h-7 w-14')} aria-hidden="true" />
            ) : (
              <dd className="mt-1 flex items-baseline gap-1.5 whitespace-nowrap">
                <span className="text-2xl font-bold tabular-nums text-white">{fact.value}</span>
                {fact.hint && <span className="text-sm text-gray-400">{fact.hint}</span>}
              </dd>
            )}
          </div>
        ))}
      </dl>
    </section>
  );
};

export default PassesOverview;
