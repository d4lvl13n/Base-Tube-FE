import { useQuery } from "@tanstack/react-query";
import { getWelcomeOffer } from "../api/toolFunnel";
import type { SubscriptionTrial } from "../types/subscription";
import type { WelcomeOffer } from "../types/toolFunnel";

export const welcomeOfferKey = ["tool", "welcome-offer"] as const;

/**
 * The welcome gift as the pages show it (GET /tool/welcome-offer, public).
 * Owner decision, 29 September 2026: the 7-day free trial replaces the welcome
 * credits, and the server answers `{ credits: 0, available: false }`. The gift
 * can be turned back on by config, so it is shown only when the server says a
 * number of credits (> 0). Unknown (loading, failed or malformed) reads as no
 * gift: nothing is promised until the server says so.
 */
export interface WelcomeOfferView {
  /** Credits a new account gets once its email is verified; null: no welcome gift. */
  credits: number | null;
  /** The gift is on but today's are all given: new accounts get them the next day. */
  givenOut: boolean;
}

export function welcomeOfferView(offer: WelcomeOffer | undefined): WelcomeOfferView {
  const credits = offer && Number.isInteger(offer.credits) && offer.credits > 0 ? offer.credits : null;
  return { credits, givenOut: credits !== null && offer?.available === false };
}

export function useWelcomeOffer(): WelcomeOfferView {
  const { data } = useQuery({
    queryKey: welcomeOfferKey,
    queryFn: () => getWelcomeOffer(),
    staleTime: 5 * 60_000,
    retry: false,
  });
  return welcomeOfferView(data);
}

/** "50 free credits". */
export const freeCreditsText = (credits: number) => `${credits} free credits`;

export const WELCOME_CREDITS_GIVEN_OUT = "Today’s welcome credits are all given — create your account now and get them tomorrow.";

/** "try any plan free for 7 days, with 2 videos included". */
const trialOfferText = (trial: SubscriptionTrial) =>
  `try any plan free for ${trial.days} day${trial.days === 1 ? "" : "s"}, with ${trial.videos} video${trial.videos === 1 ? "" : "s"} included`;

/**
 * The line under the visitor's "Create a free account to generate" button: the
 * welcome credits when the gift is on, else the free trial that follows the
 * sign-up (`trial`: the plan catalog's), else how creating is paid for.
 */
export function visitorWelcomeLine(offer: WelcomeOfferView, trial: SubscriptionTrial | null = null): string {
  if (offer.credits !== null)
    return offer.givenOut
      ? WELCOME_CREDITS_GIVEN_OUT
      : `New accounts get ${offer.credits} free credits — enough for one generation, one edit and an audit.`;
  if (trial) return `The account is free. Then ${trialOfferText(trial)}. Cancel before day ${trial.days + 1} and you pay nothing.`;
  return "The account is free. Generating uses credits from a plan or a pack.";
}

/** The account gate's line under its title: the gift when it is on, else the free trial, else how creating is paid for. */
export function gateOfferLine(offer: WelcomeOfferView, trial: SubscriptionTrial | null = null): string | null {
  if (offer.credits !== null) return null; // The gate shows the gift itself (with the amount highlighted).
  if (trial) return `The account is free. After signing up, ${trialOfferText(trial)}.`;
  return "The account is free. Creating and editing use credits from a plan or a pack.";
}

/**
 * When deferred welcome credits arrive, as read: "on 29 September" (a date
 * without a time is that calendar day), or "tomorrow" when the server gave no
 * readable day.
 */
export function welcomeGrantWhen(grantOn: string | null | undefined): string {
  if (!grantOn) return "tomorrow";
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(grantOn);
  const time = Date.parse(dateOnly ? `${grantOn}T00:00:00Z` : grantOn);
  if (!Number.isFinite(time)) return "tomorrow";
  return `on ${new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", ...(dateOnly ? { timeZone: "UTC" } : {}) }).format(time)}`;
}

/** The gate after a confirmation that deferred the welcome credits to another day. */
export function deferredWelcomeMessage(credits: number | null, grantOn: string | null | undefined): string {
  return `Today’s welcome credits are all given. Your ${credits ? `${credits} credits` : "welcome credits"} will be added ${welcomeGrantWhen(grantOn)}.`;
}

/** A visitor's audit refused because today's free audits are used up on the platform (429 ANONYMOUS_AUDIT_CAPACITY). */
export function auditCapacityMessage(offer: WelcomeOfferView, trial: SubscriptionTrial | null = null): string {
  if (offer.credits !== null && !offer.givenOut)
    return `Free audits are used up for today. Create a free account to get ${offer.credits} credits.`;
  if (offer.credits === null && trial)
    return `Free audits are used up for today. Create a free account, then try any plan free for ${trial.days} days to keep auditing.`;
  return "Free audits are used up for today. Create a free account to keep auditing with credits.";
}
