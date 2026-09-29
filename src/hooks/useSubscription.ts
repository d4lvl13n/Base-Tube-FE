import { useQuery } from '@tanstack/react-query';
import { subscriptionsApi } from '../api/subscriptions';
import { useStudioAccount } from './useStudioAccount';
import type {
  MySubscription,
  SubscriptionCatalog,
  SubscriptionPlan,
  SubscriptionPlanId,
  SubscriptionTrial,
} from '../types/subscription';

/** The account's plan and credits by origin; refreshed with the Studio balance (useStudioBalance). */
export const subscriptionKey = (account: string) => ['thumbnail-studio', account, 'subscription'] as const;
export const upgradePreviewKey = (account: string, planId: string | null) =>
  ['thumbnail-studio', account, 'subscription-upgrade', planId] as const;
export const SUBSCRIPTION_PLANS_KEY = ['subscription-plans'] as const;

/** The public plan catalog (the same for everyone). `enabled`: false until it is needed on screen. */
export function useSubscriptionPlans(enabled = true) {
  return useQuery<SubscriptionCatalog>({
    queryKey: SUBSCRIPTION_PLANS_KEY,
    queryFn: () => subscriptionsApi.getPlans(),
    enabled,
    staleTime: 10 * 60_000,
    retry: 1,
  });
}

/** GET /subscriptions/me for the signed-in account; disabled for visitors. */
export function useMySubscription(enabled = true) {
  const account = useStudioAccount();
  return useQuery<MySubscription>({
    queryKey: subscriptionKey(account),
    queryFn: () => subscriptionsApi.getMe(),
    enabled: enabled && account !== 'anonymous',
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

/** What an upgrade charges now: read as soon as the upgrade is on screen (never behind a "get price" click). */
export function useUpgradePreview(planId: SubscriptionPlanId | null) {
  const account = useStudioAccount();
  return useQuery({
    queryKey: upgradePreviewKey(account, planId),
    queryFn: () => subscriptionsApi.getUpgradePreview(planId as SubscriptionPlanId),
    enabled: Boolean(planId) && account !== 'anonymous',
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

/** A plan that is being paid for: active, or its card failed and Stripe is retrying. */
export const hasLivePlan = (me: MySubscription | null | undefined): boolean =>
  Boolean(me?.subscription) && !me!.canSubscribe;

/** "≈ 4 videos left this month". */
export const videosLeftText = (videos: number) => `≈ ${videos.toLocaleString()} video${videos === 1 ? '' : 's'} left this month`;

/** The account's videos left: "≈ 2 videos left in your trial" during the free trial, else per month. */
export const planVideosLeftText = (me: MySubscription) =>
  me.subscription?.status === 'trialing'
    ? `≈ ${me.videosRemaining.toLocaleString()} video${me.videosRemaining === 1 ? '' : 's'} left in your trial`
    : videosLeftText(me.videosRemaining);

/** The catalog's free trial when it is a real one (whole days and videos), else null (trials off). */
export function catalogTrial(catalog: SubscriptionCatalog | null | undefined): SubscriptionTrial | null {
  const trial = catalog?.trial;
  if (!trial || !Number.isInteger(trial.days) || trial.days <= 0 || !Number.isInteger(trial.videos) || trial.videos <= 0) return null;
  return trial;
}

/** The smallest plan (lowest rank): the one a "Start free trial" button opens. */
export function entryPlan(catalog: SubscriptionCatalog | null | undefined): SubscriptionPlan | null {
  if (!catalog?.plans.length) return null;
  return catalog.plans.reduce((smallest, plan) => (plan.rank < smallest.rank ? plan : smallest));
}

/** "Start 7-day free trial". */
export const trialButtonLabel = (trial: SubscriptionTrial) => `Start ${trial.days}-day free trial`;

/** "2 videos free for 7 days · Cancel before day 8 and pay nothing". */
export const trialTermsText = (trial: SubscriptionTrial) =>
  `${trial.videos.toLocaleString()} video${trial.videos === 1 ? '' : 's'} free for ${trial.days} day${trial.days === 1 ? '' : 's'} · Cancel before day ${trial.days + 1} and pay nothing`;

/** "Oct 31" (with the year when it is not this year). */
export function shortDate(iso: string | null | undefined, now = new Date()): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
  });
}
