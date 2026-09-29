// Leaving for Stripe (plan checkout, pack checkout, customer portal) always
// remembers where to come back and which priced action was waiting.
import { subscriptionsApi } from '../../../../../api/subscriptions';
import { creditsApi } from '../../../../../api/credits';
import type { BillingInterval, SubscriptionPlanId } from '../../../../../types/subscription';
import {
  rememberCreditsReturn,
  rememberPendingPaidAction,
  studioReturnDestination,
  type PendingPaidAction,
} from '../../../../../utils/studioDraft';

/** The current screen when it is one checkout may return to (only /ai-thumbnails pages). */
export function currentStudioReturnPath(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return studioReturnDestination(window.location.pathname + window.location.search);
}

/** What to remember before the browser leaves for Stripe. */
export interface CheckoutContext {
  /** The screen to come back to; undefined lets the server choose (the pricing page on cancel). */
  returnPath?: string;
  /** The priced action to offer again on that screen once the credits are there. */
  pendingAction?: PendingPaidAction | null;
  /** Available credits now: "your credits arrived" is said only once the balance is higher. */
  availableCredits?: number | null;
}

function rememberBeforeLeaving(context: CheckoutContext) {
  // Without a return screen, an older remembered screen or action must not come back.
  const path = context.returnPath ?? '';
  rememberCreditsReturn(path);
  rememberPendingPaidAction(path ? context.pendingAction : null, path, context.availableCredits);
}

/** One click: Stripe Checkout for a plan. Resolves false when there was no URL to go to. */
export async function goToPlanCheckout(planId: SubscriptionPlanId, interval: BillingInterval, context: CheckoutContext): Promise<boolean> {
  const session = await subscriptionsApi.createCheckout({
    planId,
    interval,
    ...(context.returnPath ? { returnPath: context.returnPath } : {}),
  });
  if (!session?.url) return false;
  rememberBeforeLeaving(context);
  window.location.href = session.url;
  return true;
}

/** One click: Stripe Checkout for a credit pack. Resolves false when there was no URL to go to. */
export async function goToPackCheckout(packId: string, context: CheckoutContext): Promise<boolean> {
  const session = await creditsApi.createCheckout(packId, context.returnPath);
  if (!session?.url) return false;
  rememberBeforeLeaving(context);
  window.location.href = session.url;
  return true;
}

/** One click: Stripe's customer portal (card, invoices, change or cancel the plan). */
export async function goToBillingPortal(returnPath?: string): Promise<boolean> {
  const portal = await subscriptionsApi.createPortal(returnPath);
  if (!portal?.url) return false;
  window.location.href = portal.url;
  return true;
}
