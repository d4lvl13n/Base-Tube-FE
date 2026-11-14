import { isTieredForm, transformFormToApiFormat, type FormData } from '../types';

const base: FormData = {
  title: 'T',
  price_cents: 700,
  currency: 'EUR',
  supply_cap: 400,
  max_per_buyer: 10,
  src_urls: [{ value: 'https://youtu.be/abcdefghijk' }],
};

describe('the wizard form sent to the API', () => {
  it('one price: no grid in the request', () => {
    const request = transformFormToApiFormat({ ...base, pricing_mode: 'single', price_tiers: [{ size: 200, priceCents: 500 }, { size: 200, priceCents: 900 }] });
    expect(request).not.toHaveProperty('price_tiers');
    expect(request.price_cents).toBe(700);
  });

  it('price rises by tiers: the grid is sent and price_cents is its first price', () => {
    const grid = [{ size: 200, priceCents: 500 }, { size: 200, priceCents: 900 }];
    const request = transformFormToApiFormat({ ...base, pricing_mode: 'tiered', price_tiers: grid });
    expect(request).toMatchObject({ price_tiers: grid, price_cents: 500, supply_cap: 400 });
  });

  it('tiered with fewer than two tiers is not a grid', () => {
    expect(isTieredForm({ pricing_mode: 'tiered', price_tiers: [{ size: 400, priceCents: 500 }] })).toBe(false);
    expect(isTieredForm({ pricing_mode: 'tiered', price_tiers: undefined })).toBe(false);
  });
});
