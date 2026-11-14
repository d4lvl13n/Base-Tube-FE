import {
  activeFilterCount,
  customerApiParams,
  parseCustomerState,
  parseScope,
  patchParams,
  scopeSearch,
} from '../businessUrlState';

const sp = (text: string) => new URLSearchParams(text);
const PASS = '3fa85f64-5717-4562-b3fc-2c963f66afa6';

describe('scope in the address', () => {
  it('defaults to the last 30 days and all channels', () => {
    expect(parseScope(sp(''))).toEqual({ preset: '30d', from: null, to: null, channelId: null });
    // A screen can choose its own default (Payouts: all time).
    expect(parseScope(sp(''), 'all').preset).toBe('all');
    expect(parseScope(sp('period=7d'), 'all').preset).toBe('7d');
  });

  it('reads a preset, a custom range and a channel', () => {
    expect(parseScope(sp('period=90d&channel=4'))).toEqual({ preset: '90d', from: null, to: null, channelId: 4 });
    expect(parseScope(sp('period=custom&from=2026-11-01&to=2026-11-10'))).toMatchObject({
      preset: 'custom',
      from: '2026-11-01',
      to: '2026-11-10',
    });
  });

  it('drops malformed values instead of sending them to the API', () => {
    expect(parseScope(sp('period=forever&channel=abc'))).toEqual({ preset: '30d', from: null, to: null, channelId: null });
    expect(parseScope(sp('period=custom&from=2026-02-30&to=x'))).toMatchObject({ preset: 'custom', from: null, to: null });
    expect(parseScope(sp('channel=0')).channelId).toBeNull();
    expect(parseScope(sp('channel=-3')).channelId).toBeNull();
    // from/to only mean something for a custom range.
    expect(parseScope(sp('period=7d&from=2026-11-01&to=2026-11-10'))).toMatchObject({ from: null, to: null });
  });

  it('carries only the period and channel between screens', () => {
    expect(scopeSearch(sp('period=90d&channel=4&q=ada&page=3'))).toBe('?period=90d&channel=4');
    expect(scopeSearch(sp('q=ada'))).toBe('');
    expect(scopeSearch(sp('period=7d'), { pass: PASS })).toBe(`?period=7d&pass=${PASS}`);
  });

  it('patches the address, removing empty values and resetting the page on request', () => {
    expect(patchParams(sp('a=1&page=3'), { b: 2, a: null }).toString()).toBe('page=3&b=2');
    expect(patchParams(sp('a=1&page=3'), { a: '' }, { resetPage: true }).toString()).toBe('');
  });
});

describe('customer list state', () => {
  it('has safe defaults', () => {
    expect(parseCustomerState(sp(''))).toEqual({
      search: '',
      passId: null,
      access: null,
      buyerType: null,
      canContact: null,
      opened: null,
      source: null,
      sort: 'last_purchase',
      dir: 'desc',
      sortCurrency: null,
      page: 1,
      pageSize: 25,
    });
  });

  it('reads every filter, sort and page', () => {
    const state = parseCustomerState(
      sp(`q=ada&pass=${PASS.toUpperCase()}&access=refunded&buyer=returning&contact=yes&opened=never&source=youtube&sort=total_paid&dir=asc&cur=usdc&page=2&size=50`),
    );
    expect(state).toEqual({
      search: 'ada',
      passId: PASS,
      access: 'refunded',
      buyerType: 'returning',
      canContact: true,
      opened: 'never',
      source: 'youtube',
      sort: 'total_paid',
      dir: 'asc',
      sortCurrency: 'USDC',
      page: 2,
      pageSize: 50,
    });
    expect(activeFilterCount(state)).toBe(6);
    expect(parseCustomerState(sp('contact=no')).canContact).toBe(false);
  });

  it('ignores values the API would refuse', () => {
    const state = parseCustomerState(
      sp(`q=${'x'.repeat(150)}&pass=not-a-uuid&access=all&buyer=old&contact=maybe&source=myspace&sort=name&page=0&size=1000&cur=€`),
    );
    expect(state.search).toHaveLength(100);
    expect(state).toMatchObject({ passId: null, access: null, buyerType: null, canContact: null, source: null, sort: 'last_purchase', page: 1, pageSize: 25, sortCurrency: null });
    expect(activeFilterCount(state)).toBe(0);
  });

  it('becomes API parameters with only what was chosen', () => {
    expect(customerApiParams(parseCustomerState(sp('contact=no&page=4')))).toEqual({
      search: undefined,
      passId: undefined,
      access: undefined,
      buyerType: undefined,
      canContact: false,
      opened: undefined,
      source: undefined,
      sort: 'last_purchase',
      dir: 'desc',
      sortCurrency: undefined,
      page: 4,
      pageSize: 25,
    });
  });
});
