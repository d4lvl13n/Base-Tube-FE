// src/utils/passPricing.ts
//
// Tiered pricing of a Content Pass on the web (base-be docs/product/
// PASS_TIERED_PRICING_SPEC.md). A creator sells at ONE price (the default) or
// at a price that rises by tiers: the first passes cost less, the next ones
// more. The grid is chosen at creation, shown to buyers and frozen at the
// first sale.
//
// One place for the rules and the words: the wizard, the revenue simulator,
// the creator's pass page and lists, and the buy box all read from here.
// Pure: no React, no network. The server is the authority (base-be
// src/modules/pass/passPricing.ts holds the same rules); these copies let the
// wizard answer before a request is sent.
//
// Copy rule (owner's vision): tiers are an early-supporter price. Never "it
// will be worth more", "profit" or "appreciate"; no charts, no "% change", no
// countdown.

// --- Shapes the API returns ------------------------------------------------------

/** One tier of a grid: how many passes exist at this price. */
export interface PriceTierDto {
  size: number;
  /** Unit price, minor units (cents). */
  priceCents: number;
}

export type PricingState = 'on_sale' | 'all_reserved' | 'sold_out';
export type PublicTierState = 'sold' | 'current' | 'upcoming';

/** `pricing` on every pass answer (spec §9.1). */
export interface PassPricingDto {
  mode: 'single' | 'tiered';
  state: PricingState;
  currentPriceCents: number | null;
  /** Free passes at the current price; the only figure derived from checkouts in progress. */
  leftAtCurrentPrice: number | null;
  nextPriceCents: number | null;
  /** Only when `all_reserved`: seconds until the first checkout holding a pass runs out. */
  retryAfterSeconds: number | null;
  /** [] for a single price. */
  tiers: Array<PriceTierDto & { state: PublicTierState }>;
}

/** `tier_sales` on the creator's own pass answers: paid / total per tier. */
export interface TierSaleDto extends PriceTierDto {
  paid: number;
  state: PublicTierState;
}

// --- The rules of a grid (spec §7.1) ----------------------------------------------

export const MAX_PRICE_TIERS = 10;
export const MIN_PRICE_TIERS = 2;
/** Every tier of a grid holds at least this many passes. */
export const MIN_TIER_SIZE = 10;
/** Below this number of passes a pass is single-price only. */
export const MIN_TIERED_SUPPLY = MIN_TIER_SIZE * 2;
export const MIN_UNIT_PRICE_CENTS = 100;
/** Above this ratio between the last and the first price the wizard shows a calm warning (a warning, not a limit). */
export const STEEP_GRID_RATIO = 3;
/** Default number of tiers the builder offers. */
export const DEFAULT_TIER_COUNT = 3;

const isWhole = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n);

/** "EUR 5", "EUR 12.50": code first, no needless decimals. */
export function priceText(cents: number, currency: string): string {
  const units = cents / 100;
  return `${(currency || 'EUR').toUpperCase()} ${Number.isInteger(units) ? String(units) : units.toFixed(2)}`;
}

