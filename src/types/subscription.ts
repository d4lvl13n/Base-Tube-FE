// AI Thumbnails monthly plans (spec docs/specs/ai-thumbnails-subscription-spec-2026-09-29.md in base-be).
// Plans are sold in videos per month; inside, everything stays credits.

export type SubscriptionPlanId = 'creator' | 'pro' | 'agency';
export type BillingInterval = 'month' | 'year';

export interface PlanMonthPrice {
  amountCents: number;
  currency: string;
}

export interface PlanYearPrice extends PlanMonthPrice {
  /** The yearly price spread over 12 months. */
  monthlyEquivalentCents: number;
  /** The saving against 12 monthly payments, in whole percent (computed by the server). */
  savingsPercent: number;
}

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  /** Upgrade order: a higher rank is a bigger plan. */
  rank: number;
  videosPerMonth: number;
  creditsPerMonth: number;
  channelProfiles: number;
  /** Ready-to-show English lines: only what the product really does. */
  highlights: string[];
  prices: { month: PlanMonthPrice; year: PlanYearPrice };
}

/** The free trial checkout adds for an account that never had a plan (the same on every plan). */
export interface SubscriptionTrial {
  days: number;
  videos: number;
  credits: number;
}

/** GET /api/v1/subscriptions/plans (public). */
export interface SubscriptionCatalog {
  /** Credits one video costs (3 concepts, 2 edits, 1 audit, rounded). */
  videoCredits: number;
  videoBreakdown: {
    concepts: number;
    conceptCredits: number;
    edits: number;
    editCredits: number;
    audits: number;
    auditCredits: number;
  };
  rolloverMonths: number;
  free: { channelProfiles: number };
  /** The free trial; null when trials are off (absent on older servers: read as null). */
  trial?: SubscriptionTrial | null;
  plans: SubscriptionPlan[];
}

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'unpaid'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'paused';

export interface AccountSubscription {
  planId: SubscriptionPlanId;
  planName: string;
  interval: BillingInterval;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  nextInvoiceAt: string | null;
  amountCents: number;
  currency: string;
}

/** The balance by origin: subscription credits expire, pack and gift credits do not. */
export interface CreditBreakdown {
  available: number;
  subscription: {
    available: number;
    /** The nearest expiry of the subscription credits, or null when there are none. */
    expiresAt: string | null;
    lots: Array<{ available: number; expiresAt: string }>;
  };
  other: { available: number };
}

/** GET /api/v1/subscriptions/me (auth). */
export interface MySubscription {
  subscription: AccountSubscription | null;
  credits: CreditBreakdown;
  videoCredits: number;
  /** Videos the subscription credits still cover (server-computed, never worked out here). */
  videosRemaining: number;
  channelProfiles: { limit: number; used: number };
  canSubscribe: boolean;
  upgradeTo: SubscriptionPlanId | null;
  /** Checkout adds the free trial: trials are on and the account never had a plan (absent on older servers: false). */
  trialEligible?: boolean;
  /** When the free trial ends and the plan is charged, while the subscription is `trialing`; else null. */
  trialEndsAt?: string | null;
}

/** POST /api/v1/subscriptions/checkout. */
export interface SubscriptionCheckoutSession {
  url: string;
  sessionId: string;
  /** Free trial days this checkout includes; 0 without a trial. */
  trialDays?: number;
}

/** GET /api/v1/subscriptions/upgrade-preview?planId=… */
export interface UpgradePreview {
  planId: SubscriptionPlanId;
  interval: BillingInterval;
  amountDueCents: number;
  currency: string;
  /** Sent back with the upgrade so the charge is the one shown. */
  prorationDate: number;
  creditsAddedNow: number;
}
