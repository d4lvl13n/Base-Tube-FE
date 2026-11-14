import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Compass, PlayCircle, Users } from 'lucide-react';
import { useBusinessPass, usePassVideoWatch } from '../../../../hooks/useCreatorBusiness';
import type { PassVideoStat } from '../../../../types/creatorBusiness';
import { plainApiError } from '../../../../utils/plainApiError';
import { CountTiles, EarningsPanel, FunnelPanel } from './BusinessBlocks';
import {
  averageWatchedText,
  formatCount,
  formatMomentDate,
  playsText,
  plural,
  previewText,
  saleState,
  watchPeriodFor,
} from './businessFormat';
import type { PeriodPreset } from './businessPeriod';
import {
  BUSINESS_BASE,
  BusinessToolbar,
  HelpLink,
  NextStepPanel,
  Panel,
  PASSES_ENABLED,
  SalesOffBanner,
  SaleStateNotice,
  ScopedError,
  SkeletonHero,
  SkeletonLines,
  SkeletonTiles,
} from './BusinessUi';
import { SourcesTable } from './SourcesPage';
import { periodParams, useBusinessScope } from './useBusinessScope';
import { button, cx, surface, text } from './businessStyles';

/**
 * The business numbers of one pass, read once for the whole pass page: the
 * Performance section and the per-video "opened by" lines share this query.
 * A pass belongs to one channel, so only the period applies.
 */
export function usePassPerformance(passId: string | undefined) {
  const scope = useBusinessScope();
  const params = useMemo(() => periodParams(scope.period), [scope.period]);
  const query = useBusinessPass(PASSES_ENABLED ? passId : undefined, params);
  const videoStats = useMemo(() => {
    const map = new Map<string, PassVideoStat>();
    (query.data?.videos ?? []).forEach((v) => map.set(v.videoId, v));
    return map;
  }, [query.data]);
  return { scope, query, videoStats };
}

/** "Opened by 3 of 5 holders" for one video of the pass (holders right now). */
export const openedByText = (stat: PassVideoStat): string =>
  stat.holders === 0 ? 'No holder yet' : `Opened by ${formatCount(stat.openedBy)} of ${formatCount(stat.holders)} ${stat.holders === 1 ? 'holder' : 'holders'}`;

const PERIOD_WORDS = { '7d': 'the last 7 days', '30d': 'the last 30 days', '90d': 'the last 90 days', all: 'all time' } as const;

/** Share of holders who started a video, as a thin bar (nothing when nobody holds the pass). */
const StartedBar: React.FC<{ started: number; of: number }> = ({ started, of }) =>
  of > 0 ? (
    <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.05]" aria-hidden="true">
      <div className="h-full rounded-full bg-[#fa7517]/80" style={{ width: `${Math.min(100, Math.max(started > 0 ? 2 : 0, (started / of) * 100))}%` }} />
    </div>
  ) : null;

/**
 * Plays of this pass's videos by its buyers: started, finished, average
 * watched and watch time, from GET /creators/channels/:id/pass-videos/watch.
 * Aggregates only (averages withheld under 5 buyers). The creator's own
 * previews are shown apart and never counted as buyers.
 */
