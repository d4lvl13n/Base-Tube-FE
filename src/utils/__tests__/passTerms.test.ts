import {
  DECIDED_RESALE_TERMS,
  MAX_CHECKOUT_QUANTITY,
  SUPPLY_CAP_BOUNDS,
  SUPPLY_CAP_PRESETS,
  allowanceSentence,
  buyerAllowanceOf,
  checkoutQuantityCeiling,
  defaultMaxPerBuyer,
  maxPerBuyerOf,
  passesText,
  pctText,
  perPersonText,
  resaleBuyerSentence,
  resaleCreatorSentence,
  resaleTermsOf,
  supplyCapOf,
  validateMaxPerBuyer,
  validateSupplyCap,
} from '../passTerms';

describe('number of passes (cap)', () => {
  it('matches the server bounds and offers the agreed presets', () => {
    expect(SUPPLY_CAP_BOUNDS).toEqual({ min: 1, max: 100_000 });
    expect(SUPPLY_CAP_PRESETS).toEqual([100, 250, 500, 1000]);
  });

  it('is required: no value is refused, never read as "unlimited"', () => {
    expect(validateSupplyCap(undefined)).toBe('Choose how many passes exist.');
    expect(validateSupplyCap(null)).toBe('Choose how many passes exist.');
    expect(validateSupplyCap(Number.NaN)).toBe('Choose how many passes exist.');
  });

  it('accepts whole numbers in bounds and says what is wrong otherwise', () => {
    expect(validateSupplyCap(1)).toBe(true);
    expect(validateSupplyCap(100_000)).toBe(true);
    expect(validateSupplyCap(0)).toBe('At least 1 pass.');
    expect(validateSupplyCap(100_001)).toBe('At most 100,000 passes.');
    expect(validateSupplyCap(2.5)).toBe('Use a whole number.');
  });

  it('reads a legacy pass with no cap as null', () => {
    expect(supplyCapOf({ supply_cap: 250 })).toBe(250);
    expect(supplyCapOf({ supply_cap: null })).toBeNull();
    expect(supplyCapOf({ supply_cap: 0 })).toBeNull();
    expect(supplyCapOf(undefined)).toBeNull();
  });

  it('writes the count', () => {
    expect(passesText(1)).toBe('1 pass');
    expect(passesText(1000)).toBe('1,000 passes');
  });
});

describe('per-person limit', () => {
  it('defaults to 10, or to the cap when fewer passes exist', () => {
    expect(defaultMaxPerBuyer(250)).toBe(10);
    expect(defaultMaxPerBuyer(4)).toBe(4);
    expect(defaultMaxPerBuyer(null)).toBe(10);
  });

  it('is between 1 and the number of passes', () => {
    expect(validateMaxPerBuyer(10, 250)).toBe(true);
    expect(validateMaxPerBuyer(250, 250)).toBe(true);
    expect(validateMaxPerBuyer(251, 250)).toBe('At most 250: there are only 250 passes.');
    expect(validateMaxPerBuyer(0, 250)).toBe('At least 1.');
    expect(validateMaxPerBuyer(undefined, 250)).toBe('Choose how many passes one person may buy.');
    expect(validateMaxPerBuyer(3.5, 250)).toBe('Use a whole number.');
  });

  it('reads max_per_buyer and writes it for buyers', () => {
    expect(maxPerBuyerOf({ max_per_buyer: 5 })).toBe(5);
    expect(maxPerBuyerOf({ max_per_buyer: null })).toBeNull();
    expect(maxPerBuyerOf({})).toBeNull();
    expect(perPersonText(10)).toBe('Up to 10 per person');
  });
});

describe("the signed-in buyer's allowance", () => {
  const allowance = (over: Record<string, unknown> = {}) => ({
    buyer_allowance: { maxPerBuyer: 10, held: 8, inCheckout: 0, remaining: 2, maxCheckoutQuantity: 2, ...over },
  });

  it('is null when the server sent none (signed out, older server)', () => {
    expect(buyerAllowanceOf({ buyer_allowance: null })).toBeNull();
    expect(buyerAllowanceOf({})).toBeNull();
    expect(buyerAllowanceOf({ buyer_allowance: { maxPerBuyer: 0, remaining: 1 } as never })).toBeNull();
  });

  it('explains what is left, in the owner’s words', () => {
    expect(allowanceSentence(buyerAllowanceOf(allowance()))).toBe('You already have 8 of 10. You can buy 2 more.');
    expect(allowanceSentence(buyerAllowanceOf(allowance({ held: 10, remaining: 0, maxCheckoutQuantity: 0 })))).toBe(
      'You already have 10 of 10, the most one person can buy.',
    );
  });

  it('names passes waiting in an unpaid checkout, which count toward the limit', () => {
    expect(allowanceSentence(buyerAllowanceOf(allowance({ held: 6, inCheckout: 2, remaining: 2 })))).toBe(
      'You already have 8 of 10 (2 in a checkout you have not paid yet). You can buy 2 more.',
    );
  });

  it('says nothing to a buyer who has none yet', () => {
    expect(allowanceSentence(buyerAllowanceOf(allowance({ held: 0, remaining: 10, maxCheckoutQuantity: 10 })))).toBeNull();
    expect(allowanceSentence(null)).toBeNull();
  });

  it('never offers more than the passes left, the allowance or one checkout', () => {
    expect(checkoutQuantityCeiling(null, null)).toBe(MAX_CHECKOUT_QUANTITY);
    expect(checkoutQuantityCeiling(5, null)).toBe(5);
    expect(checkoutQuantityCeiling(500, buyerAllowanceOf(allowance()))).toBe(2);
    expect(checkoutQuantityCeiling(500, buyerAllowanceOf(allowance({ remaining: 0, maxCheckoutQuantity: 0 })))).toBe(0);
    expect(checkoutQuantityCeiling(0, null)).toBe(0);
  });
});

describe('resale terms', () => {
  it('states the recorded split', () => {
    expect(resaleTermsOf({ resale: { royaltyBps: 500, platformFeeBps: 200, sellerKeepsBps: 9300 } })).toEqual({
      creatorPct: 5,
      platformPct: 2,
      sellerPct: 93,
    });
    expect(resaleTermsOf({ resale: { royaltyBps: 750, platformFeeBps: 200, sellerKeepsBps: 9050 } })).toEqual({
      creatorPct: 7.5,
      platformPct: 2,
      sellerPct: 90.5,
    });
  });

  it('falls back to the decided 5% / 2% / 93% when no terms are recorded', () => {
    expect(resaleTermsOf({ resale: null })).toEqual(DECIDED_RESALE_TERMS);
    expect(resaleTermsOf(undefined)).toEqual({ creatorPct: 5, platformPct: 2, sellerPct: 93 });
  });

  it('writes the sentences without investment language', () => {
    const terms = resaleTermsOf(null);
    expect(pctText(7.5)).toBe('7.5%');
    expect(resaleCreatorSentence(terms)).toBe(
      'Every resale on the BaseTube marketplace pays you 5% of the price. BaseTube takes 2% and the seller keeps 93%.',
    );
    expect(resaleBuyerSentence(terms)).toBe(
      'When it sells, 5% of the price goes to the creator and 2% to BaseTube; you keep 93%.',
    );
    const all = `${resaleCreatorSentence(terms)} ${resaleBuyerSentence(terms)}`;
    expect(all).not.toMatch(/profit|apprecia|return|invest/i);
  });
});
