// src/utils/passTerms.ts
//
// The fixed promise a pass makes to its buyers, in one place: how many passes
// exist (the cap), how many one person may buy, and what a resale pays.
// Every screen that states these terms (the creation wizard, the creator's
// pass page, the public sales page, the buy box, the creator info page)
// reads them from here, so the words and the numbers never disagree.
//
// Pure: no React, no network. The server is the authority for every value;
// the fallbacks below are the owner's decisions (PASS_RESALE_PLAN.md §9) and
// are only used while a field is missing from an answer.

// --- How many passes exist -----------------------------------------------------

/** One-tap choices in the wizard. Any other whole number in bounds is accepted. */
export const SUPPLY_CAP_PRESETS: readonly number[] = [100, 250, 500, 1000];

export const SUPPLY_CAP_DEFAULT = 100;

/** Bounds the server accepts for the number of passes. */
export interface SupplyCapBounds {
  min: number;
  max: number;
}

export const SUPPLY_CAP_BOUNDS: SupplyCapBounds = { min: 1, max: 100_000 };

/** The explanation the wizard shows next to the field. */
export const SUPPLY_CAP_HELP =
  'You choose how many passes exist. No more are ever created — when they are gone, fans buy from holders on the BaseTube marketplace.';

/** A legacy pass created before every pass had a cap. */
export const NO_CAP_SET = 'No cap set — set one to publish';

const isPositiveInt = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0;

/** The pass's cap, or null when none is set (legacy). Never "unlimited". */
export function supplyCapOf(pass: { supply_cap?: number | null } | null | undefined): number | null {
  return isPositiveInt(pass?.supply_cap) ? pass!.supply_cap! : null;
}

/** `true`, or the sentence that says what is wrong. */
export function validateSupplyCap(value: unknown, bounds: SupplyCapBounds = SUPPLY_CAP_BOUNDS): true | string {
  if (value === undefined || value === null || value === '' || Number.isNaN(value)) {
    return 'Choose how many passes exist.';
  }
  if (typeof value !== 'number' || !Number.isInteger(value)) return 'Use a whole number.';
  if (value < bounds.min) return `At least ${bounds.min.toLocaleString('en-US')} pass.`;
  if (value > bounds.max) return `At most ${bounds.max.toLocaleString('en-US')} passes.`;
  return true;
}

/** "1 pass" / "250 passes". */
export const passesText = (n: number): string => `${n.toLocaleString('en-US')} ${n === 1 ? 'pass' : 'passes'}`;

// --- How many one buyer may buy --------------------------------------------------

export const MAX_PER_BUYER_DEFAULT = 10;
export const MAX_PER_BUYER_MIN = 1;

export const MAX_PER_BUYER_HELP = 'A fan who buys several can resell the extra ones. A lower limit lets more fans get one.';

/** The per-buyer limit the server sent (`max_per_buyer`), or null when the answer carries none. */
export function maxPerBuyerOf(pass: { max_per_buyer?: number | null } | null | undefined): number | null {
  return isPositiveInt(pass?.max_per_buyer) ? pass!.max_per_buyer! : null;
}

/** `true`, or the sentence that says what is wrong. The limit can never exceed the number of passes. */
export function validateMaxPerBuyer(value: unknown, cap: number | null | undefined): true | string {
  if (value === undefined || value === null || value === '' || Number.isNaN(value)) {
    return 'Choose how many passes one person may buy.';
  }
  if (typeof value !== 'number' || !Number.isInteger(value)) return 'Use a whole number.';
  if (value < MAX_PER_BUYER_MIN) return `At least ${MAX_PER_BUYER_MIN}.`;
  if (isPositiveInt(cap) && value > cap) {
    return `At most ${cap.toLocaleString('en-US')}: there are only ${passesText(cap)}.`;
  }
  return true;
}

/** The default limit for a cap: 10, or the cap itself when fewer passes exist. */
export const defaultMaxPerBuyer = (cap: number | null | undefined): number =>
  isPositiveInt(cap) ? Math.min(MAX_PER_BUYER_DEFAULT, cap) : MAX_PER_BUYER_DEFAULT;

/** "Up to 10 per person". */
export const perPersonText = (limit: number): string => `Up to ${limit.toLocaleString('en-US')} per person`;

// --- What the signed-in buyer may still buy -------------------------------------------

/** `buyer_allowance` on GET /passes/:id for the signed-in viewer (base-be passBuyerAllowance.ts). */
export interface BuyerAllowanceDto {
  /** The pass's limit per buyer (never above its supply cap). */
  maxPerBuyer: number;
  /** Units paid for and not refunded or disputed. */
  held: number;
  /** Units in a checkout started and not paid yet. */
  inCheckout: number;
  /** How many more may be bought: maxPerBuyer − held − inCheckout, never below 0. */
  remaining: number;
  /** Largest quantity one checkout accepts now: min(remaining, passes left, 20). */
  maxCheckoutQuantity: number;
}

const isCount = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;

/**
 * The signed-in buyer's allowance on this pass, cleaned. Null when the server
 * sent none (signed out, an older server, or the count could not be read):
 * the buy box then falls back to the passes left, and the server still refuses
 * anything above the limit at checkout.
 */