const PassPlaysPanel: React.FC<{
  passId: string;
  channelId: number;
  videoStats: Map<string, PassVideoStat>;
  preset: PeriodPreset;
}> = ({ passId, channelId, videoStats, preset }) => {
  const choice = watchPeriodFor(preset);
  const params = useMemo(() => ({ period: choice.period, passId }), [choice.period, passId]);
  const watch = usePassVideoWatch(channelId, params, { enabled: PASSES_ENABLED });
  const data = watch.data;
  const passRow = data?.passes.find((p) => p.passId === passId) ?? null;
  const videos = (data?.videos ?? []).filter((v) => v.passId === passId);
  const since = data ? formatMomentDate(data.measuredSince) : '';

  let body: React.ReactNode;
  if (!data && watch.isLoading) {
    body = <SkeletonLines lines={4} />;
  } else if (!data) {
    body = (
      <p className="text-sm text-gray-300" role="alert">
        {plainApiError(watch.error, 'The plays of these videos could not be loaded.').message}{' '}
        <button type="button" className={text.link} onClick={() => void watch.refetch()}>
          Try again
        </button>
      </p>
    );
  } else {
    const buyers = passRow?.buyersWithAccess ?? 0;
    const passPreview = passRow ? previewText(passRow) : null;
    const videoPreviews = videos
      .map((v, index) => ({ id: v.passVideoId, title: v.title || `Video ${index + 1}`, text: previewText(v) }))
      .filter((v) => v.text);
    body = (
      <div className="space-y-5">
        {passRow && (
          <div className={cx(surface.inset, 'p-4')}>
            <p className="text-xs font-medium text-gray-400">Whole pass (at least one video)</p>
            <p className="mt-1.5 text-base font-semibold text-white">{playsText(passRow, buyers)}</p>
            <StartedBar started={passRow.buyersStarted} of={buyers} />
            <p className="mt-2 text-xs text-gray-300">{averageWatchedText(passRow, data.minBuyersForAverages)}</p>
            <p className="mt-0.5 text-xs text-gray-400">{plural(passRow.completions, 'video finished', 'videos finished')} in total</p>
          </div>
        )}
        {videos.length ? (
          <ul className={surface.divider}>
            {videos.map((v, index) => {
              const opened = videoStats.get(v.passVideoId);
              return (
                <li key={v.passVideoId} className="py-3 first:pt-0 last:pb-0">
                  <p className="truncate text-sm font-medium text-gray-100" title={v.title ?? undefined}>
                    {v.title || `Video ${index + 1}`}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-300">{playsText(v, buyers)}</p>
                  <StartedBar started={v.buyersStarted} of={buyers} />
                  <p className="mt-1.5 text-xs text-gray-400">
                    {averageWatchedText(v, data.minBuyersForAverages)}
                    {opened ? ` · ${openedByText(opened)} now` : ''}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-gray-400">This pass has no video yet.</p>
        )}
        {(passPreview || videoPreviews.length > 0) && (
          <div className="rounded-lg border border-dashed border-gray-800 p-3 text-xs">
            <p className="font-medium text-gray-300">Your own previews (never counted as buyers)</p>
            {passPreview && <p className="mt-1 text-gray-400">Whole pass: {passPreview}</p>}
            {videoPreviews.length > 0 && (
              <ul className="mt-1 space-y-0.5 text-gray-400">
                {videoPreviews.map((v) => (
                  <li key={v.id} className="truncate" title={v.title}>
                    {v.title}: {v.text}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <Panel title="Plays by buyers" icon={PlayCircle}>
      {body}
      {/* Only what prevents a wrong reading of these numbers; the definitions are on the help page. */}
      <p className="mt-5 border-t border-gray-800/50 pt-3 text-xs leading-relaxed text-gray-400">
        {choice.exact
          ? `Plays cover ${PERIOD_WORDS[choice.period]}.`
          : 'Plays exist for 7, 30 or 90 days or all time only: these cover all time.'}
        {data ? (since ? ` Recorded since ${since}.` : ' Plays are not recorded yet.') : ''}
      </p>
    </Panel>
  );
};

interface Props {
  passId: string;
  perf: ReturnType<typeof usePassPerformance>;
  /** Videos in the pass now (tells an empty pass, which the creator can fix, from a blocked one). */
  videoCount?: number;
}

/** What one pass earned, per currency, over time; its funnel, plays and sources. */
const PassPerformanceSection: React.FC<Props> = ({ passId, perf, videoCount }) => {
  const { scope, query, videoStats } = perf;
  const data = query.data;
  const search = scope.linkSearch();
  const customersHref = `${BUSINESS_BASE}/customers${scope.linkSearch({ pass: passId })}`;

  if (!PASSES_ENABLED) return null;

  let body: React.ReactNode;
  if (!data && query.isLoading) {
    body = (
      <div className="space-y-6">
        <SkeletonHero />
        <SkeletonTiles count={4} />
      </div>
    );
  } else if (!data) {
    body = <ScopedError error={query.error} onRetry={() => void query.refetch()} scope={scope} what="this pass's numbers" />;
  } else {
    // All time has no previous period (the API sends null): no comparison is shown.
    const previous = data.previous;
    const comparison = previous ? scope.period.comparisonLabel : null;
    const sale = saleState(data.pass, { videoCount });
    body = (
      <div
        className={cx('space-y-6 transition-opacity motion-reduce:transition-none', query.isPlaceholderData && 'opacity-60')}
        aria-busy={query.isFetching}
      >
        {!data.salesEnabled && <SalesOffBanner reason={data.salesDisabledReason} />}
        {/* The platform switch is said once, by the banner; any other block is said here with what fixes it. */}
        {data.salesEnabled && <SaleStateNotice state={sale} pass={data.pass} />}
        {data.totals.purchases === 0 && sale.onSale && (
          <NextStepPanel
            step={{ kind: 'share', passId: data.pass.passId, title: data.pass.title, publicUrl: data.pass.publicUrl }}
            noSalesTitle="No purchase of this pass in these days yet"
            search={search}
            compact
          />
        )}
        <EarningsPanel totals={data.totals} previous={previous} comparisonLabel={comparison} daily={data.daily} granularity={data.granularity} />
        <CountTiles
          totals={data.totals}
          previous={previous}
          comparisonLabel={comparison}
          holdersNow={data.holdersNow}
          neverOpenedHref={`${BUSINESS_BASE}/customers${scope.linkSearch({ pass: passId, opened: 'never' })}`}
        />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <FunnelPanel funnel={data.funnel} title="From visit to purchase" />
          <PassPlaysPanel passId={passId} channelId={data.pass.channelId} videoStats={videoStats} preset={scope.period.preset} />
        </div>
        {data.sources.sources.length ? (
          <section className="space-y-3" aria-labelledby="pass-sources-title">
            <h3 id="pass-sources-title" className={cx(text.cardTitle, 'flex items-center gap-2')}>
              <Compass className="h-4 w-4 text-[#fa7517]" aria-hidden="true" />
              Sources
            </h3>
            <SourcesTable block={data.sources} />
          </section>
        ) : (
          <Panel title="Sources" icon={Compass}>
            <p className="text-sm text-gray-400">No visit, checkout or purchase of this pass in these days.</p>
          </Panel>
        )}
        {data.videosTruncated && <p className="text-xs text-gray-400">This pass has more than 500 videos: “opened by” covers the first 500.</p>}
      </div>
    );
  }

  return (
    <section className="space-y-5" aria-labelledby="pass-performance-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="pass-performance-heading" className="text-xl font-semibold text-white">
          Performance
        </h2>
        <div className="flex flex-wrap items-center gap-4">
          <HelpLink search={search} />
          <Link to={customersHref} className={button.secondary}>
            <Users className="h-4 w-4" aria-hidden="true" />
            Customers of this pass
          </Link>
        </div>
      </div>
      <BusinessToolbar scope={scope} showChannel={false} range={data?.range} />
      {body}
    </section>
  );
};

export default PassPerformanceSection;
