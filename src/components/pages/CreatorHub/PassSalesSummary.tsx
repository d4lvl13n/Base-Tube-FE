import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Minus, RefreshCw, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { useAllBusinessPasses, useBusinessCustomers, useBusinessOverview } from '../../../hooks/useCreatorBusiness';
import { plainApiError } from '../../../utils/plainApiError';
import {
  EARNINGS_LABEL,
  deltaText,
  formatCount,
  formatMomentDate,
  idleCurrencyText,
  isActivePair,
  moneyDeltaText,
  nextStep,
  pairMoneyLines,
} from './Business/businessFormat';
import { resolvePeriod } from './Business/businessPeriod';
import { BUSINESS_BASE, NextStepPanel, PASSES_ENABLED, SalesOffBanner, SkeletonLines } from './Business/BusinessUi';
import { HeroAmount } from './Business/BusinessBlocks';
import { periodParams } from './Business/useBusinessScope';
import { Monogram, PaidToYou } from './Business/customerBits';
import { button, cx, heroGlow, sheen, skeleton, surface } from './Business/businessStyles';

const RECENT = 5;

const Trend: React.FC<{ diff: number; children: React.ReactNode }> = ({ diff, children }) => {
  const Icon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
  return (
    <p className="mt-2 flex items-center gap-1.5 text-sm text-gray-400">
      <Icon className={cx('h-4 w-4 shrink-0', diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-red-400' : 'text-gray-500')} aria-hidden="true" />
      <span className="tabular-nums">{children}</span>
    </p>
  );
};

/**
 * The dashboard's "Pass sales" block, on the business API: the last 30 days
 * on all the creator's channels, earnings per currency in its own decimals
 * (USDC is not divided by 100), the 5 most recent customers, and the way
 * into Business. When nothing sold yet it says what to do next.
 */
const PassSalesSummary: React.FC = () => {
  const period = useMemo(() => resolvePeriod({ preset: '30d' }), []);
  const params = useMemo(() => periodParams(period), [period]);
  const overview = useBusinessOverview(params, { enabled: PASSES_ENABLED });
  const customers = useBusinessCustomers(
    { ...params, page: 1, pageSize: RECENT, sort: 'last_purchase', dir: 'desc' },
    { enabled: PASSES_ENABLED },
  );
  const noSales = overview.data ? overview.data.totals.purchases === 0 : false;
  const passes = useAllBusinessPasses(params, { enabled: PASSES_ENABLED && noSales });
  const search = '?period=30d';

  const header = (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-xl font-semibold text-white">Pass sales</h2>
        <p className="mt-1 text-sm text-gray-400">Last 30 days · all your channels</p>
      </div>
      {PASSES_ENABLED && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Link to={`${BUSINESS_BASE}/customers${search}`} className={button.ghost}>
            All customers
          </Link>
          <Link to={`${BUSINESS_BASE}${search}`} className={button.secondary}>
            Open Business
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      )}
    </div>
  );

  let body: React.ReactNode;
  const data = overview.data;
  if (!PASSES_ENABLED) {
    body = <p className="text-sm text-gray-400">Content passes are not open on BaseTube yet. Your sales will show here once they open.</p>;
  } else if (!data && overview.isLoading) {
    body = (
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2" aria-hidden="true">
        <div>
          <div className={cx(skeleton.line, 'w-28')} />
          <div className={cx(skeleton.block, 'mt-3 h-11 w-52')} />
          <div className={cx(skeleton.line, 'mt-3 w-40')} />
        </div>
        <SkeletonLines lines={4} />
      </div>
    );
  } else if (!data) {
    body = (
      <div className="flex flex-wrap items-center gap-3" role="alert">
        <p className="text-sm text-red-300">{plainApiError(overview.error, 'Your pass sales could not be loaded.').message}</p>
        <button type="button" onClick={() => void overview.refetch()} className={button.secondary}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>
      </div>
    );
  } else if (data.scope.passCount === 0) {
    body = <NextStepPanel step={{ kind: 'no_pass' }} search={search} compact />;
  } else {
    // The last 30 days always have a previous period; the guard keeps a null answer from showing "vs" against nothing.
    const previous = data.previous;
    const label = previous ? period.comparisonLabel : null;
    const allPairs = pairMoneyLines(data.totals.money, previous ? previous.money : []);
    // A currency with nothing in these 30 days gets no big number: one quiet line says so.
    const pairs = allPairs.filter(isActivePair);
    const idle = allPairs.map((pair) => idleCurrencyText(pair, label)).filter((line): line is string => line !== null);
    body = (
      <div className="space-y-6">
        {!data.salesEnabled && <SalesOffBanner reason={data.salesDisabledReason} />}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <Wallet className="h-5 w-5 text-[#fa7517]" aria-hidden="true" />
              {EARNINGS_LABEL}
            </p>
            {pairs.length ? (
              <div className="mt-4 space-y-5">
                {pairs.map((pair) => (
                  <div key={pair.currency} className="min-w-0">
                    <HeroAmount minor={pair.current?.proceeds ?? 0} currency={pair.currency} decimals={pair.decimals} />
                    {label && (
                      <Trend diff={(pair.current?.proceeds ?? 0) - (pair.previous?.proceeds ?? 0)}>
                        {moneyDeltaText(pair.current?.proceeds ?? 0, pair.previous?.proceeds ?? 0, pair.currency, pair.decimals, label)}
                      </Trend>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-3xl font-bold tracking-tight text-gray-400">Nothing yet</p>
                <p className="mt-2 text-sm text-gray-400">No purchase was paid in these 30 days.</p>
              </div>
            )}
            {idle.length > 0 && (
              <ul className="mt-3 space-y-1 text-xs text-gray-400">
                {idle.map((line) => (
                  <li key={line} className="tabular-nums">
                    {line}
                  </li>
                ))}
              </ul>
            )}
            <dl className="mt-6 grid grid-cols-2 gap-6 border-t border-gray-800/50 pt-5">
              <div className="min-w-0">
                <dt className="text-sm text-gray-400">Purchases</dt>
                <dd className="mt-1 text-2xl font-bold tabular-nums text-white">{formatCount(data.totals.purchases)}</dd>
                {label && previous && <dd className="mt-0.5 text-xs text-gray-400">{deltaText(data.totals.purchases, previous.purchases, label)}</dd>}
              </div>
              <div className="min-w-0">
                <dt className="text-sm text-gray-400">Buyers</dt>
                <dd className="mt-1 text-2xl font-bold tabular-nums text-white">{formatCount(data.totals.buyers)}</dd>
                <dd className="mt-0.5 text-xs text-gray-400">
                  {formatCount(data.totals.newBuyers)} new · {formatCount(data.totals.returningBuyers)} returning
                </dd>
              </div>
            </dl>
          </div>

          {noSales ? (
            passes.data ? (
              <NextStepPanel step={nextStep(passes.data.items)} search={search} compact noSalesTitle="No purchase in the last 30 days" />
            ) : null
          ) : (
            <div className="min-w-0 lg:border-l lg:border-gray-800/50 lg:pl-8">
              <p className="text-sm font-medium text-gray-300">Latest customers</p>
              {customers.data && customers.data.items.length ? (
                <ul className={cx(surface.divider, 'mt-2')}>
                  {customers.data.items.map((row) => (
                    <li key={row.customerId} className="flex items-center justify-between gap-3 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Monogram name={row.displayName} />
                        <div className="min-w-0">
                          <Link
                            to={`${BUSINESS_BASE}/customers/${encodeURIComponent(row.customerId)}${search}`}
                            className="block truncate rounded-sm text-sm font-medium text-gray-100 transition-colors hover:text-[#fa7517] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa7517]/50"
                            title={row.displayName}
                          >
                            {row.displayName}
                          </Link>
                          <p className="text-xs text-gray-400">
                            {formatMomentDate(row.lastPurchaseAt)} · {row.isReturning ? 'Returning' : 'New'}
                          </p>
                        </div>
                      </div>
                      <PaidToYou paid={row.paidToYou} />
                    </li>
                  ))}
                </ul>
              ) : customers.isLoading ? (
                <div className="mt-3">
                  <SkeletonLines lines={4} />
                </div>
              ) : (
                <p className="mt-2 text-sm text-gray-400">The latest customers could not be loaded.</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <section className={cx(surface.card, 'p-5 md:p-7')} style={heroGlow} aria-label="Pass sales">
      <div className={sheen} aria-hidden="true" />
      <div className="relative">
        {header}
        {body}
      </div>
    </section>
  );
};

export default PassSalesSummary;
