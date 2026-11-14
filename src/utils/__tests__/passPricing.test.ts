import {
  ALL_RESERVED_TEXT,
  buildTiers,
  climbStatement,
  displayedUnitPrice,
  firstPriceReach,
  gridOf,
  isTieredPass,
  leftAtPriceText,
  maxTierCountFor,
  priceChangedText,
  priceRangeText,
  priceText,
  pricingOf,
  pricingRefusalOf,
  resaleAndTiersStatement,
  resaleOpeningText,
  revenueAt,
  revenueLevels,
  thenPriceText,
  tierQuantityNote,
  validateTiers,
  type PassPricingDto,
  type PriceTierDto,
} from '../passPricing';
import { publicSaleCopy } from '../passSaleCopy';

const GRID: PriceTierDto[] = [
  { size: 200, priceCents: 500 },
  { size: 200, priceCents: 1000 },
];

const tiered = (overrides: Partial<PassPricingDto> = {}): PassPricingDto => ({
  mode: 'tiered',
  state: 'on_sale',
  currentPriceCents: 500,
  leftAtCurrentPrice: 37,
  nextPriceCents: 1000,
  retryAfterSeconds: null,
  tiers: GRID.map((t, i) => ({ ...t, state: i === 0 ? 'current' : 'upcoming' })),
  ...overrides,
});

describe('the builder (same rules as the server)', () => {
  it('keeps the typed start and final prices; remainder to the last tiers', () => {
    const out = buildTiers({ supplyCap: 103, startPriceCents: 499, finalPriceCents: 2501, count: 4 });
    expect(out).toEqual({
      tiers: [
        { size: 25, priceCents: 499 },
        { size: 26, priceCents: 1200 },
        { size: 26, priceCents: 1800 },
        { size: 26, priceCents: 2501 },
      ],
    });
  });

  it('rounds to 0.50 when the step is under one unit', () => {
    const out = buildTiers({ supplyCap: 50, startPriceCents: 500, finalPriceCents: 800, count: 5 });
    expect('tiers' in out && out.tiers.map((t) => t.priceCents)).toEqual([500, 600, 650, 750, 800]);
  });

  it('refuses neighbours at the same price, a falling range, too few passes', () => {
    expect(buildTiers({ supplyCap: 100, startPriceCents: 500, finalPriceCents: 600, count: 6 })).toEqual({
      error: 'Some tiers come out at the same price. Choose fewer tiers or a wider gap between the start and final prices.',
    });
    expect(buildTiers({ supplyCap: 100, startPriceCents: 900, finalPriceCents: 500, count: 3 })).toEqual({
      error: 'The final price must be higher than the start price.',
    });
    expect('error' in buildTiers({ supplyCap: 29, startPriceCents: 100, finalPriceCents: 500, count: 3 })).toBe(true);
  });

  it('the most tiers a cap allows: 10 per tier, 10 tiers at most', () => {
    expect(maxTierCountFor(19)).toBe(1);
    expect(maxTierCountFor(35)).toBe(3);
    expect(maxTierCountFor(5000)).toBe(10);
    expect(maxTierCountFor(undefined)).toBe(0);
  });
});

describe('validateTiers', () => {
  it('true for a valid grid; one sentence for each broken rule', () => {
    expect(validateTiers(GRID, 400)).toBe(true);
    expect(validateTiers(GRID, 19)).toMatch(/at least 20 passes/);
    expect(validateTiers([{ size: 9, priceCents: 500 }, { size: 391, priceCents: 900 }], 400)).toBe('Tier 1: at least 10 passes.');
    expect(validateTiers([{ size: 200, priceCents: 900 }, { size: 200, priceCents: 900 }], 400)).toBe(
      'Tier 2: each tier must cost more than the one before.',
    );
    expect(validateTiers(GRID, 401)).toBe('The tiers hold 400 passes; they must add up to 401 passes.');
    expect(validateTiers([{ size: 200, priceCents: 50 }, { size: 200, priceCents: 900 }], 400)).toBe('Tier 1: a price of at least 1.00.');
  });
});

