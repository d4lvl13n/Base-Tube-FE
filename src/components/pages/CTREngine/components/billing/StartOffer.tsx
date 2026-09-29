// The main "start" button of the AI Thumbnails landing page, from the plan
// catalog and the account's plan: "Start 7-day free trial" for a visitor or an
// account that never had a plan (Creator monthly), the plan with its price when
// there is no trial, "Open the Studio" once the account has a plan. One click:
// a visitor goes to the AI Thumbnails sign-up page and on to Stripe Checkout;
// an account goes to Stripe Checkout at once (Checkout is the confirmation page).
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import {
  catalogTrial,
  entryPlan,
  trialButtonLabel,
  trialTermsText,
  useMySubscription,
  useSubscriptionPlans,
} from '../../../../../hooks/useSubscription';
import { useStudioAccountState } from '../../../../../hooks/useStudioAccount';
import type { MySubscription, SubscriptionCatalog, SubscriptionPlan, SubscriptionTrial } from '../../../../../types/subscription';
import { STUDIO_SIGN_UP_PATH } from '../../../../../utils/studioAuth';
import { startPlanSignUp } from './billingActions';
import { PlanCheckoutButton } from './PlanCheckoutButton';
import { planPriceText, startPlanLabel, videosPerMonthText } from './PlanChoices';

export const STUDIO_HOME_PATH = '/ai-thumbnails/projects';
const PRICING_PATH = '/ai-thumbnails/pricing';

export type StartOffer =
  | { kind: 'loading' }
  /** The plans (or the account's plan) did not load: the pricing page instead. */
  | { kind: 'unavailable' }
  | { kind: 'trial'; plan: SubscriptionPlan; trial: SubscriptionTrial; signedIn: boolean }
  | { kind: 'plan'; plan: SubscriptionPlan; signedIn: boolean }
  /** The account has a plan (or one waiting on a payment): its Studio. */
  | { kind: 'studio' };

/** What the start button offers, from what is known so far. */
export function startOffer({
  catalog,
  catalogFailed = false,
  signedIn,
  me,
  meFailed = false,
}: {
  catalog: SubscriptionCatalog | null | undefined;
  catalogFailed?: boolean;
  signedIn: boolean;
  me?: MySubscription | null;
  meFailed?: boolean;
}): StartOffer {
  if (signedIn && !me && !meFailed) return { kind: 'loading' };
  if (signedIn && me && !me.canSubscribe) return { kind: 'studio' };
  if (!catalog) return catalogFailed ? { kind: 'unavailable' } : { kind: 'loading' };
  const plan = entryPlan(catalog);
  if (!plan || (signedIn && !me)) return { kind: 'unavailable' };
  const trial = catalogTrial(catalog);
  if (trial && (!signedIn || me?.trialEligible === true)) return { kind: 'trial', plan, trial, signedIn };
  return { kind: 'plan', plan, signedIn };
}

/** The start offer for whoever is on the page. */
export function useStartOffer(): StartOffer {
  const { account, resolved } = useStudioAccountState();
  const signedIn = account !== 'anonymous';
  const plans = useSubscriptionPlans();
  const me = useMySubscription();
  if (!resolved) return { kind: 'loading' };
  return startOffer({
    catalog: plans.data,
    catalogFailed: Boolean(plans.error),
    signedIn,
    me: me.data,
    meFailed: Boolean(me.error),
  });
}

/** The line under the start button: the trial's terms, or the plan's price. */
export function startOfferTerms(offer: StartOffer): string | null {
  if (offer.kind === 'trial') return trialTermsText(offer.trial);
  if (offer.kind === 'plan')
    return `${offer.plan.name}: ${videosPerMonthText(offer.plan.videosPerMonth)} for ${planPriceText(offer.plan, 'month')} · Cancel any time`;
  return null;
}

export const startButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-[#fa7517] px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#fa7517]/25 transition-colors hover:bg-[#fb8a3c] disabled:cursor-not-allowed disabled:opacity-60';

export function StartOfferButton({
  offer,
  short = false,
  className = startButtonClass,
}: {
  offer: StartOffer;
  /** The header's short form: "Start free trial", else the pricing page or the Studio. */
  short?: boolean;
  className?: string;
}) {
  const location = useLocation();

  if (offer.kind === 'loading')
    return (
      <button type="button" disabled aria-busy="true" className={className}>
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Loading plans…
      </button>
    );
  if (offer.kind === 'studio')
    return (
      <Link to={STUDIO_HOME_PATH} className={className}>
        Open the Studio
      </Link>
    );
  if (offer.kind === 'unavailable' || (short && offer.kind === 'plan'))
    return (
      <Link to={PRICING_PATH} className={className}>
        See plans
      </Link>
    );

  const { plan } = offer;
  const trial = offer.kind === 'trial' ? offer.trial : null;
  const label = trial ? (short ? 'Start free trial' : trialButtonLabel(trial)) : startPlanLabel(plan, 'month');
  if (offer.signedIn) return <PlanCheckoutButton planId={plan.id} label={label} context={{}} className={className} />;
  return (
    <Link
      to={STUDIO_SIGN_UP_PATH}
      onClick={() => startPlanSignUp({ planId: plan.id, interval: 'month', trial: Boolean(trial) }, location.pathname + location.search)}
      className={className}
    >
      {label}
    </Link>
  );
}

export default StartOfferButton;
