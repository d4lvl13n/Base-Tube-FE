// Leaving for Stripe (plan checkout, pack checkout, customer portal) always
// remembers where to come back and which priced action was waiting.
import { billingErrorDetails, subscriptionsApi } from '../../../../../api/subscriptions';
import { creditsApi } from '../../../../../api/credits';
import type { BillingInterval, SubscriptionPlanId } from '../../../../../types/subscription';
import {
  rememberCreditsReturn,
  rememberPendingPaidAction,
  rememberPlanIntent,
  studioReturnDestination,
  type PendingPaidAction,
  type PlanIntent,
} from '../../../../../utils/studioDraft';
import { startStudioAuth } from '../../../../../utils/studioAuth';
import { plainApiError } from '../../../../../utils/plainApiError';

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

/**
 * A visitor clicked a plan button ("Start 7-day free trial", or a plan with its
 * price): the AI Thumbnails sign-up page (never a modal) comes next, and this
 * plan is remembered so the continue screen opens its checkout right after.
 */
export function startPlanSignUp(intent: PlanIntent, from: string) {
  startStudioAuth('sign-up', from);
  rememberPlanIntent(intent);
}

/** What the continue screen does once the plan remembered before the sign-up was tried. */
export type PlanIntentOutcome =
  /** The browser is leaving for Stripe Checkout. */
  | { kind: 'checkout' }
  /** The account already has a plan: go on to the page the visitor came from. */
  | { kind: 'has-plan' }
  /** The button promised a free trial this account cannot have (it had a plan before). */
  | { kind: 'no-trial' }
  /** Checkout did not open. */
  | { kind: 'failed'; message: string };

/**
 * After the sign-up: Stripe Checkout for the remembered plan, at once (the
 * click was the intent; Checkout is the confirmation page). A trial button
 * never leads to a paid checkout: an account that cannot have the trial is
 * told so on the pricing page instead.
 */
export async function resumePlanIntent(intent: PlanIntent): Promise<PlanIntentOutcome> {
  try {
    const me = await subscriptionsApi.getMe();
    if (!me.canSubscribe) return { kind: 'has-plan' };
    if (intent.trial && me.trialEligible !== true) return { kind: 'no-trial' };
    if (await goToPlanCheckout(intent.planId, intent.interval, { returnPath: intent.returnPath })) return { kind: 'checkout' };
    return { kind: 'failed', message: 'Checkout is not available right now. Please try again in a moment.' };
  } catch (failure) {
    if (billingErrorDetails(failure).code === 'SUBSCRIPTION_EXISTS') return { kind: 'has-plan' };
    return { kind: 'failed', message: plainApiError(failure, 'Checkout did not open. Please try again.').message };
  }
}
