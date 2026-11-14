import React from 'react';
import { Link } from 'react-router-dom';
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDown, EyeOff, Filter, Minus, ShoppingBag, Ticket, TrendingDown, TrendingUp, Users, Wallet } from 'lucide-react';
import type { DailyPoint, Funnel, Granularity, HoldersNow, MoneyLine, Totals } from '../../../../types/creatorBusiness';
import StatsCard from '../StatsCard';
import {
  EARNINGS_LABEL,
  currencySeries,
  deltaText,
  formatCount,
  formatMinor,
  funnelView,
  idleCurrencyText,
  isActivePair,
  moneyDeltaText,
  pairMoneyLines,
  plural,
  quietMoneyLines,
  splitMoney,
  type ChartDay,
  type CurrencySeries,
  type MoneyPair,
} from './businessFormat';
import { formatDay, perPointLabel, pointName, pointTick } from './businessPeriod';
import { Panel } from './BusinessUi';
import { ACCENT, chart, cx, heroGlow, pillClass, sheen, surface, text } from './businessStyles';

// --- Money: the hero ---------------------------------------------------------------

/** "EUR 1,234.50" with the code small and the number large: the one number the creator reads first. Code first, always. */
export const HeroAmount: React.FC<{ minor: number; currency: string; decimals: number; size?: 'hero' | 'value' }> = ({
  minor,
  currency,
  decimals,
  size = 'hero',
}) => {
  const parts = splitMoney(minor, currency, decimals);
  return (
    <p className={cx(size === 'hero' ? text.hero : text.value, 'flex min-w-0 items-baseline gap-2')} title={formatMinor(minor, currency, decimals)}>
      <span className={cx('font-semibold tracking-normal text-gray-400', size === 'hero' ? 'text-base sm:text-lg' : 'text-sm')}>{parts.code}</span>
      <span className="min-w-0 truncate">{parts.amount}</span>
    </p>
  );
};

