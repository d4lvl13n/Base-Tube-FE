import type { PassWatchAggregate } from '../../../../../api/creatorBusiness';
import type { DailyPoint, MoneyLine, PassRow, PurchaseBlock } from '../../../../../types/creatorBusiness';
import {
  averageWatchedText,
  campaignSlug,
  currencySeries,
  deltaText,
  emailHiddenText,
  formatMinor,
  formatRatio,
  holdingText,
  idleCurrencyText,
  isActivePair,
  moneyDeltaText,
  nextStep,
  pairMoneyLines,
  playsText,
  previewText,
  saleState,
  startedText,
  stepConversion,
  taggedLink,
  toMajor,
  videosOpenedText,
  watchPeriodFor,
} from '../businessFormat';

/** Intl puts a no-break space between code and amount; compare with plain spaces. */
const plain = (text: string) => text.replace(/[  ]/g, ' ');
const L = 'en-GB';

describe('money', () => {
  it('uses the currency decimals: USDC has 6, so it is never shown 10,000 times too large', () => {
    expect(toMajor(12_500_000, 6)).toBe(12.5);
    expect(toMajor(1250, 2)).toBe(12.5);
    expect(plain(formatMinor(12_500_000, 'USDC', 6, { locale: L }))).toBe('USDC 12.50');
    expect(plain(formatMinor(1250, 'EUR', 2, { locale: L }))).toBe('EUR 12.50');
  });

  it('keeps small crypto amounts instead of rounding them to zero', () => {
    expect(plain(formatMinor(4_000, 'USDC', 6, { locale: L }))).toBe('USDC 0.004');
    expect(plain(formatMinor(1, 'USDC', 6, { locale: L }))).toBe('USDC 0.000001');
  });

  it('writes every currency the same way: code first, then the amount', () => {
    expect(['EUR', 'USD', 'USDC'].map((code) => plain(formatMinor(code === 'USDC' ? 112_500_000 : 11_250, code, code === 'USDC' ? 6 : 2, { locale: L })))).toEqual([
      'EUR 112.50',
      'USD 112.50',
      'USDC 112.50',
    ]);
    expect(plain(formatMinor(136_620, 'EUR', 2, { locale: L }))).toBe('EUR 1,366.20');
    expect(plain(formatMinor(0, 'USD', 2, { locale: L }))).toBe('USD 0.00');
  });

  it('keeps the code first in every language; only the digits follow the locale', () => {
    expect(plain(formatMinor(123456, 'EUR', 2, { locale: 'de-DE' }))).toBe('EUR 1.234,56');
    expect(plain(formatMinor(64_710, 'EUR', 2, { locale: 'fr-FR' }))).toBe('EUR 647,10');
    expect(plain(formatMinor(434_700_000, 'USDC', 6, { locale: 'fr-FR' }))).toBe('USDC 434,70');
  });

  it('keeps the code and the amount on one line', () => {
    expect(formatMinor(1250, 'EUR', 2, { locale: L })).toBe('EUR 12.50');
  });

  it('signs differences, but not zero', () => {
    expect(plain(formatMinor(300, 'EUR', 2, { locale: L, signed: true }))).toBe('+EUR 3.00');
    expect(plain(formatMinor(-300, 'EUR', 2, { locale: L, signed: true }))).toBe('-EUR 3.00');
    expect(plain(formatMinor(0, 'EUR', 2, { locale: L, signed: true }))).toBe('EUR 0.00');
  });
});

describe('comparisons', () => {
  it('shows no percentage when the previous value is 0', () => {
    expect(deltaText(3, 0, 'previous 30 days', L)).toBe('+3 vs previous 30 days');
  });

  it('shows the change and its percentage otherwise', () => {
    expect(deltaText(6, 4, 'previous 30 days', L)).toBe('+2 (+50%) vs previous 30 days');
    expect(deltaText(3, 5, 'previous 7 days', L)).toBe('-2 (-40%) vs previous 7 days');
    expect(deltaText(5, 5, 'previous 7 days', L)).toBe('Same as previous 7 days');
  });

  it('compares money within one currency', () => {
    expect(plain(moneyDeltaText(1500, 0, 'EUR', 2, 'previous 30 days', L))).toBe('+EUR 15.00 vs previous 30 days');
    expect(plain(moneyDeltaText(1500, 3000, 'EUR', 2, 'previous 30 days', L))).toBe('-EUR 15.00 (-50%) vs previous 30 days');
  });

  it('pairs currencies of both periods without adding them together', () => {
    const line = (currency: string, decimals: number, proceeds: number) => ({ currency, decimals, proceeds }) as MoneyLine;
    const pairs = pairMoneyLines([line('USDC', 6, 9_000_000), line('EUR', 2, 900)], [line('EUR', 2, 450), line('USD', 2, 100)]);
    expect(pairs.map((p) => [p.currency, p.current?.proceeds ?? null, p.previous?.proceeds ?? null])).toEqual([
      ['EUR', 900, 450],
      ['USD', null, 100],
      ['USDC', 9_000_000, null],
    ]);
  });
});

