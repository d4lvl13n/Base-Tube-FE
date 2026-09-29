// Channel profiles are limited per plan. Over the limit a new profile is
// refused (403 PROFILE_LIMIT); profiles beyond it after a downgrade stay, but
// read-only (403 PROFILE_READ_ONLY). Nothing is ever deleted or hidden.
import React from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { billingErrorDetails } from '../../../../../api/subscriptions';
import type { MySubscription, SubscriptionCatalog } from '../../../../../types/subscription';
import { hasLivePlan, useSubscriptionPlans } from '../../../../../hooks/useSubscription';

export interface ProfileLimitDetails {
  limit: number | null;
  planId: string | null;
  upgradePlanId: string | null;
}
export type ProfileQuotaProblem = { kind: 'limit'; details: ProfileLimitDetails } | { kind: 'readOnly' };

/** The quota refusal in a failed profile request, if it is one. */
export function profileQuotaProblem(failure: unknown): ProfileQuotaProblem | null {
  const { code, details } = billingErrorDetails(failure);
  if (code === 'PROFILE_READ_ONLY') return { kind: 'readOnly' };
  if (code !== 'PROFILE_LIMIT') return null;
  return {
    kind: 'limit',
    details: {
      limit: typeof details?.limit === 'number' ? details.limit : null,
      planId: typeof details?.planId === 'string' ? details.planId : null,
      upgradePlanId: typeof details?.upgradePlanId === 'string' ? details.upgradePlanId : null,
    },
  };
}

/** The account is at its limit already (GET /subscriptions/me): the same refusal, before a form is filled. */
export function profileLimitReached(me: MySubscription | null | undefined, catalog: SubscriptionCatalog | undefined): ProfileLimitDetails | null {
  if (!me || me.channelProfiles.used < me.channelProfiles.limit) return null;
  const limit = me.channelProfiles.limit;
  const planId = hasLivePlan(me) ? me.subscription!.planId : null;
  const rank = catalog?.plans.find((plan) => plan.id === planId)?.rank ?? 0;
  const upgrade = catalog?.plans.find((plan) => plan.rank > rank && plan.channelProfiles > limit) ?? null;
  return { limit, planId, upgradePlanId: upgrade?.id ?? null };
}

/** "Your plan includes 1 channel profile. Upgrade to Pro for 3." */
export function profileLimitMessage(details: ProfileLimitDetails, catalog: SubscriptionCatalog | undefined): string {
  const upgrade = catalog?.plans.find((plan) => plan.id === details.upgradePlanId);
  const owner = details.planId ? 'Your plan' : 'Your free account';
  const includes =
    details.limit === null
      ? `${owner} has reached its channel profile limit.`
      : `${owner} includes ${details.limit} channel profile${details.limit === 1 ? '' : 's'}.`;
  return upgrade ? `${includes} Upgrade to ${upgrade.name} for ${upgrade.channelProfiles}.` : includes;
}

export const PROFILE_READ_ONLY_MESSAGE =
  'This profile is read-only on your current plan: it is kept, but it cannot be edited or used for new work. Upgrade to use it again.';

export function ProfileQuotaNotice({ problem, className = '' }: { problem: ProfileQuotaProblem; className?: string }) {
  const plans = useSubscriptionPlans();
  const message = problem.kind === 'readOnly' ? PROFILE_READ_ONLY_MESSAGE : profileLimitMessage(problem.details, plans.data);
  return (
    <p role="alert" className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-amber-200 ${className}`}>
      <Lock className="h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
      <span>{message}</span>
      <Link to="/ai-thumbnails/pricing" className="font-medium text-[#fb923c] underline hover:text-orange-300">
        See plans
      </Link>
    </p>
  );
}

/** The badge on a read-only profile. */
export function ReadOnlyBadge() {
  return (
    <span
      title="Over your plan's channel profile limit: kept, but it cannot be edited or used for new work."
      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-zinc-500/20 px-2 py-0.5 text-[10px] font-semibold text-zinc-300"
    >
      <Lock className="h-3 w-3" aria-hidden="true" />
      Read-only
    </span>
  );
}
