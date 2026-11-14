import {
  applyPassSummary,
  findPassSummary,
  optimisticPaused,
  PAUSE_CONFIRM_LINES,
  removeAcknowledgement,
  removeConfirmLines,
  resumeRefusalLines,
  saleControl,
} from '../passActions';
import { allReady, readinessReturnNotice } from '../readinessView';
import { publicSaleCopy } from '../../../../../utils/passSaleCopy';
import type { ChannelReadiness, PassRow, PassSummary } from '../../../../../types/creatorBusiness';

const summary = (over: Partial<PassSummary> = {}): PassSummary => ({
  passId: 'p1',
  title: 'Course',
  channelId: 1,
  status: 'on_sale',
  statusLabel: 'On sale',
  publicUrl: 'https://base.tube/p/course',
  price: { amount: 1000, currency: 'EUR', decimals: 2 },
  supply: { cap: 100, remaining: 100, maxPerBuyer: 10 },
  createdAt: '2026-11-01T00:00:00.000Z',
  purchaseBlock: { canPurchase: true, code: null, reason: null },
  salePause: null,
  ...over,
});

describe('saleControl', () => {
  it('pause when selling, resume for your own pause, nothing for BaseTube\'s pause or a draft', () => {
    expect(saleControl(summary())).toEqual({ kind: 'pause' });
    expect(saleControl(summary({ status: 'not_available', purchaseBlock: { canPurchase: false, code: 'PASS_CONTENT_INVALID', reason: 'x' } }))).toEqual({
      kind: 'pause',
    });
    expect(saleControl(summary({ salePause: { by: 'you', at: null, reason: null, canResume: true } }))).toEqual({ kind: 'resume' });
    expect(saleControl(summary({ salePause: { by: 'basetube', at: null, reason: 'Fraud review', canResume: false } }))).toEqual({
      kind: 'basetube',
      reason: 'Fraud review',
    });
    expect(saleControl(summary({ status: 'draft' }))).toEqual({ kind: 'none' });
  });
});

describe('writing an answer into the cached screens', () => {
  const row = (passId: string) => ({ ...summary({ passId }), totals: { purchases: 3 } } as unknown as PassRow);

  it('updates the pass in lists and single-pass answers, keeps its numbers, leaves the rest untouched', () => {
    const list = { items: [row('p1'), row('p2')], pagination: { total: 2 } };
    const paused = summary({ status: 'paused', statusLabel: 'Sales paused' });
    const next = applyPassSummary(list, paused);
    expect(next.items[0]).toMatchObject({ status: 'paused', totals: { purchases: 3 } });
    expect(next.items[1]).toBe(list.items[1]);
    const detail = { pass: summary(), totals: {} };
    expect(applyPassSummary(detail, paused).pass.status).toBe('paused');
    const other = { pass: summary({ passId: 'p9' }) };
    expect(applyPassSummary(other, paused)).toBe(other);
    expect(applyPassSummary({ sources: [] }, paused)).toEqual({ sources: [] });
    expect(findPassSummary(list, 'p2')?.passId).toBe('p2');
  });

  it('optimistic pause: an on-sale pass reads "Sales paused" at once; a pass blocked first keeps its reason', () => {
    const now = new Date('2026-11-13T10:00:00Z');
    expect(optimisticPaused(summary(), now)).toMatchObject({
      status: 'paused',
      purchaseBlock: { canPurchase: false, code: 'PASS_SALE_INACTIVE' },
      salePause: { by: 'you', at: '2026-11-13T10:00:00.000Z', canResume: true },
    });
    const blocked = summary({ status: 'not_available', purchaseBlock: { canPurchase: false, code: 'PASS_CONTENT_INVALID', reason: 'video' } });
    expect(optimisticPaused(blocked, now)).toMatchObject({ status: 'not_available', purchaseBlock: { code: 'PASS_CONTENT_INVALID' }, salePause: { by: 'you' } });
  });
});

describe('confirmations', () => {
  it('says how many buyers a removal concerns, and that nothing is refunded', () => {
    expect(removeConfirmLines(0)[0]).toBe('Nobody holds this pass yet, so nobody loses anything.');
    const sold = removeConfirmLines(3);
    expect(sold[0]).toBe('3 people hold this pass. This video no longer plays for them; removing it takes it out of the pass they hold.');
    expect(sold.join(' ')).toMatch(/Nothing is refunded/);
    expect(removeAcknowledgement(1)).toBe('I understand that this video leaves the pass 1 person holds.');
    expect(removeAcknowledgement(1200)).toBe('I understand that this video leaves the pass 1,200 people hold.');
  });

  it('says access belongs to holders, not to whoever bought first', () => {
    expect(PAUSE_CONFIRM_LINES.join(' ')).toMatch(/Everyone who holds this pass keeps access/);
    expect(PAUSE_CONFIRM_LINES.join(' ')).not.toMatch(/bought/);
  });

  it('lists what blocks a resume', () => {
    expect(
      resumeRefusalLines({
        code: 'SALE_CANNOT_RESUME',
        message: 'Sales stay paused until this is fixed: a b',
        blockers: [
          { code: 'PASS_CONTENT_INVALID', reason: 'a' },
          { code: 'PASS_SOLD_OUT', reason: 'b' },
        ],
      }),
    ).toEqual(['a', 'b']);
    expect(resumeRefusalLines({ code: 'SALE_PAUSED_BY_BASETUBE', message: 'Only BaseTube.' })).toEqual(['Only BaseTube.']);
    expect(resumeRefusalLines(null)).toEqual([]);
  });
});

describe('selling readiness view', () => {
  it('one line only when every channel is ready', () => {
    const ch = (ready: boolean) => ({ ready } as ChannelReadiness);
    expect(allReady([ch(true), ch(true)])).toBe(true);
    expect(allReady([ch(true), ch(false)])).toBe(false);
    expect(allReady([])).toBe(false);
  });

  it('reads the return from YouTube and Stripe', () => {
    expect(readinessReturnNotice(new URLSearchParams('ytLinked=1&period=30d'))).toMatchObject({ kind: 'success', consumed: ['ytLinked'] });
    expect(readinessReturnNotice(new URLSearchParams('ytError=channel_owned'))?.message).toMatch(/another BaseTube account/);
    expect(readinessReturnNotice(new URLSearchParams('ytError=weird'))?.message).toBe('YouTube could not be connected. Please try again.');
    expect(readinessReturnNotice(new URLSearchParams('stripe=return'))).toMatchObject({ kind: 'silent', consumed: ['stripe'] });
    expect(readinessReturnNotice(new URLSearchParams('period=30d'))).toBeNull();
  });
});

describe('buyer-facing copy of a pass that cannot be bought', () => {
  it('is honest about a pause and a sell-out, and never blames anyone', () => {
    expect(publicSaleCopy({ can_purchase: true })).toBeNull();
    expect(publicSaleCopy({ can_purchase: false, purchase_block_reason_code: 'PASS_SALE_INACTIVE' })).toMatchObject({
      headline: 'Sales of this pass are paused.',
      short: 'Sales paused',
    });
    expect(publicSaleCopy({ can_purchase: false, purchase_block_reason_code: 'PASS_SOLD_OUT' })?.headline).toBe('This pass is sold out.');
    expect(publicSaleCopy({ can_purchase: false, purchase_block_reason_code: 'PASS_NOT_ONCHAIN' })?.headline).toBe('This pass is not for sale yet.');
    expect(publicSaleCopy({ can_purchase: false, purchase_block_reason_code: 'PASS_CONTENT_INVALID' })?.headline).toBe(
      'This pass cannot be bought right now.',
    );
  });
});
