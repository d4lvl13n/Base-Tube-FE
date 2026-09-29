import React from 'react';
import { catalogTrial, entryPlan } from '../../../hooks/useSubscription';
import type { SubscriptionCatalog } from '../../../types/subscription';
import { formatPlanMoney } from '../../../utils/money';
import { videosPerMonthText } from '../CTREngine/components/billing/PlanChoices';
import { DESIGNER_THUMBNAIL_PRICE, THUMBNAILS_PER_VIDEO } from './landingContent';
import { CountUp } from './motionKit';

/**
 * Four numbers set as type under the hero: the market price of one designer thumbnail, three
 * thumbnails per video, the smallest plan's price and videos, and the free trial. The last two
 * come from GET /subscriptions/plans; a number the catalog does not have is left out.
 */
const NumbersBar: React.FC<{ catalog: SubscriptionCatalog | undefined; loading: boolean }> = ({ catalog, loading }) => {
  const plan = entryPlan(catalog);
  const trial = catalogTrial(catalog);
  const month = plan?.prices.month;
  const cells: Array<{ value: string; unit?: string; label: string } | 'loading'> = [
    { value: DESIGNER_THUMBNAIL_PRICE.price, label: `for one thumbnail from a designer (median of ${DESIGNER_THUMBNAIL_PRICE.quotes} quotes)` },
    { value: String(THUMBNAILS_PER_VIDEO), unit: 'per video', label: 'thumbnail ideas, ready for YouTube’s Test & Compare' },
  ];
  if (loading) cells.push('loading', 'loading');
  if (plan && month) cells.push({ value: formatPlanMoney(month.amountCents, month.currency), unit: '/month', label: `for ${videosPerMonthText(plan.videosPerMonth)}` });
  if (trial) cells.push({ value: String(trial.days), unit: 'days free', label: `with ${trial.videos} video${trial.videos === 1 ? '' : 's'} to try` });

  return (
    <section aria-label="In numbers" className="relative py-16 sm:py-20">
      <dl className="mx-auto grid max-w-7xl grid-cols-2 gap-y-12 px-5 sm:px-8 lg:grid-cols-4 lg:divide-x lg:divide-white/[0.08]">
        {cells.map((cell, index) =>
          cell === 'loading' ? (
            <div key={`loading-${index}`} aria-hidden="true" className="flex flex-col gap-3 lg:px-8">
              <span className="h-12 w-28 animate-pulse rounded-lg bg-white/[0.06]" />
              <span className="h-4 w-40 animate-pulse rounded bg-white/[0.04]" />
            </div>
          ) : (
            <div key={cell.label} className="flex flex-col-reverse gap-3 pr-4 lg:px-8 lg:first:pl-0">
              <dt className="max-w-[15rem] text-sm leading-relaxed text-zinc-400">{cell.label}</dt>
              <dd className="flex items-baseline gap-2">
                <CountUp value={cell.value} className="lp-display text-5xl text-white sm:text-6xl" />
                {cell.unit && <span className="text-base font-medium text-[#fa7517]">{cell.unit}</span>}
              </dd>
            </div>
          ),
        )}
      </dl>
    </section>
  );
};

export default NumbersBar;