describe('conversion', () => {
  it('is null when there is nothing to divide by', () => {
    expect(stepConversion(3, 0)).toBeNull();
    expect(stepConversion(3, null)).toBeNull();
    expect(stepConversion(1, 4)).toBe(0.25);
    expect(formatRatio(0.125, L)).toBe('12.5%');
  });
});

describe('currencySeries', () => {
  it('keeps every point the API sent (weeks here), per currency, zero where that currency was not paid', () => {
    const daily: DailyPoint[] = [
      { day: '2026-11-04', end: '2026-11-08', purchases: 0, buyers: 0, money: [] },
      {
        day: '2026-11-09',
        end: '2026-11-15',
        purchases: 2,
        buyers: 2,
        money: [
          { currency: 'EUR', decimals: 2, purchases: 1, proceeds: 900 },
          { currency: 'USDC', decimals: 6, purchases: 1, proceeds: 9_000_000 },
        ],
      },
    ];
    const series = currencySeries(daily);
    expect(series.map((s) => s.currency)).toEqual(['EUR', 'USDC']);
    expect(series[0].days).toEqual([
      { day: '2026-11-04', end: '2026-11-08', proceeds: 0, proceedsMinor: 0, purchases: 0 },
      { day: '2026-11-09', end: '2026-11-15', proceeds: 9, proceedsMinor: 900, purchases: 1 },
    ]);
    expect(series[1].days[1].proceeds).toBe(9);
  });

  it('has no series when nothing was paid', () => {
    expect(currencySeries([{ day: '2026-11-01', end: '2026-11-01', purchases: 0, buyers: 0, money: [] }])).toEqual([]);
  });
});

describe('currencies with nothing in the period', () => {
  const line = (currency: string, decimals: number, proceeds: number, purchases = 1) => ({ currency, decimals, proceeds, purchases }) as MoneyLine;
  const pairs = pairMoneyLines(
    [line('EUR', 2, 64_710), line('USDC', 6, 252_000_000)],
    [line('EUR', 2, 48_600), line('USD', 2, 3_240), line('USDC', 6, 161_100_000)],
  );

  it('gives a block only to the currencies with something in the period', () => {
    expect(pairs.filter(isActivePair).map((p) => p.currency)).toEqual(['EUR', 'USDC']);
  });

  it('says it in one quiet line instead of an empty block or "-100%"', () => {
    const usd = pairs.find((p) => p.currency === 'USD')!;
    expect(plain(idleCurrencyText(usd, 'previous 30 days', L) as string)).toBe('No USD sales in this period (USD 32.40 in the previous 30 days).');
    expect(idleCurrencyText(usd, null, L)).toBe('No USD sales in this period.');
    expect(idleCurrencyText(pairs[0], 'previous 30 days', L)).toBeNull();
  });

  it('keeps a currency whose purchases were all refunded (its refund lines explain the zero)', () => {
    const refunded = pairMoneyLines([line('EUR', 2, 0, 2)], [])[0];
    expect(isActivePair(refunded)).toBe(true);
  });

  it('never writes "-100%" for money that dropped to nothing', () => {
    expect(plain(moneyDeltaText(0, 3240, 'USD', 2, 'previous 30 days', L))).toBe('-USD 32.40 vs previous 30 days');
    expect(plain(moneyDeltaText(64_710, 48_600, 'EUR', 2, 'previous 30 days', L))).toBe('+EUR 161.10 (+33%) vs previous 30 days');
  });
});