describe('revenue', () => {
  it('cheapest first, and the four sales levels', () => {
    expect(revenueAt(GRID, 250)).toBe(200 * 500 + 50 * 1000);
    expect(revenueLevels(GRID)).toEqual([
      { pct: 25, units: 100, buyersPayCents: 50_000 },
      { pct: 50, units: 200, buyersPayCents: 100_000 },
      { pct: 75, units: 300, buyersPayCents: 200_000 },
      { pct: 100, units: 400, buyersPayCents: 300_000 },
    ]);
  });
});

describe('what the wizard says (spec §7.4)', () => {
  it('how far the price climbs; a calm warning above 3×', () => {
    expect(climbStatement(GRID)).toEqual({ text: 'The last passes cost 2× the first.', warning: null });
    const steep = climbStatement([{ size: 100, priceCents: 500 }, { size: 100, priceCents: 2500 }]);
    expect(steep).toEqual({
      text: 'The last passes cost 5× the first.',
      warning: 'Later fans pay much more for the same videos. That suits some audiences, not all.',
    });
    expect(climbStatement([{ size: 100, priceCents: 400 }, { size: 100, priceCents: 1000 }]).text).toBe('The last passes cost 2.5× the first.');
  });

  it('how many fans get the first price, and when one person could take a whole tier', () => {
    expect(firstPriceReach(GRID, 10, 'EUR')).toEqual({
      text: 'With up to 10 per person, as few as 20 people can take the 200 passes at EUR 5.',
      wholeTier: null,
      suggestedLimit: null,
    });
    const small = firstPriceReach([{ size: 10, priceCents: 500 }, { size: 10, priceCents: 900 }], 10, 'EUR');
    expect(small.text).toBe('With up to 10 per person, as few as 1 person can take the 10 passes at EUR 5.');
    expect(small.wholeTier).toBe('One person can buy a whole tier (10 passes). A lower per-person limit spreads each price over more fans.');
    expect(small.suggestedLimit).toBe(5);
  });

  it('resale and later tiers', () => {
    expect(resaleAndTiersStatement(5, 90)).toBe(
      '30 days after buying, a holder may resell at any price — possibly below your current price. You earn 5% on a resale and 90% on a new pass.',
    );
  });

  it('never the words the vision forbids', () => {
    const copy = [
      climbStatement([{ size: 100, priceCents: 500 }, { size: 100, priceCents: 2500 }]).warning,
      firstPriceReach(GRID, 10, 'EUR').text,
      resaleAndTiersStatement(5, 90),
      ALL_RESERVED_TEXT,
      leftAtPriceText(tiered()),
      thenPriceText(tiered(), 'EUR'),
    ].join(' ');
    for (const word of [/worth more/i, /profit/i, /apprecia/i, /% change/i]) expect(copy).not.toMatch(word);
  });
});

describe('reading a pass answer', () => {
  it('pricing as sent; an older server without it reads as single price', () => {
    expect(pricingOf({ pricing: tiered() })).toEqual(tiered());
    expect(pricingOf({ price_cents: 700, available_count: 12 })).toEqual({
      mode: 'single', state: 'on_sale', currentPriceCents: 700, leftAtCurrentPrice: 12, nextPriceCents: null, retryAfterSeconds: null, tiers: [],
    });
    expect(pricingOf({ price_cents: 700, can_purchase: false, purchase_block_reason_code: 'PASS_SOLD_OUT' }).state).toBe('sold_out');
  });

  it('the grid from pricing or from the stored column; lists show "EUR 5 – 10"', () => {
    expect(gridOf({ pricing: tiered() })).toEqual(GRID);
    expect(gridOf({ price_tiers: GRID })).toEqual(GRID);
    expect(isTieredPass({ price_tiers: null })).toBe(false);
    expect(priceRangeText({ price_cents: 500, currency: 'EUR', price_tiers: GRID })).toBe('EUR 5 – 10');
    expect(priceRangeText({ price_cents: 1250, currency: 'EUR' })).toBe('EUR 12.50');
    expect(priceText(1250, 'eur')).toBe('EUR 12.50');
  });
});