export function buyerAllowanceOf(pass: { buyer_allowance?: Partial<BuyerAllowanceDto> | null } | null | undefined): BuyerAllowanceDto | null {
  const raw = pass?.buyer_allowance;
  if (!raw || !isPositiveInt(raw.maxPerBuyer) || !isCount(raw.remaining)) return null;
  const maxPerBuyer = raw.maxPerBuyer;
  const held = isCount(raw.held) ? Math.floor(raw.held) : 0;
  const inCheckout = isCount(raw.inCheckout) ? Math.floor(raw.inCheckout) : 0;
  const remaining = Math.min(Math.floor(raw.remaining), maxPerBuyer);
  const maxCheckoutQuantity = isCount(raw.maxCheckoutQuantity) ? Math.min(Math.floor(raw.maxCheckoutQuantity), remaining) : remaining;
  return { maxPerBuyer, held, inCheckout, remaining, maxCheckoutQuantity };
}

/**
 * Why the buyer cannot pick more, in their words — "You already have 8 of 10.
 * You can buy 2 more." — or null when they have none yet. Passes in an unpaid
 * checkout count toward the limit and are named.
 */
export function allowanceSentence(allowance: BuyerAllowanceDto | null): string | null {
  if (!allowance) return null;
  const { maxPerBuyer, held, inCheckout, remaining } = allowance;
  const have = held + inCheckout;
  if (have <= 0) return null;
  const pending = inCheckout > 0 ? ` (${inCheckout} in a checkout you have not paid yet)` : '';
  if (remaining <= 0) return `You already have ${have} of ${maxPerBuyer}${pending}, the most one person can buy.`;
  return `You already have ${have} of ${maxPerBuyer}${pending}. You can buy ${remaining} more.`;
}

/** The technical ceiling of one checkout (base-be passQuantity.ts MAX_CHECKOUT_QUANTITY). */
export const MAX_CHECKOUT_QUANTITY = 20;

/**
 * The most the quantity selector may offer: the passes left, the buyer's
 * allowance and the technical ceiling, whichever is lowest. 0 means this
 * buyer cannot buy any now.
 */
export function checkoutQuantityCeiling(
  remainingSupply: number | null,
  allowance: BuyerAllowanceDto | null,
  technicalMax: number = MAX_CHECKOUT_QUANTITY,
): number {
  let ceiling = Math.min(remainingSupply ?? technicalMax, technicalMax);
  if (allowance) ceiling = Math.min(ceiling, allowance.maxCheckoutQuantity);
  return Math.max(0, Math.floor(ceiling));
}

// --- What a resale pays ------------------------------------------------------------------

export interface ResaleTerms {
  /** Royalty paid to the creator on every resale, in percent (5 = 5%). */
  creatorPct: number;
  /** BaseTube's resale fee, in percent. */
  platformPct: number;
  /** What the seller keeps, in percent (100 − the two above). */
  sellerPct: number;
}

/** `resale` on every pass answer (base-be config/passResale.ts): basis points, 500 = 5%. Null on a legacy pass. */
export interface PassResaleDto {
  royaltyBps: number;
  platformFeeBps: number;
  sellerKeepsBps: number;
}

/** The owner's decision (PASS_RESALE_PLAN.md §9.1–9.2): 5% to the creator, 2% to BaseTube, 93% to the seller. */
export const DECIDED_RESALE_TERMS: ResaleTerms = { creatorPct: 5, platformPct: 2, sellerPct: 93 };

const bpsToPct = (bps: unknown): number | null =>
  typeof bps === 'number' && Number.isFinite(bps) && bps >= 0 && bps <= 10_000 ? bps / 100 : null;

/**
 * The resale split recorded on a pass (`resale`), in percent. A pass with no
 * terms recorded yet (a draft, a legacy pass) states the decided rates, which
 * the server records on it at creation / publish. The seller's share is what
 * is left after the two others.
 */
export function resaleTermsOf(pass: { resale?: Partial<PassResaleDto> | null } | null | undefined): ResaleTerms {
  const resale = pass?.resale;
  const creatorPct = bpsToPct(resale?.royaltyBps) ?? DECIDED_RESALE_TERMS.creatorPct;
  const platformPct = bpsToPct(resale?.platformFeeBps) ?? DECIDED_RESALE_TERMS.platformPct;
  const sellerPct = Math.max(0, Math.round((100 - creatorPct - platformPct) * 100) / 100);
  return { creatorPct, platformPct, sellerPct };
}

/** "5%", "2.5%". */
export const pctText = (pct: number): string => `${Number.isInteger(pct) ? pct : pct.toFixed(2).replace(/0+$/, '')}%`;

/** One sentence for the creator: what every resale pays them. */
export const resaleCreatorSentence = (terms: ResaleTerms): string =>
  `Every resale on the BaseTube marketplace pays you ${pctText(terms.creatorPct)} of the price. BaseTube takes ${pctText(
    terms.platformPct,
  )} and the seller keeps ${pctText(terms.sellerPct)}.`;

/** One sentence for a buyer: what reselling means. */
export const resaleBuyerSentence = (terms: ResaleTerms): string =>
  `When it sells, ${pctText(terms.creatorPct)} of the price goes to the creator and ${pctText(
    terms.platformPct,
  )} to BaseTube; you keep ${pctText(terms.sellerPct)}.`;

// --- Frozen after the first sale ------------------------------------------------------------

export const FROZEN_AFTER_FIRST_SALE =
  'The number of passes, the price and the per-person limit cannot be changed after the first sale.';
