import React from 'react';
import { catalogTrial, entryPlan } from '../../../hooks/useSubscription';
import type { SubscriptionCatalog } from '../../../types/subscription';
import { formatPlanMoney } from '../../../utils/money';
import { videosPerMonthText } from '../CTREngine/components/billing/PlanChoices';
import { DESIGNER_THUMBNAIL_PRICE, THUMBNAILS_PER_VIDEO } from './landingContent';

const LARGE_COLUMNS: Record<number, string> = { 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4' };

/**
 * Four numbers under the hero: the market price of one designer thumbnail,
 * three thumbnails per video, the smallest plan's monthly price and videos, and
 * the free trial. The last two come from GET /subscriptions/plans; while they
 * load their cells wait, and a cell the catalog does not have is left out.
 */
const NumbersBar: React.FC<{ catalog: SubscriptionCatalog | undefined; loading: boolean }> = ({ catalog, loading }) => {
  const plan = entryPlan(catalog);
  const trial = catalogTrial(catalog);
  const month = plan?.prices.month;
  const cells: Array<{ value: string; label: string } | 'loading'> = [
    { value: DESIGNER_THUMBNAIL_PRICE.price, label: `one designer thumbnail (median of ${DESIGNER_THUMBNAIL_PRICE.quotes} quotes)` },
    { value: String(THUMBNAILS_PER_VIDEO), label: 'thumbnails per video, ready for Test & Compare' },
  ];
  if (loading) cells.push('loading', 'loading');
  if (plan && month) cells.push({ value: `${formatPlanMoney(month.amountCents, month.currency)}/month`, label: videosPerMonthText(plan.videosPerMonth) });
  if (trial) cells.push({ value: `${trial.days} days free`, label: `${trial.videos} video${trial.videos === 1 ? '' : 's'} to try` });

  return (
    <section aria-label="In numbers" className="border-y border-white/[0.06] bg-white/[0.02]">
      <dl className={`mx-auto grid max-w-7xl grid-cols-2 gap-px px-4 sm:px-6 lg:px-8 ${LARGE_COLUMNS[Math.min(cells.length, 4)] ?? ''}`}>
        {cells.map((cell, index) =>
          cell === 'loading' ? (
            <div key={`loading-${index}`} aria-hidden="true" className="flex flex-col items-center gap-2 px-4 py-8">
              <span className="h-8 w-24 animate-pulse rounded-lg bg-white/[0.06]" />
              <span className="h-4 w-32 animate-pulse rounded bg-white/[0.04]" />
            </div>
          ) : (
            <div key={cell.label} className="flex flex-col-reverse items-center gap-1 px-4 py-8 text-center">
              <dt className="max-w-[16rem] text-sm text-zinc-400">{cell.label}</dt>
              <dd className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{cell.value}</dd>
            </div>
          ),
        )}
      </dl>
    </section>
  );
};

export default NumbersBar;