describe('what the buyer reads', () => {
  it('"37 left at this price", "then EUR 10"; nothing for a single price', () => {
    expect(leftAtPriceText(tiered())).toBe('37 left at this price');
    expect(thenPriceText(tiered(), 'EUR')).toBe('then EUR 10');
    expect(leftAtPriceText({ ...tiered(), mode: 'single' })).toBeNull();
    expect(thenPriceText(tiered({ nextPriceCents: null }), 'EUR')).toBeNull();
  });

  it('the quantity note only when the tier is what limits the quantity', () => {
    expect(tierQuantityNote(tiered({ leftAtCurrentPrice: 3 }), 3)).toBe('Only 3 passes are left at this price. One checkout stays at one price.');
    expect(tierQuantityNote(tiered({ leftAtCurrentPrice: 1 }), 1)).toBe('Only 1 pass is left at this price. One checkout stays at one price.');
    expect(tierQuantityNote(tiered({ leftAtCurrentPrice: 37 }), 10)).toBeNull();
  });

  it('the price the client sends back is the one it displays', () => {
    expect(displayedUnitPrice(tiered(), 500)).toBe(500);
    expect(displayedUnitPrice(tiered({ state: 'all_reserved', currentPriceCents: null }), 500)).toBeNull();
    expect(priceChangedText(1000, 'EUR')).toBe('The price is now EUR 10.');
  });

  it('refusals carry their numbers', () => {
    const body = {
      success: false,
      error: {
        code: 'PRICE_CHANGED',
        message: 'The price is now EUR 10.',
        details: { pricing: tiered({ currentPriceCents: 1000 }), unitPriceCents: 1000, maxQuantity: 4, totalCents: 1000 },
      },
    };
    expect(pricingRefusalOf(body)).toMatchObject({ code: 'PRICE_CHANGED', unitPriceCents: 1000, maxQuantity: 4 });
    expect(pricingRefusalOf({ success: false, error: { code: 'PASS_ALL_RESERVED', details: { retryAfterSeconds: 90 } } })).toMatchObject({
      code: 'PASS_ALL_RESERVED', retryAfterSeconds: 90,
    });
    expect(pricingRefusalOf({ success: false, error: { code: 'CONSENT_REQUIRED' } })).toBeNull();
  });

  it('the page tells "sold out" from "the last ones are in checkouts"', () => {
    expect(publicSaleCopy({ can_purchase: false, purchase_block_reason_code: 'PASS_SOLD_OUT', pricing: { state: 'all_reserved' } })?.headline).toBe(
      "The last passes are in someone's checkout.",
    );
    expect(publicSaleCopy({ can_purchase: false, purchase_block_reason_code: 'PASS_SOLD_OUT', pricing: { state: 'sold_out' } })?.headline).toBe(
      'This pass is sold out.',
    );
  });
});

describe('resale opening, for holders', () => {
  it('a date, and "or as soon as every pass is sold" only when a sell-out would open it earlier', () => {
    expect(resaleOpeningText({ eligible: false, eligibleAt: '2026-12-14T12:00:00.000Z', blockedBy: 'WAITING_PERIOD', opensEarlierIfSoldOut: true })).toBe(
      'Resellable from 14 Dec, or as soon as every pass is sold.',
    );
    expect(resaleOpeningText({ eligible: false, eligibleAt: '2027-01-13T12:00:00.000Z', blockedBy: 'CARD_HOLD', opensEarlierIfSoldOut: false })).toBe(
      'Resellable from 13 Jan.',
    );
    expect(resaleOpeningText({ eligible: false, eligibleAt: null, blockedBy: 'NOT_CLAIMED', opensEarlierIfSoldOut: false })).toBe(
      'Claim this pass to your wallet to be able to resell it.',
    );
    expect(resaleOpeningText(null)).toBeNull();
  });
});