/** "+EUR 12.00 (+40%) vs previous 30 days", with a small arrow in the direction it moved. */
const MoneyDelta: React.FC<{ pair: MoneyPair; comparisonLabel: string }> = ({ pair, comparisonLabel }) => {
  const current = pair.current?.proceeds ?? 0;
  const before = pair.previous?.proceeds ?? 0;
  const diff = current - before;
  const Icon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
  return (
    <p className="mt-3 flex items-center gap-1.5 text-sm text-gray-400">
      <Icon className={cx('h-4 w-4 shrink-0', diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-red-400' : 'text-gray-500')} aria-hidden="true" />
      <span className="min-w-0 tabular-nums">{moneyDeltaText(current, before, pair.currency, pair.decimals, comparisonLabel)}</span>
    </p>
  );
};

const ChartTooltip: React.FC<{ active?: boolean; payload?: Array<{ payload: ChartDay }>; series: CurrencySeries; granularity: Granularity }> = ({
  active,
  payload,
  series,
  granularity,
}) => {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;
  return (
    <div className={chart.tooltip}>
      <p className="text-gray-400">{pointName(point.day, point.end, granularity)}</p>
      <p className="mt-1 font-semibold tabular-nums text-white">
        {EARNINGS_LABEL}: {formatMinor(point.proceedsMinor, series.currency, series.decimals)}
      </p>
      <p className="tabular-nums text-gray-300">Purchases: {formatCount(point.purchases)}</p>
    </div>
  );
};

const CurrencyChart: React.FC<{ series: CurrencySeries; granularity: Granularity }> = ({ series, granularity }) => {
  const total = series.days.reduce((sum, d) => sum + d.proceedsMinor, 0);
  const purchases = series.days.reduce((sum, d) => sum + d.purchases, 0);
  const first = series.days[0]?.day;
  const last = series.days[series.days.length - 1]?.end;
  const summary = `${EARNINGS_LABEL} ${perPointLabel(granularity)} in ${series.currency}${
    first && last ? ` from ${formatDay(first)} to ${formatDay(last)}` : ''
  }: ${formatMinor(total, series.currency, series.decimals)} in total over ${plural(purchases, 'purchase', 'purchases')}.`;
  return (
    <div className="h-52 w-full" role="img" aria-label={summary}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={series.days} margin={{ top: 8, right: 0, bottom: 0, left: -8 }}>
          <CartesianGrid stroke={chart.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="day"
            stroke={chart.axis}
            tick={chart.tick}
            tickLine={false}
            axisLine={{ stroke: chart.grid }}
            minTickGap={24}
            tickFormatter={(day: string) => pointTick(day, granularity)}
          />
          <YAxis
            yAxisId="money"
            stroke={chart.axis}
            tick={chart.tick}
            tickLine={false}
            axisLine={false}
            width={52}
            tickFormatter={(value: number) => new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 2 }).format(value)}
          />
          <YAxis yAxisId="count" orientation="right" stroke={chart.axis} tick={chart.tick} tickLine={false} axisLine={false} allowDecimals={false} width={24} />
          <Tooltip cursor={{ fill: 'rgba(250,117,23,0.06)' }} content={<ChartTooltip series={series} granularity={granularity} />} />
          <Bar yAxisId="money" dataKey="proceeds" fill={ACCENT} radius={[4, 4, 0, 0]} maxBarSize={22} isAnimationActive={false} />
          <Line yAxisId="count" dataKey="purchases" type="monotone" stroke={chart.secondary} strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

const QuietLines: React.FC<{ line: MoneyLine | null }> = ({ line }) => {
  const lines = line ? quietMoneyLines(line) : [];
  if (!lines.length) return null;
  return (
    <ul className="mt-4 space-y-1 border-t border-gray-800/50 pt-3 text-xs text-gray-400">
      {lines.map((entry) => (
        <li key={entry} className="tabular-nums">
          {entry}
        </li>
      ))}
    </ul>
  );
};

interface EarningsPanelProps {
  totals: Totals;
  /** null for all time: no comparison is shown. */
  previous: Totals | null;
  comparisonLabel: string | null;
  daily: DailyPoint[];
  granularity: Granularity;
}

/**
 * The screen's hero: what the creator earned, one big number per currency
 * (never added together), how it moved, the chart of it, and — quietly — the
 * refunds and disputes that explain a dip. No fees, no gross, no net.
 */
export const EarningsPanel: React.FC<EarningsPanelProps> = ({ totals, previous, comparisonLabel, daily, granularity }) => {
  const compareWith = previous ? comparisonLabel : null;
  const allPairs = pairMoneyLines(totals.money, previous ? previous.money : []);
  // A currency with nothing in these days gets no block and no chart: one quiet line says so.
  const pairs = allPairs.filter(isActivePair);
  const idle = allPairs.map((pair) => idleCurrencyText(pair, compareWith)).filter((line): line is string => line !== null);
  const series = currencySeries(daily);
  const seriesFor = (currency: string) => series.find((s) => s.currency === currency) ?? null;
  const multi = pairs.length > 1;

  return (
    <section className={cx(surface.card, 'p-5 md:p-7')} style={heroGlow} aria-labelledby="earnings-title">
      <div className={sheen} aria-hidden="true" />
      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="earnings-title" className="flex items-center gap-2 text-sm font-medium text-gray-300">
            <Wallet className="h-5 w-5 text-[#fa7517]" aria-hidden="true" />
            {EARNINGS_LABEL}
          </h2>
          {pairs.length > 0 && series.length > 0 && (
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400" aria-hidden="true">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: ACCENT }} />
                {EARNINGS_LABEL} {perPointLabel(granularity)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-3" style={{ background: chart.secondary }} />
                Purchases
              </span>
            </p>
          )}
        </div>

        {pairs.length === 0 ? (
          <div className="mt-5">
            <p className="text-3xl font-bold tracking-tight text-gray-400">Nothing yet</p>
            <p className="mt-2 text-sm text-gray-400">No purchase was paid in these days.</p>
          </div>
        ) : (
          <div
            className={cx(
              'mt-5 grid grid-cols-1 gap-6',
              multi && 'lg:grid-cols-2',
              pairs.length >= 3 && '2xl:grid-cols-3',
            )}
          >
            {pairs.map((pair) => {
              const s = seriesFor(pair.currency);
              return (
                <div key={pair.currency} className={cx('min-w-0', multi && cx(surface.inset, 'p-4 md:p-5'))}>
                  <HeroAmount minor={pair.current?.proceeds ?? 0} currency={pair.currency} decimals={pair.decimals} />
                  {compareWith && <MoneyDelta pair={pair} comparisonLabel={compareWith} />}
                  {s && (
                    <div className="mt-6">
                      <CurrencyChart series={s} granularity={granularity} />
                    </div>
                  )}
                  <QuietLines line={pair.current} />
                </div>
              );
            })}
          </div>
        )}
        {idle.length > 0 && (
          <ul className="mt-4 space-y-1 text-xs text-gray-400">
            {idle.map((line) => (
              <li key={line} className="tabular-nums">
                {line}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

// --- Counts ------------------------------------------------------------------------

interface CountTilesProps {
  totals: Totals;
  previous: Totals | null;
  comparisonLabel: string | null;
  holdersNow: HoldersNow;
  /** Link to the customers who have not opened anything (keeps the scope). */
  neverOpenedHref?: string;
}

/** Four StatsCards, the very card of Analytics: purchases, buyers, active holders, not opened yet. */
export const CountTiles: React.FC<CountTilesProps> = ({ totals, previous, comparisonLabel, holdersNow, neverOpenedHref }) => {
  const delta = (current: number, before: number) => (comparisonLabel && previous ? deltaText(current, before, comparisonLabel) : undefined);
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        icon={ShoppingBag}
        title="Purchases"
        value={formatCount(totals.purchases)}
        subtitle={plural(totals.units, 'pass sold', 'passes sold')}
        note={delta(totals.purchases, previous?.purchases ?? 0)}
      />
      <StatsCard
        icon={Users}
        title="Buyers"
        value={formatCount(totals.buyers)}
        subtitle={`${formatCount(totals.newBuyers)} new · ${formatCount(totals.returningBuyers)} returning`}
        note={delta(totals.buyers, previous?.buyers ?? 0)}
      />
      <StatsCard icon={Ticket} title="Active holders" value={formatCount(holdersNow.activeHolders)} subtitle="Can open a pass right now" />
      <StatsCard
        icon={EyeOff}
        title="Not opened yet"
        value={formatCount(holdersNow.neverOpened)}
        subtitle={`Of ${plural(holdersNow.activeHolders, 'active holder', 'active holders')}`}
        footer={
          neverOpenedHref && holdersNow.neverOpened > 0 ? (
            <Link to={neverOpenedHref} className={text.link}>
              See who
            </Link>
          ) : undefined
        }
      />
    </div>
  );
};

// --- Funnel ------------------------------------------------------------------------------

/** One bar per step; the outcome (Paid) in full orange, the steps before it fainter. */
const STEP_OPACITY: Record<string, number> = { visits: 0.3, uniqueVisitors: 0.45, checkoutsStarted: 0.65, paid: 1 };

const STEP_GRID = 'grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)_auto] items-center gap-3 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)_auto] sm:gap-5';

const Connector: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className={cx(STEP_GRID, 'py-0.5')}>
    <span aria-hidden="true" />
    <span className="flex items-center gap-1.5 text-xs text-gray-400">
      <ArrowDown className="h-3.5 w-3.5 shrink-0 text-[#fa7517]/70" aria-hidden="true" />
      {children}
    </span>
    <span aria-hidden="true" />
  </div>
);

export function visitsNote(funnel: Pick<Funnel, 'visitCountingSince' | 'visitsCoverWholeRange'>): string {
  if (!funnel.visitCountingSince) return 'Visits to your pass pages are not counted yet.';
  if (!funnel.visitsCoverWholeRange) return `Visits counted since ${formatDay(funnel.visitCountingSince)} only: earlier days have no visit numbers.`;
  return `Visits counted since ${formatDay(funnel.visitCountingSince)}.`;
}

/** Visits → unique visitors → checkouts started → paid, as proportional bars with the conversion between steps. */
export const FunnelPanel: React.FC<{ funnel: Funnel; title?: string }> = ({ funnel, title = 'From visit to purchase' }) => {
  const view = funnelView(funnel);
  return (
    <Panel title={title} icon={Filter} action={view.headline ? <span className={pillClass('accent', 'text-xs')}>{view.headline}</span> : undefined}>
      <ol className="space-y-1" aria-label="Steps from visit to purchase">
        {view.steps.map((step) => (
          <li key={step.key}>
            {step.key === 'checkoutsStarted' && view.toCheckout && <Connector>{view.toCheckout}</Connector>}
            {step.key === 'paid' && view.toPaid && <Connector>{view.toPaid}</Connector>}
            <div className={cx(STEP_GRID, 'py-1.5')}>
              <span className={cx('truncate text-sm', step.key === 'paid' ? 'font-medium text-white' : 'text-gray-300')}>{step.label}</span>
              <span className="h-2.5 overflow-hidden rounded-full bg-white/[0.04]" aria-hidden="true">
                <span
                  className="block h-full rounded-full bg-[#fa7517] transition-[width] duration-500 ease-out motion-reduce:transition-none"
                  style={{ width: `${step.width}%`, opacity: STEP_OPACITY[step.key] }}
                />
              </span>
              <span
                className={cx(
                  'min-w-[3.5rem] text-right tabular-nums',
                  step.value === null ? 'text-xs text-gray-400' : 'text-sm font-semibold text-white',
                )}
              >
                {step.value === null ? 'Not counted yet' : formatCount(step.value)}
              </span>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-4 space-y-1 border-t border-gray-800/50 pt-3 text-xs leading-relaxed text-gray-400">
        {view.abandoned && <p>{view.abandoned}</p>}
        <p>{visitsNote(funnel)}</p>
      </div>
    </Panel>
  );
};
