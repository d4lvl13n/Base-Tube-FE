import type { ChannelReadiness, Funnel, MoneyLine, ReadinessItem } from '../../../../../types/creatorBusiness';
import {
  EARNINGS_BEFORE_CARD_FEE_FALLBACK,
  EARNINGS_LABEL,
  amountUnknownText,
  earningsCardFeeLine,
  earningsDefinition,
  earningsWording,
  funnelView,
  quietMoneyLines,
  splitMoney,
} from '../businessFormat';
import { readinessProgress } from '../readinessView';
import { initials } from '../customerBits';

/** Intl puts a no-break space between code and amount; compare with plain spaces. */
const plain = (text: string) => text.replace(/[  ]/g, ' ');
const L = 'en-GB';

const API_PROCEEDS = "Your share is what buyers paid minus BaseTube's fee, for purchases that are not refunded or disputed.";
const API_FEE = "BaseTube's fee is the 10% taken from each sale.";

describe('earnings wording', () => {
  it('names the money "your earnings" everywhere, and nothing else changes', () => {
    expect(EARNINGS_LABEL).toBe('Your earnings');
    expect(earningsWording('Only paid sales count toward your share. Refunded sales are shown apart.')).toBe(
      'Only paid sales count toward your earnings. Refunded sales are shown apart.',
    );
    expect(earningsWording('They are taken out of sales and of your share.')).toBe('They are taken out of sales and of your earnings.');
    expect(earningsWording('A sentence about shares of a video.')).toBe('A sentence about shares of a video.');
  });

  it("builds the one transparency sentence from the API's own definitions", () => {
    expect(earningsDefinition({ proceeds: API_PROCEEDS, platformFee: API_FEE })).toBe(
      "Your earnings are what buyers paid minus BaseTube's 10% fee, for purchases that are not refunded or disputed.",
    );
  });

  it('adds no percentage the API does not state', () => {
    expect(earningsDefinition({ proceeds: API_PROCEEDS, platformFee: "BaseTube's fee is taken from each sale." })).toBe(
      "Your earnings are what buyers paid minus BaseTube's fee, for purchases that are not refunded or disputed.",
    );
    expect(earningsDefinition({ proceeds: API_PROCEEDS })).toContain("BaseTube's fee,");
    expect(earningsDefinition({ platformFee: API_FEE })).toBeNull();
    expect(earningsDefinition(undefined)).toBeNull();
  });
});

const line = (patch: Partial<MoneyLine> = {}): MoneyLine => ({
  currency: 'EUR',
  decimals: 2,
  purchases: 10,
  units: 10,
  gross: 10_000,
  platformFee: 1_000,
  proceeds: 9_000,
  amountUnknownPurchases: 0,
  processingFee: { amount: 300, knownFor: 5, unknownFor: 5 },
  netReceived: { amount: 8_000, knownFor: 5, unknownFor: 5 },
  refunds: { count: 0, refundedPurchasesGross: 0, amountReturned: 0, amountUnknownCount: 0, keptAccessCount: 0, keptAccessAmount: 0 },
  disputes: { count: 0, gross: 0, amountUnknownCount: 0 },
  ...patch,
});

describe('quietMoneyLines', () => {
  it('says nothing when nothing moved the earnings', () => {
    expect(quietMoneyLines(line(), L)).toEqual([]);
  });

  it('never mentions fees, gross sales or net received', () => {
    const text = quietMoneyLines(
      line({
        refunds: { count: 2, refundedPurchasesGross: 2_000, amountReturned: 1_800, amountUnknownCount: 0, keptAccessCount: 1, keptAccessAmount: 200 },
        disputes: { count: 1, gross: 900, amountUnknownCount: 0 },
        amountUnknownPurchases: 3,
      }),
      L,
    )
      .map(plain)
      .join(' | ');
    expect(text).toBe(
      '2 refunds · EUR 18.00 returned | 1 small refund, access kept · EUR 2.00 | 1 purchase disputed by the bank · EUR 9.00 | 3 older purchases have no recorded amount',
    );
    expect(text).not.toMatch(/fee|net|gross|share/i);
  });

  it('says when a refunded or disputed amount was not recorded, instead of showing 0', () => {
    expect(
      quietMoneyLines(
        line({
          refunds: { count: 2, refundedPurchasesGross: 0, amountReturned: 0, amountUnknownCount: 2, keptAccessCount: 0, keptAccessAmount: 0 },
          disputes: { count: 2, gross: 500, amountUnknownCount: 1 },
        }),
        L,
      ).map(plain),
    ).toEqual(['2 refunds · amount not recorded', '2 purchases disputed by the bank · EUR 5.00 (not recorded for 1)']);
  });

  it('writes the purchases with no recorded amount in the singular too', () => {
    expect(amountUnknownText(1, L)).toBe('1 older purchase has no recorded amount');
  });
});

