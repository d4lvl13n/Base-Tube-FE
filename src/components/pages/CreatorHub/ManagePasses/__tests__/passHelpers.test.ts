import { passPriceText, soldText } from '../passHelpers';

/** The code and the amount are joined by a no-break space; compare with plain spaces. */
const plain = (text: string) => text.replace(/[  ]/g, ' ');

describe('passPriceText', () => {
  it('writes the price like every other amount: code first, never a symbol', () => {
    expect(plain(passPriceText({ price_cents: 4900, currency: 'EUR' }))).toBe('EUR 49.00');
    expect(plain(passPriceText({ price_cents: 1800, currency: 'usd' }))).toBe('USD 18.00');
    expect(passPriceText({ price_cents: 4900, currency: 'EUR' })).not.toMatch(/[€$]/);
  });

  it("prefers the business API's price, which carries its own decimals", () => {
    expect(plain(passPriceText({ price_cents: 0, currency: 'EUR' }, { amount: 12_500_000, currency: 'USDC', decimals: 6 }))).toBe(
      'USDC 12.50',
    );
  });
});

describe('soldText', () => {
  it('says how many were sold out of how many exist', () => {
    expect(soldText(23, 200, 'en-GB')).toBe('23 of 200');
    expect(soldText(1200, 5000, 'en-GB')).toBe('1,200 of 5,000');
    expect(soldText(4, null, 'en-GB')).toBe('4 sold');
  });
});
