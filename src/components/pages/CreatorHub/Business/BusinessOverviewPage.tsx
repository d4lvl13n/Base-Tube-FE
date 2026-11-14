import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Ticket } from 'lucide-react';
import { useAllBusinessPasses, useBusinessOverview, useBusinessSources } from '../../../../hooks/useCreatorBusiness';
import type { PassRow, SourceRow } from '../../../../types/creatorBusiness';
import { CountTiles, EarningsPanel, FunnelPanel } from './BusinessBlocks';
import { formatCount, formatMinor, formatMoment, nextStep, plural } from './businessFormat';
import {
  BUSINESS_BASE,
  BusinessHeader,
  BusinessTabs,
  BusinessToolbar,
  FiguresAsOf,
  NextStepPanel,
  Panel,
  PASSES_ENABLED,
  PassesUnavailable,
  SalesOffBanner,
  ScopedError,
  SkeletonHero,
  SkeletonLines,
  SkeletonPanel,
  SkeletonTiles,
  StaleNotice,
} from './BusinessUi';
import { useBusinessScope } from './useBusinessScope';
import SellingReadinessPanel from './SellingReadinessPanel';
import { cx, frame, text } from './businessStyles';

/** Earnings of one row, one line per currency; a dash when nothing was paid. */
export const EarningsList: React.FC<{ money: Array<{ currency: string; decimals: number; proceeds: number }>; className?: string }> = ({
  money,
  className,
}) =>
  money.length ? (
    <span className={cx('flex flex-col items-end', className)}>
      {money.map((m) => (
        <span key={m.currency} className="whitespace-nowrap text-sm font-semibold tabular-nums text-white">
          {formatMinor(m.proceeds, m.currency, m.decimals)}
        </span>
      ))}
    </span>
  ) : (
    <span className={cx('text-sm text-gray-500', className)}>
      —<span className="sr-only">nothing paid</span>
    </span>
  );

interface RankedRow {
  key: string;
  title: string;
  href: string;
  meta: string;
  money: Array<{ currency: string; decimals: number; proceeds: number }>;
  weight: number;
}