describe('saleState', () => {
  const block = (code: PurchaseBlock['code'], reason: string | null = code ? `reason ${code}` : null): PurchaseBlock => ({
    canPurchase: code === null,
    code,
    reason,
  });
  const pass = (status: PassRow['status'], statusLabel: string, purchaseBlock: PurchaseBlock) => ({
    passId: 'p1',
    title: 'Pass',
    status,
    statusLabel,
    purchaseBlock,
  });

  it('says On sale only when someone can buy it', () => {
    expect(saleState(pass('on_sale', 'On sale', block(null)))).toMatchObject({ onSale: true, label: 'On sale', reason: null, fix: null });
    // A contradictory answer never reads "On sale".
    expect(saleState(pass('on_sale', 'On sale', block('PASS_SOLD_OUT')))).toMatchObject({ onSale: false, label: 'Cannot be bought right now' });
  });

  it('gives the reason and the fix the creator can do', () => {
    const draft = saleState(pass('draft', 'Draft', block('PASS_NOT_PUBLISHED')));
    expect(draft).toMatchObject({ onSale: false, label: 'Draft', reason: 'reason PASS_NOT_PUBLISHED' });
    expect(draft.fix).toEqual({ kind: 'link', label: 'Finish publishing', href: '/creator-hub/create-content-pass?draft=p1', external: false });
    expect(saleState(pass('not_available', 'Cannot be bought yet', block('PASS_CONTENT_INVALID')), { videoCount: 0 }).fix).toMatchObject({
      label: 'Add a YouTube video',
      href: '/creator-hub/passes/p1#pass-videos',
    });
    // A broken video is the creator's to fix now (replace, remove, check again): no email.
    expect(saleState(pass('not_available', 'Cannot be bought yet', block('PASS_CONTENT_INVALID')), { videoCount: 2 }).fix).toEqual({
      kind: 'link',
      label: 'Fix the videos',
      href: '/creator-hub/passes/p1#pass-videos',
      external: false,
    });
    expect(saleState(pass('publishing', 'Being published', block('PASS_NOT_PUBLISHED'))).fix).toBeNull();
  });

  it('resumes the creator\'s own pause right there', () => {
    const paused = saleState(pass('paused', 'Sales paused', block('PASS_SALE_INACTIVE')));
    expect(paused.fix).toEqual({ kind: 'resume', label: 'Resume sales', passId: 'p1' });
    expect(paused.tone).toBe('stopped');
  });

  it('sends a channel that cannot sell to Selling readiness', () => {
    const state = saleState({ ...pass('not_available', 'Cannot be bought yet', block('PASS_CHANNEL_NOT_APPROVED')), channelId: 4 });
    expect(state.fix).toEqual({ kind: 'link', label: 'See what is missing', href: '/creator-hub/business?channel=4#selling-readiness', external: false });
  });

  it('points to BaseTube only when only BaseTube can fix it, with its reason', () => {
    const byBaseTube = saleState({
      ...pass('paused_by_basetube', 'Paused by BaseTube', block('PASS_SALE_PAUSED_BY_BASETUBE')),
      salePause: { by: 'basetube', at: null, reason: 'Chargebacks under review', canResume: false },
    });
    expect(byBaseTube).toMatchObject({ tone: 'blocked', basetubeReason: 'Chargebacks under review' });
    expect(byBaseTube.fix).toMatchObject({ kind: 'link', label: 'Contact BaseTube', external: true });
    expect(byBaseTube.fix?.kind === 'link' && byBaseTube.fix.href.startsWith('mailto:hello@base.tube?subject=')).toBe(true);
    expect(saleState(pass('not_available', 'Cannot be bought yet', block('PASS_NOT_ONCHAIN'))).fix).toMatchObject({ external: true });
  });

  it('has no fix for sold out or for sales switched off on BaseTube', () => {
    expect(saleState(pass('sold_out', 'Sold out', block('PASS_SOLD_OUT'))).fix).toBeNull();
    expect(saleState(pass('sales_off', 'Sales switched off on BaseTube', block('CONTENT_PASSES_DISABLED')))).toMatchObject({
      onSale: false,
      tone: 'blocked',
      fix: null,
      reason: 'reason CONTENT_PASSES_DISABLED',
    });
  });
});

describe('pass-video plays', () => {
  const row = (over: Partial<PassWatchAggregate> = {}): PassWatchAggregate => ({
    buyersStarted: 6,
    buyersCompleted: 2,
    averagePercentWatched: 62.5,
    watchSeconds: 7_500,
    averagesWithheld: false,
    creatorPreview: { sessions: 0, watchSeconds: 0 },
    ...over,
  });

  it('maps the business period to the periods the plays endpoint knows', () => {
    expect(watchPeriodFor('7d')).toEqual({ period: '7d', exact: true });
    expect(watchPeriodFor('all')).toEqual({ period: 'all', exact: true });
    expect(watchPeriodFor('12m')).toEqual({ period: 'all', exact: false });
    expect(watchPeriodFor('custom')).toEqual({ period: 'all', exact: false });
  });

  it('writes started / finished against the buyers who hold the pass now', () => {
    expect(playsText(row(), 8, L)).toBe('Started by 6 of 8 buyers · Finished by 2');
    // More started in the period than hold it now (refunds): no "of".
    expect(startedText(3, 2, L)).toBe('Started by 3 buyers');
    expect(startedText(1, 0, L)).toBe('Started by 1 buyer');
  });

  it('shows the average and watch time, or says why they are withheld', () => {
    expect(averageWatchedText(row(), 5, L)).toBe('Average watched 62.5% · 2 h 5 min watched in total');
    expect(averageWatchedText(row({ averagePercentWatched: null }), 5, L)).toBe(
      'Average watched not known (no video length) · 2 h 5 min watched in total',
    );
    expect(averageWatchedText(row({ averagesWithheld: true, averagePercentWatched: null, watchSeconds: null }), 5, L)).toBe(
      "Average and watch time shown once at least 5 buyers have watched (to protect each buyer's privacy)",
    );
  });

  it("keeps the creator's own previews apart", () => {
    expect(previewText(row(), L)).toBeNull();
    expect(previewText(row({ creatorPreview: { sessions: 2, watchSeconds: 190 } }), L)).toBe('2 plays, 3 min 10 s');
  });
});

