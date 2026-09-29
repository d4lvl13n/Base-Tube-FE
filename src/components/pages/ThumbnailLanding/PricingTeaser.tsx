import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { MySubscription, SubscriptionCatalog } from '../../../types/subscription';
import { PlanChoices } from '../CTREngine/components/billing/PlanChoices';
import { RevealHeading } from './motionKit';

const LANDING_PATH = '/ai-thumbnails';

/**
 * The three plans from GET /subscriptions/plans, with the pricing page's own
 * plan cards and buttons (the free trial, checkout, the current plan), then
 * the way to the full pricing page with the credit packs.
 */
const PricingTeaser: React.FC<{
  catalog: SubscriptionCatalog | undefined;
  loading: boolean;
  signedIn: boolean;
  me: MySubscription | undefined;
  meLoading: boolean;
}> = ({ catalog, loading, signedIn, me, meLoading }) => (
  <section id="pricing" aria-labelledby="landing-pricing-title" className="scroll-mt-16 border-t border-white/[0.06] py-24 sm:py-32">
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      <div className="max-w-2xl">
        <RevealHeading
          id="landing-pricing-title"
          className="lp-heading text-4xl text-white sm:text-5xl"
          parts={['The price of ', { accent: 'one designer thumbnail' }, ', for your whole month.']}
        />
        {catalog && (
          <p className="mt-5 text-lg text-zinc-400">
            Plans are counted in videos. Each video is {catalog.videoBreakdown.concepts} ideas, {catalog.videoBreakdown.edits} edits and{' '}
            {catalog.videoBreakdown.audits === 1 ? 'a review' : `${catalog.videoBreakdown.audits} reviews`}.
          </p>
        )}
      </div>
      <div className="mt-10">
        {catalog ? (
          <PlanChoices
            catalog={catalog}
            me={me}
            meLoading={meLoading}
            signedIn={signedIn}
            variant="page"
            context={{}}
            signUpReturnPath={LANDING_PATH}
          />
        ) : loading ? (
          <div role="status" aria-label="Loading plans" className="grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((card) => (
              <div key={card} className="h-80 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.03]" />
            ))}
          </div>
        ) : null}
      </div>
      <p className="mt-8 text-center">
        <Link to="/ai-thumbnails/pricing" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#fb923c] hover:text-orange-300">
          See all plans and credit packs
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </p>
    </div>
  </section>
);

export default PricingTeaser;