/** A short ranked list: name, two counts, earnings, and a thin bar for the purchases. */
const RankedList: React.FC<{ rows: RankedRow[] }> = ({ rows }) => {
  const max = Math.max(1, ...rows.map((r) => r.weight));
  return (
    <ol className="space-y-4">
      {rows.map((row, index) => (
        <li key={row.key} className="min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 gap-3">
              <span className="w-4 shrink-0 pt-0.5 text-xs tabular-nums text-gray-500" aria-hidden="true">
                {index + 1}
              </span>
              <div className="min-w-0">
                <Link
                  to={row.href}
                  className="block truncate rounded-sm text-sm font-medium text-gray-100 transition-colors hover:text-[#fa7517] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa7517]/50"
                  title={row.title}
                >
                  {row.title}
                </Link>
                <p className="mt-0.5 text-xs text-gray-400">{row.meta}</p>
              </div>
            </div>
            <EarningsList money={row.money} className="shrink-0" />
          </div>
          <div className="ml-7 mt-2 h-1 overflow-hidden rounded-full bg-white/[0.04]" aria-hidden="true">
            <div className="h-full rounded-full bg-[#fa7517]/70" style={{ width: `${Math.max(2, (row.weight / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ol>
  );
};

const TopPasses: React.FC<{ rows: PassRow[] | undefined; loading: boolean; search: string }> = ({ rows, loading, search }) => {
  const top = (rows ?? [])
    .filter((row) => row.totals.purchases > 0)
    .sort((a, b) => b.totals.purchases - a.totals.purchases || b.totals.buyers - a.totals.buyers)
    .slice(0, 5);
  return (
    <Panel
      title="Top passes"
      icon={Ticket}
      action={
        <Link to={`${BUSINESS_BASE}/passes${search}`} className={cx(text.link, 'text-sm')}>
          All passes
        </Link>
      }
    >
      {loading && !rows ? (
        <SkeletonLines lines={4} />
      ) : top.length ? (
        <RankedList
          rows={top.map((row) => ({
            key: row.passId,
            title: row.title,
            href: `/creator-hub/passes/${row.passId}${search}`,
            meta: `${plural(row.totals.purchases, 'purchase', 'purchases')} · ${plural(row.totals.buyers, 'buyer', 'buyers')}`,
            money: row.totals.money,
            weight: row.totals.purchases,
          }))}
        />
      ) : (
        <p className="text-sm text-gray-400">No pass was sold in these days.</p>
      )}
    </Panel>
  );
};

const TopSources: React.FC<{ rows: SourceRow[] | undefined; loading: boolean; search: string }> = ({ rows, loading, search }) => {
  const top = (rows ?? []).filter((row) => row.paidPurchases > 0).slice(0, 5);
  return (
    <Panel
      title="Top sources"
      icon={Compass}
      action={
        <Link to={`${BUSINESS_BASE}/sources${search}`} className={cx(text.link, 'text-sm')}>
          All sources
        </Link>
      }
    >
      {loading && !rows ? (
        <SkeletonLines lines={4} />
      ) : top.length ? (
        <RankedList
          rows={top.map((row) => ({
            key: row.key,
            title: row.label,
            href: `${BUSINESS_BASE}/sources${search}`,
            meta: `${plural(row.paidPurchases, 'purchase', 'purchases')} · ${plural(row.buyers, 'buyer', 'buyers')}`,
            money: row.money,
            weight: row.paidPurchases,
          }))}
        />
      ) : (
        <p className="text-sm text-gray-400">
          No purchase in these days has a source yet.{' '}
          <Link to={`${BUSINESS_BASE}/sources${search}#tag-links`} className={text.link}>
            Tag your links
          </Link>{' '}
          to see where buyers come from.
        </p>
      )}
    </Panel>
  );
};

/**
 * Business → Overview: what the creator earned (per currency, with its
 * chart), purchases, buyers, holders, the funnel, top passes and sources.
 * How each number is counted lives on the help page (HELP_PATH). Every number
 * comes from GET /creator/business/overview (+ passes, sources for the two
 * short lists).
 */
const BusinessOverviewPage: React.FC = () => {
  const scope = useBusinessScope();
  const overview = useBusinessOverview(scope.apiParams, { enabled: PASSES_ENABLED });
  const passes = useAllBusinessPasses(scope.apiParams, { enabled: PASSES_ENABLED });
  const sources = useBusinessSources(scope.apiParams, { enabled: PASSES_ENABLED });
  const search = scope.linkSearch();
  const data = overview.data;

  let body: React.ReactNode;
  if (!PASSES_ENABLED) {
    body = <PassesUnavailable />;
  } else if (!data && overview.isLoading) {
    body = (
      <div className="space-y-6" aria-busy="true">
        <SkeletonHero />
        <SkeletonTiles count={4} />
        <SkeletonPanel lines={5} />
      </div>
    );
  } else if (!data) {
    body = <ScopedError error={overview.error} onRetry={() => void overview.refetch()} scope={scope} what="your business numbers" />;
  } else if (data.scope.passCount === 0) {
    body = <NextStepPanel step={{ kind: 'no_pass' }} search={search} />;
  } else {
    // All time has no previous period (the API sends null): no comparison is shown.
    const previous = data.previous;
    const comparison = previous ? scope.period.comparisonLabel : null;
    body = (
      <div
        className={cx('space-y-6 transition-opacity motion-reduce:transition-none', overview.isPlaceholderData && 'opacity-60')}
        aria-busy={overview.isFetching}
      >
        {overview.isError && <StaleNotice onRetry={() => void overview.refetch()} />}
        {!data.salesEnabled && <SalesOffBanner reason={data.salesDisabledReason} />}
        {data.totals.purchases === 0 && passes.data && <NextStepPanel step={nextStep(passes.data.items)} search={search} />}

        <EarningsPanel totals={data.totals} previous={previous} comparisonLabel={comparison} daily={data.daily} granularity={data.granularity} />
        <CountTiles
          totals={data.totals}
          previous={previous}
          comparisonLabel={comparison}
          holdersNow={data.holdersNow}
          neverOpenedHref={`${BUSINESS_BASE}/customers${scope.linkSearch({ opened: 'never' })}`}
        />
        {/* Wide screens: the funnel and the two short lists in one row. */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 2xl:grid-cols-3">
          <div className="min-w-0 lg:col-span-2 2xl:col-span-1">
            <FunnelPanel funnel={data.funnel} />
          </div>
          <TopPasses rows={passes.data?.items} loading={passes.isLoading} search={search} />
          <TopSources rows={sources.data?.sources} loading={sources.isLoading} search={search} />
        </div>
        <FiguresAsOf>
          Figures as of {formatMoment(data.generatedAt)} (up to a minute old) · {formatCount(data.scope.passCount)}{' '}
          {data.scope.passCount === 1 ? 'pass' : 'passes'} counted.
        </FiguresAsOf>
      </div>
    );
  }

  return (
    <div className={frame.page}>
      <div className={frame.business}>
        <BusinessHeader title="Business" subtitle="Your earnings, your buyers, and where they come from." />
        <BusinessTabs search={search} />
        {PASSES_ENABLED && <BusinessToolbar scope={scope} apiChannels={data?.scope.channels} range={data?.range} />}
        {PASSES_ENABLED && <SellingReadinessPanel channelId={scope.scope.channelId} />}
        {body}
      </div>
    </div>
  );
};

export default BusinessOverviewPage;