describe('people', () => {
  it('says why an email is hidden', () => {
    expect(emailHiddenText('bought_before_disclosure')).toBe(
      'Email hidden: bought before buyers were told their email is shared with you',
    );
    expect(emailHiddenText('no_real_address')).toBe('No email: this buyer signed in without a real email address');
  });

  it('says how many videos of a pass the buyer opened', () => {
    expect(videosOpenedText(3, 5)).toBe('Opened 3 of 5 videos');
    expect(videosOpenedText(1, 1)).toBe('Opened 1 of 1 video');
    expect(videosOpenedText(0, 5)).toBe('Not opened yet');
  });

  it('says what the customer has in plain words, and a second fact only when it differs', () => {
    const row = (passesBought: number, passesHeld: number, accessState: 'active' | 'refunded' | 'disputed' | 'none') => ({
      passesBought,
      passesHeld,
      accessState,
    });
    expect(holdingText(row(2, 2, 'active'), L)).toEqual({ main: '2 passes', note: null });
    expect(holdingText(row(1, 1, 'active'), L)).toEqual({ main: '1 pass', note: null });
    expect(holdingText(row(3, 2, 'active'), L)).toEqual({ main: '2 passes', note: '1 more refunded or disputed' });
    expect(holdingText(row(1, 0, 'refunded'), L)).toEqual({ main: 'No pass now', note: 'Refunded' });
    expect(holdingText(row(1, 0, 'disputed'), L)).toEqual({ main: 'No pass now', note: 'Disputed by their bank' });
    expect(holdingText(row(1, 0, 'none'), L)).toEqual({ main: 'No pass now', note: 'No longer has access' });
    // No "held", no "units".
    expect(JSON.stringify(holdingText(row(3, 2, 'active'), L))).not.toMatch(/held|unit/i);
  });
});

describe('nextStep', () => {
  const row = (passId: string, status: PassRow['status']) =>
    ({ passId, title: passId, status, publicUrl: `https://base.tube/p/${passId}` }) as PassRow;

  it('asks for a first pass, then to share the one on sale, then to finish a draft', () => {
    expect(nextStep([])).toEqual({ kind: 'no_pass' });
    expect(nextStep([row('a', 'draft'), row('b', 'on_sale')])).toMatchObject({ kind: 'share', passId: 'b', publicUrl: 'https://base.tube/p/b' });
    expect(nextStep([row('a', 'publish_failed'), row('b', 'draft')])).toMatchObject({ kind: 'draft', passId: 'a' });
    expect(nextStep([row('a', 'paused'), row('b', 'sold_out')])).toEqual({ kind: 'not_selling' });
  });
});

describe('tagged links', () => {
  it('adds UTM tags to the pass link and keeps what is already there', () => {
    expect(taggedLink('https://base.tube/p/my-pass', { source: 'youtube', medium: 'video_description', campaign: 'Spring launch!' })).toBe(
      'https://base.tube/p/my-pass?utm_source=youtube&utm_medium=video_description&utm_campaign=spring-launch',
    );
    expect(taggedLink('https://base.tube/p/x?ref=1&utm_source=old', { source: 'instagram', medium: 'bio' })).toBe(
      'https://base.tube/p/x?ref=1&utm_source=instagram&utm_medium=bio',
    );
    expect(taggedLink('not a url', { source: 'x', medium: 'post' })).toBe('not a url');
  });

  it('turns a campaign name into a clean tag', () => {
    expect(campaignSlug('  Été 2026 — Drop #1 ')).toBe('ete-2026-drop-1');
    expect(campaignSlug('!!!')).toBe('');
  });
});