const plural = (n: number, one: string, many: string): string =>
  `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;

/** `true`, or the sentence that says what is wrong with the grid. */
export function validateTiers(tiers: readonly PriceTierDto[], cap: number | null | undefined): true | string {
  if (!isWhole(cap) || cap < 1) return 'Set how many passes exist first.';
  if (cap < MIN_TIERED_SUPPLY) return `A price that rises by tiers needs at least ${MIN_TIERED_SUPPLY} passes. With fewer, use one price.`;
  if (tiers.length < MIN_PRICE_TIERS) return `Use at least ${MIN_PRICE_TIERS} tiers, or one price.`;
  if (tiers.length > MAX_PRICE_TIERS) return `At most ${MAX_PRICE_TIERS} tiers.`;
  for (let i = 0; i < tiers.length; i += 1) {
    const { size, priceCents } = tiers[i];
    if (!isWhole(size) || size < MIN_TIER_SIZE) return `Tier ${i + 1}: at least ${MIN_TIER_SIZE} passes.`;
    if (!isWhole(priceCents) || priceCents < MIN_UNIT_PRICE_CENTS) return `Tier ${i + 1}: a price of at least 1.00.`;
    if (i > 0 && priceCents <= tiers[i - 1].priceCents) return `Tier ${i + 1}: each tier must cost more than the one before.`;
  }
  const total = tiers.reduce((sum, t) => sum + t.size, 0);
  if (total !== cap) {
    return `The tiers hold ${plural(total, 'pass', 'passes')}; they must add up to ${plural(cap, 'pass', 'passes')}.`;
  }
  return true;
}

/** The most tiers a number of passes allows (10 per tier, at most 10 tiers). */
export const maxTierCountFor = (cap: number | null | undefined): number =>
  isWhole(cap) && cap > 0 ? Math.min(MAX_PRICE_TIERS, Math.floor(cap / MIN_TIER_SIZE)) : 0;

/**
 * The automatic builder (spec §7.2), from a start price, a final price and a
 * number of tiers. Sizes are floor(cap / n), the remainder going to the LAST
 * tiers one pass each. The start and final prices are kept exactly as typed;
 * the ones in between are evenly spaced, rounded to a whole unit when the step
 * is at least one unit, otherwise to 0.50. Two neighbours that come out equal
 * are refused. Returns the grid, or the sentence that says why not.
 */
export function buildTiers(input: {
  supplyCap: number | null | undefined;
  startPriceCents: number | null | undefined;
  finalPriceCents: number | null | undefined;
  count: number;
}): { tiers: PriceTierDto[] } | { error: string } {
  const { supplyCap, startPriceCents, finalPriceCents, count } = input;
  if (!isWhole(count) || count < MIN_PRICE_TIERS || count > MAX_PRICE_TIERS) {
    return { error: `Choose between ${MIN_PRICE_TIERS} and ${MAX_PRICE_TIERS} tiers.` };
  }
  if (!isWhole(supplyCap) || supplyCap < count * MIN_TIER_SIZE) {
    return {
      error: `${count} tiers need at least ${count * MIN_TIER_SIZE} passes (${MIN_TIER_SIZE} per tier). Choose fewer tiers or more passes.`,
    };
  }
  if (!isWhole(startPriceCents) || startPriceCents < MIN_UNIT_PRICE_CENTS) return { error: 'Enter a start price of at least 1.00.' };
  if (!isWhole(finalPriceCents) || finalPriceCents <= startPriceCents) return { error: 'The final price must be higher than the start price.' };
  const base = Math.floor(supplyCap / count);
  const remainder = supplyCap - base * count;
  const step = (finalPriceCents - startPriceCents) / (count - 1);
  const unit = step >= 100 ? 100 : 50;
  const tiers: PriceTierDto[] = [];
  for (let i = 0; i < count; i += 1) {
    const priceCents =
      i === 0 ? startPriceCents : i === count - 1 ? finalPriceCents : Math.round((startPriceCents + step * i) / unit) * unit;
    tiers.push({ size: base + (i >= count - remainder ? 1 : 0), priceCents });
  }
  for (let i = 1; i < tiers.length; i += 1) {
    if (tiers[i].priceCents <= tiers[i - 1].priceCents) {
      return { error: 'Some tiers come out at the same price. Choose fewer tiers or a wider gap between the start and final prices.' };
    }
  }
  const valid = validateTiers(tiers, supplyCap);
  return valid === true ? { tiers } : { error: valid };
}

// --- Revenue ------------------------------------------------------------------------

/** What buyers pay in total (minor units) once `unitsSold` passes are sold, the cheapest first. */
export function revenueAt(tiers: readonly PriceTierDto[], unitsSold: number): number {
  let left = Math.max(0, Math.floor(unitsSold));
  let total = 0;
  for (const tier of tiers) {
    if (left <= 0) break;
    const units = Math.min(left, tier.size);
    total += units * tier.priceCents;
    left -= units;
  }
  return total;
}

/** Sales levels shown side by side (spec §7.4): never the sell-out figure alone. */
export const SALES_LEVELS_PCT: readonly number[] = [25, 50, 75, 100];

export interface RevenueLevel {
  pct: number;
  units: number;
  /** What buyers pay, minor units. */
  buyersPayCents: number;
}

export function revenueLevels(tiers: readonly PriceTierDto[]): RevenueLevel[] {
  const cap = tiers.reduce((sum, t) => sum + t.size, 0);
  return SALES_LEVELS_PCT.map((pct) => {
    const units = Math.floor((cap * pct) / 100);
    return { pct, units, buyersPayCents: revenueAt(tiers, units) };
  });
}

// --- What the wizard tells the creator (spec §7.4) --------------------------------------

/** The last price over the first, to one decimal. */
export function gridRatio(tiers: readonly PriceTierDto[]): number {
  if (tiers.length < 2 || tiers[0].priceCents <= 0) return 1;
  return Math.round((tiers[tiers.length - 1].priceCents / tiers[0].priceCents) * 10) / 10;
}

/** "The last passes cost 5× the first." plus, above 3×, the calm warning. */
export function climbStatement(tiers: readonly PriceTierDto[]): { text: string; warning: string | null } {
  const ratio = gridRatio(tiers);
  const times = Number.isInteger(ratio) ? String(ratio) : ratio.toFixed(1);
  return {
    text: `The last passes cost ${times}× the first.`,
    warning:
      ratio > STEEP_GRID_RATIO ? 'Later fans pay much more for the same videos. That suits some audiences, not all.' : null,
  };
}

/**
 * How many fans get the first price: "With up to 10 per person, as few as 20
 * people can take the 200 passes at EUR 5." When one buyer can take a whole
 * tier, say so and suggest the per-person limit that stops it.
 */
export function firstPriceReach(
  tiers: readonly PriceTierDto[],
  maxPerBuyer: number | null | undefined,
  currency: string,
): { text: string; wholeTier: string | null; suggestedLimit: number | null } {
  const first = tiers[0];
  const limit = isWhole(maxPerBuyer) && maxPerBuyer > 0 ? maxPerBuyer : 1;
  const people = Math.ceil(first.size / limit);
  const text = `With up to ${limit.toLocaleString('en-US')} per person, as few as ${plural(people, 'person', 'people')} can take the ${plural(
    first.size,
    'pass',
    'passes',
  )} at ${priceText(first.priceCents, currency)}.`;
  const smallest = Math.min(...tiers.map((t) => t.size));
  if (limit < smallest) return { text, wholeTier: null, suggestedLimit: null };
  // A limit under the smallest tier, and never above 10 (the default), keeps every tier for several fans.
  const suggestedLimit = Math.max(1, Math.min(10, Math.floor(smallest / 2)));
  return {
    text,
    wholeTier: `One person can buy a whole tier (${plural(smallest, 'pass', 'passes')}). A lower per-person limit spreads each price over more fans.`,
    suggestedLimit: suggestedLimit < limit ? suggestedLimit : null,
  };
}

/** The resale statement next to a grid (spec §7.4). Percentages are the recorded terms. */
export const resaleAndTiersStatement = (royaltyPct: number, primaryPct: number): string =>
  `30 days after buying, a holder may resell at any price — possibly below your current price. You earn ${royaltyPct}% on a resale and ${primaryPct}% on a new pass.`;

export const GRID_FROZEN_AFTER_FIRST_SALE =
  'The number of passes, the price grid and the per-person limit cannot be changed after the first sale.';

// --- Reading a pass answer ------------------------------------------------------------------

interface PricingSource {
  pricing?: PassPricingDto | null;
  price_cents?: number;
  price_tiers?: PriceTierDto[] | null;
  can_purchase?: boolean;
  purchase_block_reason_code?: string | null;
  available_count?: number | null;
}

/**
 * The pricing block of a pass answer. A server older than tiered pricing
 * sends none: the pass is then read as single-price at `price_cents`.
 */
export function pricingOf(pass: PricingSource | null | undefined): PassPricingDto {
  if (pass?.pricing && typeof pass.pricing === 'object' && Array.isArray(pass.pricing.tiers)) return pass.pricing;
  const soldOut = pass?.purchase_block_reason_code === 'PASS_SOLD_OUT';
  const price = typeof pass?.price_cents === 'number' ? pass.price_cents : null;
  return {
    mode: 'single',
    state: soldOut ? 'sold_out' : 'on_sale',
    currentPriceCents: soldOut ? null : price,
    leftAtCurrentPrice: soldOut ? null : pass?.available_count ?? null,
    nextPriceCents: null,
    retryAfterSeconds: null,
    tiers: [],
  };
}

/** The grid of a pass: from `pricing.tiers`, else the stored `price_tiers` (creator answers). [] for a single price. */
export function gridOf(pass: PricingSource | null | undefined): PriceTierDto[] {
  const fromPricing = pass?.pricing?.tiers;
  if (Array.isArray(fromPricing) && fromPricing.length >= 2) return fromPricing.map(({ size, priceCents }) => ({ size, priceCents }));
  const stored = pass?.price_tiers;
  return Array.isArray(stored) && stored.length >= 2 ? stored.map(({ size, priceCents }) => ({ size, priceCents })) : [];
}

export const isTieredPass = (pass: PricingSource | null | undefined): boolean => gridOf(pass).length >= 2;

/** Lists: "EUR 5" for one price, "EUR 5 – 25" for a grid (code first). */
export function priceRangeText(pass: PricingSource & { currency?: string }): string {
  const currency = pass.currency || 'EUR';
  const grid = gridOf(pass);
  if (grid.length < 2) return priceText(pass.price_cents ?? 0, currency);
  const last = grid[grid.length - 1].priceCents / 100;
  const lastText = Number.isInteger(last) ? String(last) : last.toFixed(2);
  return `${priceText(grid[0].priceCents, currency)} – ${lastText}`;
}

// --- What the buyer reads (spec §11) ------------------------------------------------------

/** "37 left at this price" (tiered passes only; null otherwise). */
export function leftAtPriceText(pricing: PassPricingDto): string | null {
  if (pricing.mode !== 'tiered' || pricing.state !== 'on_sale' || pricing.leftAtCurrentPrice === null) return null;
  return `${pricing.leftAtCurrentPrice.toLocaleString('en-US')} left at this price`;
}

/** "then EUR 10" (tiered passes only, when a next price exists). */
export function thenPriceText(pricing: PassPricingDto, currency: string): string | null {
  if (pricing.mode !== 'tiered' || pricing.state !== 'on_sale' || pricing.nextPriceCents === null) return null;
  return `then ${priceText(pricing.nextPriceCents, currency)}`;
}

/**
 * Why the quantity stops where it does on a tiered pass, when the price tier
 * is what limits it: one checkout stays at one price.
 */
export function tierQuantityNote(pricing: PassPricingDto, ceiling: number): string | null {
  if (pricing.mode !== 'tiered' || pricing.state !== 'on_sale' || pricing.leftAtCurrentPrice === null) return null;
  if (ceiling < pricing.leftAtCurrentPrice) return null;
  const n = pricing.leftAtCurrentPrice;
  return `${n === 1 ? 'Only 1 pass is' : `Only ${n.toLocaleString('en-US')} passes are`} left at this price. One checkout stays at one price.`;
}

export const ALL_RESERVED_TEXT = "The last passes are in someone's checkout. Try again in a few minutes.";

/** The buy box's sentence after the server refused because the price moved. */
export const priceChangedText = (unitPriceCents: number, currency: string): string =>
  `The price is now ${priceText(unitPriceCents, currency)}.`;

/** The price a client displays and sends back as `expectedUnitPriceCents`. */
export const displayedUnitPrice = (pricing: PassPricingDto, fallbackCents: number | undefined): number | null =>
  pricing.state === 'on_sale' ? pricing.currentPriceCents ?? fallbackCents ?? null : null;

/**
 * The numbers a checkout refusal carries (PRICE_CHANGED, QUANTITY_SPANS_PRICE_TIERS,
 * PASS_ALL_RESERVED, PASS_SOLD_OUT), read from an API error body. Null for any other error.
 */
export interface PricingRefusal {
  code: 'PRICE_CHANGED' | 'QUANTITY_SPANS_PRICE_TIERS' | 'PASS_ALL_RESERVED' | 'PASS_SOLD_OUT';
  pricing: PassPricingDto | null;
  unitPriceCents: number | null;
  maxQuantity: number | null;
  retryAfterSeconds: number | null;
}

const REFUSAL_CODES = new Set(['PRICE_CHANGED', 'QUANTITY_SPANS_PRICE_TIERS', 'PASS_ALL_RESERVED', 'PASS_SOLD_OUT']);

export function pricingRefusalOf(body: unknown): PricingRefusal | null {
  const error = (body as { error?: { code?: unknown; details?: Record<string, unknown> } } | null)?.error;
  if (!error || typeof error.code !== 'string' || !REFUSAL_CODES.has(error.code)) return null;
  const details = error.details ?? {};
  const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  const pricing = details.pricing && typeof details.pricing === 'object' ? (details.pricing as PassPricingDto) : null;
  return {
    code: error.code as PricingRefusal['code'],
    pricing,
    unitPriceCents: num(details.unitPriceCents) ?? pricing?.currentPriceCents ?? null,
    maxQuantity: num(details.maxQuantity),
    retryAfterSeconds: num(details.retryAfterSeconds) ?? pricing?.retryAfterSeconds ?? null,
  };
}

// --- Resale opening, for holders (spec §10) -----------------------------------------------

/** `resale_eligibility` on GET /passes/me (per pass) and `resale` on GET /purchases/:id/status. */
export interface ResaleEligibilityDto {
  eligible: boolean;
  eligibleAt: string | null;
  blockedBy: 'NOT_CLAIMED' | 'WAITING_PERIOD' | 'CARD_HOLD' | null;
  opensEarlierIfSoldOut: boolean;
}

const shortDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

/** "Resellable from 14 Dec, or as soon as every pass is sold." — or null when nothing useful can be said. */
export function resaleOpeningText(resale: ResaleEligibilityDto | null | undefined): string | null {
  if (!resale) return null;
  if (resale.eligible) return 'You can resell this pass.';
  if (resale.blockedBy === 'NOT_CLAIMED') return 'Claim this pass to your wallet to be able to resell it.';
  if (!resale.eligibleAt) return null;
  const date = shortDate(resale.eligibleAt);
  return resale.opensEarlierIfSoldOut
    ? `Resellable from ${date}, or as soon as every pass is sold.`
    : `Resellable from ${date}.`;
}