describe('splitMoney', () => {
  it('splits the code from the amount; only the digits follow the locale', () => {
    expect(splitMoney(123456, 'EUR', 2, L)).toEqual({ code: 'EUR', amount: '1,234.56' });
    expect(splitMoney(123456, 'EUR', 2, 'de-DE')).toEqual({ code: 'EUR', amount: '1.234,56' });
  });

  it('keeps the currency decimals (USDC has 6)', () => {
    expect(splitMoney(12_500_000, 'USDC', 6, L)).toEqual({ amount: '12.50', code: 'USDC' });
    expect(splitMoney(4_000, 'USDC', 6, L).amount).toBe('0.004');
  });
});

const funnel = (patch: Partial<Funnel> = {}): Funnel => ({
  visits: 400,
  uniqueVisitors: 200,
  visitCountingSince: '2026-10-01',
  visitsCoverWholeRange: true,
  checkoutsStarted: 20,
  paid: 10,
  abandoned: 10,
  visitConversion: 0.05,
  checkoutConversion: 0.5,
  ...patch,
});

describe('funnelView', () => {
  it('sizes each bar against the largest step and writes the conversion between steps', () => {
    const view = funnelView(funnel(), L);
    expect(view.steps.map((s) => [s.label, s.value, s.width])).toEqual([
      ['Visits', 400, 100],
      ['Unique visitors', 200, 50],
      ['Checkouts started', 20, 5],
      ['Paid', 10, 2.5],
    ]);
    expect(view.toCheckout).toBe('10% started a checkout');
    expect(view.toPaid).toBe('50% of them paid');
    expect(view.headline).toBe('5% of visitors paid');
    expect(view.abandoned).toBe('10 abandoned (50%)');
  });

  it('keeps a tiny step visible and an empty one empty', () => {
    const view = funnelView(funnel({ visits: 10_000, paid: 1, checkoutsStarted: 0, abandoned: 0, checkoutConversion: null }), L);
    expect(view.steps.find((s) => s.key === 'paid')?.width).toBe(2);
    expect(view.steps.find((s) => s.key === 'checkoutsStarted')?.width).toBe(0);
    expect(view.toPaid).toBeNull();
    expect(view.abandoned).toBeNull();
  });

  it('shows "not counted" visits as unknown, never as zero, and no ratio against them', () => {
    const view = funnelView(funnel({ visits: null, uniqueVisitors: null, visitConversion: null }), L);
    expect(view.steps.slice(0, 2).map((s) => [s.value, s.width])).toEqual([
      [null, 0],
      [null, 0],
    ]);
    expect(view.toCheckout).toBeNull();
    expect(view.headline).toBeNull();
    expect(view.steps[2].width).toBe(100);
  });

  it('says so when more people paid than visits were counted', () => {
    const view = funnelView(funnel({ uniqueVisitors: 5, checkoutsStarted: 8, visitConversion: 2 }), L);
    expect(view.toCheckout).toBe('More checkouts than counted visitors');
    expect(view.headline).toBe('More buyers than counted visitors');
  });
});

const item = (state: ReadinessItem['state'], required = true): ReadinessItem => ({
  key: 'youtube',
  state,
  title: 't',
  detail: 'd',
  required,
  action: null,
  basetubeReason: null,
  passes: [],
});

const channel = (items: ReadinessItem[]): ChannelReadiness => ({
  channelId: 1,
  channelName: 'c',
  ready: false,
  summary: 's',
  items,
  review: { canRequest: false, requestedAt: null },
});

describe('readinessProgress', () => {
  it('counts required steps only, across channels, done first', () => {
    const progress = readinessProgress([
      channel([item('todo'), item('done'), item('waiting', false)]),
      channel([item('basetube'), item('waiting'), item('done')]),
    ]);
    expect(progress).toEqual({ done: 2, total: 5, segments: ['done', 'done', 'waiting', 'todo', 'basetube'] });
  });

  it('is empty without channels', () => {
    expect(readinessProgress([])).toEqual({ done: 0, total: 0, segments: [] });
  });
});

describe('initials', () => {
  it('takes up to two initials for the monogram', () => {
    expect(initials('Ana Lima')).toBe('AL');
    expect(initials('Buyer 3FA9C1')).toBe('B3');
    expect(initials('maria')).toBe('M');
    expect(initials('  ')).toBe('?');
  });
});

describe('the card fee line in "How this is counted"', () => {
  it("uses the API's own sentence when it sends one", () => {
    const api =
      'Your earnings are shown before the card processing fee. On each card sale, the payment provider (Stripe) also takes its own fee from your Stripe account, so what you receive for card sales is lower than the earnings shown here.';
    expect(earningsCardFeeLine({ earningsBeforeCardFee: api })).toBe(api);
  });

  it("falls back to the owner's sentence, with no amount", () => {
    expect(EARNINGS_BEFORE_CARD_FEE_FALLBACK).toBe(
      'Earnings are shown before the card processing fee your payment provider takes on card sales.',
    );
    expect(earningsCardFeeLine(undefined)).toBe(EARNINGS_BEFORE_CARD_FEE_FALLBACK);
    expect(earningsCardFeeLine({ earningsBeforeCardFee: '  ' })).toBe(EARNINGS_BEFORE_CARD_FEE_FALLBACK);
  });
});
