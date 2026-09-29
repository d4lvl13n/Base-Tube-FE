import { useQuery } from '@tanstack/react-query';
import { subscriptionsApi } from '../api/subscriptions';
import { useStudioAccount } from './useStudioAccount';
import type { MySubscription, SubscriptionCatalog, SubscriptionPlanId } from '../types/subscription';

/** The account's plan and credits by origin; refreshed with the Studio balance (useStudioBalance). */
export const subscriptionKey = (account: string) => ['thumbnail-studio', account, 'subscription'] as const;
export const upgradePreviewKey = (account: string, planId: string | null) =>
  ['thumbnail-studio', account, 'subscription-upgrade', planId] as const;
export const SUBSCRIPTION_PLANS_KEY = ['subscription-plans'] as const;

/** The public plan catalog (the same for everyone). */
export function useSubscriptionPlans() {
  return useQuery<SubscriptionCatalog>({
    queryKey: SUBSCRIPTION_PLANS_KEY,
    queryFn: () => subscriptionsApi.getPlans(),
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
