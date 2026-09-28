import { useQuery } from "@tanstack/react-query";
import { getWelcomeOffer } from "../api/toolFunnel";
import type { WelcomeOffer } from "../types/toolFunnel";

export const welcomeOfferKey = ["tool", "welcome-offer"] as const;

/**
 * The welcome credits as the pages show them (GET /tool/welcome-offer, public).
 * `credits` is null while unknown (loading, failed or malformed): the copy then
 * says "free credits" without a number. `available` is false only when the
 * server says today's welcome credits are all given (new accounts get them the
 * next day).
 */
export interface WelcomeOfferView {
  credits: number | null;
  available: boolean;
}

export function welcomeOfferView(offer: WelcomeOffer | undefined): WelcomeOfferView {
  const credits = offer && Number.isInteger(offer.credits) && offer.credits > 0 ? offer.credits : null;
  return { credits, available: offer?.available !== false };
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

/** "50 free credits", or "free credits" while the amount is unknown. */
export const freeCreditsText = (credits: number | null) => (credits ? `${credits} free credits` : "free credits");

export const WELCOME_CREDITS_GIVEN_OUT = "Today’s welcome credits are all given — create your account now and get them tomorrow.";

/** Under the visitor's "Create a free account to generate" button. */
export function visitorWelcomeLine(offer: WelcomeOfferView): string {
  if (!offer.available) return WELCOME_CREDITS_GIVEN_OUT;
  return offer.credits
    ? `New accounts get ${offer.credits} free credits — enough for one generation, one edit and an audit.`
    : "New accounts get free credits.";
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
export function auditCapacityMessage(offer: WelcomeOfferView): string {
  if (!offer.available) return "Free audits are used up for today. Create a free account to keep auditing with credits.";
  return `Free audits are used up for today. Create a free account to get ${offer.credits ? `${offer.credits} credits` : "free credits"}.`;
}
