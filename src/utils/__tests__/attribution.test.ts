import {
  ATTRIBUTION_TTL_MS,
  applyArrival,
  buildAttributionPayload,
  classifyArrival,
  isLikelyBot,
  isPrivacySignalOn,
  landingFromPath,
  newVisitorKey,
  parseStoredAttribution,
  type StoredAttribution,
} from '../attribution';

const SITE = 'https://beta.base.tube';
const T0 = new Date('2026-11-01T10:00:00.000Z');
const later = (ms: number) => new Date(T0.getTime() + ms);
const DAY = 24 * 60 * 60 * 1000;

const arrive = (state: StoredAttribution | undefined, href: string, referrer = '', now = T0, navigationType = 'navigate') =>
  applyArrival(state, classifyArrival({ href, referrer, navigationType, now }), now);

describe('classifyArrival', () => {
  it('records UTM tags, the referrer origin only, and the landing page', () => {
    const result = classifyArrival({
      href: `${SITE}/p/cooking-masterclass?utm_source=youtube&utm_medium=video&utm_campaign=launch&gclid=abc`,
      referrer: 'https://www.youtube.com/watch?v=xyz&t=10',
      now: T0,
    });
    expect(result).toEqual({
      kind: 'source',
      touch: {
        source: 'youtube',
        medium: 'video',
        campaign: 'launch',
        referrer: 'https://www.youtube.com',
        landingPath: '/p/cooking-masterclass',
        landingKind: 'pass_page',
        landingRef: 'cooking-masterclass',
        at: T0.toISOString(),
      },
    });
  });

  it('treats a visit with no tags and no outside referrer as direct', () => {
    expect(classifyArrival({ href: `${SITE}/channel/42`, referrer: '', now: T0 })).toMatchObject({
      kind: 'direct',
      touch: { landingKind: 'channel_page', landingRef: '42' },
    });
  });

  it('ignores internal navigation, including other base.tube hosts', () => {
    expect(classifyArrival({ href: `${SITE}/p/x`, referrer: `${SITE}/discover`, now: T0 }).kind).toBe('ignored');
    expect(classifyArrival({ href: `${SITE}/p/x?utm_source=x`, referrer: 'https://base.tube/ai-thumbnails', now: T0 }).kind).toBe('ignored');
  });

  it('ignores returns from Stripe and sign-in, by path, query or referrer', () => {
    const returns = [
      { href: `${SITE}/pay/success?session_id=cs_123`, referrer: 'https://checkout.stripe.com/' },
      { href: `${SITE}/p/x?session_id=cs_123`, referrer: '' },
      { href: `${SITE}/p/x`, referrer: 'https://checkout.stripe.com/c/pay/cs_123' },
      { href: `${SITE}/sign-in/factor-one`, referrer: '' },
      { href: `${SITE}/ai-thumbnails/auth/continue`, referrer: '' },
      { href: `${SITE}/p/x`, referrer: 'https://clever-cat-12.clerk.accounts.dev/' },
      { href: `${SITE}/p/x`, referrer: 'https://accounts.google.com/' },
      { href: `${SITE}/p/x?__clerk_status=verified`, referrer: '' },
    ];
    returns.forEach((input) => {
      expect(classifyArrival({ ...input, now: T0 })).toEqual({ kind: 'ignored', reason: 'return' });
    });
  });

  it('ignores reloads and back/forward', () => {
    expect(classifyArrival({ href: `${SITE}/p/x?utm_source=x`, referrer: '', navigationType: 'reload', now: T0 }).kind).toBe('ignored');
    expect(classifyArrival({ href: `${SITE}/p/x`, referrer: '', navigationType: 'back_forward', now: T0 }).kind).toBe('ignored');
  });

  it('truncates long values and ignores non-web referrers', () => {
    const result = classifyArrival({
      href: `${SITE}/video/1?utm_source=${'s'.repeat(300)}&utm_medium=${'m'.repeat(300)}&utm_campaign=${'c'.repeat(300)}`,
      referrer: 'android-app://com.google.android.gm/',
      now: T0,
    });
    if (result.kind !== 'source') throw new Error('expected a source touch');
    expect(result.touch.source).toHaveLength(100);
    expect(result.touch.medium).toHaveLength(64);
    expect(result.touch.campaign).toHaveLength(128);
    expect(result.touch.referrer).toBeUndefined();
  });
});

describe('landingFromPath', () => {
  it('maps pass, watch, channel, video and embed pages; everything else is other', () => {
    expect(landingFromPath('/p/my-pass')).toEqual({ landingKind: 'pass_page', landingRef: 'my-pass' });
    expect(landingFromPath('/watch/uuid-1')).toEqual({ landingKind: 'pass_page', landingRef: 'uuid-1' });
    expect(landingFromPath('/channel/@chef')).toEqual({ landingKind: 'channel_page', landingRef: '@chef' });
    expect(landingFromPath('/video/9')).toEqual({ landingKind: 'video_page', landingRef: '9' });
    expect(landingFromPath('/embed/9')).toEqual({ landingKind: 'video_page', landingRef: '9' });
    expect(landingFromPath('/')).toEqual({ landingKind: 'other' });
    expect(landingFromPath('/p')).toEqual({ landingKind: 'other' });
    expect(landingFromPath(`/p/${'x'.repeat(100)}`).landingRef).toHaveLength(64);
  });
});

describe('first touch and last non-direct touch', () => {
  it('keeps the first touch, and a direct visit never overwrites a real source', () => {
    let state = arrive(undefined, `${SITE}/p/x?utm_source=instagram`, 'https://l.instagram.com/');
    state = arrive(state, `${SITE}/p/x`, '', later(DAY));
    expect(state.first?.source).toBe('instagram');
    expect(state.last?.source).toBe('instagram');

    state = arrive(state, `${SITE}/channel/5`, 'https://www.google.com/', later(2 * DAY));
    expect(state.first?.source).toBe('instagram');
    expect(state.last?.referrer).toBe('https://www.google.com');
  });

  it('a direct first visit becomes the first touch but not the last touch', () => {
    const state = arrive(undefined, `${SITE}/`);
    expect(state.first?.landingKind).toBe('other');
    expect(state.last).toBeUndefined();
  });

  it('forgets touches after 30 days', () => {
    let state = arrive(undefined, `${SITE}/p/x?utm_source=tiktok`);
    state = arrive(state, `${SITE}/`, '', later(ATTRIBUTION_TTL_MS + 1));
    expect(state.last).toBeUndefined();
    expect(state.first?.at).toBe(later(ATTRIBUTION_TTL_MS + 1).toISOString());
  });
});

describe('buildAttributionPayload', () => {
  it('sends the last non-direct touch with the first-touch time', () => {
    let state = arrive(undefined, `${SITE}/`);
    state = arrive(state, `${SITE}/p/x?utm_source=newsletter&utm_campaign=nov`, '', later(DAY));
    expect(buildAttributionPayload(state, later(2 * DAY))).toEqual({
      source: 'newsletter',
      campaign: 'nov',
      landingPath: '/p/x',
      landingKind: 'pass_page',
      landingRef: 'x',
      firstTouchAt: T0.toISOString(),
    });
  });

  it('falls back to the first touch, and sends nothing when nothing is fresh', () => {
    const state = arrive(undefined, `${SITE}/video/3`);
    expect(buildAttributionPayload(state, later(DAY))).toEqual({
      landingPath: '/video/3',
      landingKind: 'video_page',
      landingRef: '3',
      firstTouchAt: T0.toISOString(),
    });
    expect(buildAttributionPayload(state, later(ATTRIBUTION_TTL_MS + 1))).toBeUndefined();
    expect(buildAttributionPayload(undefined, T0)).toBeUndefined();
  });
});

describe('parseStoredAttribution', () => {
  it('survives corrupt storage and drops malformed touches', () => {
    expect(parseStoredAttribution('not json')).toEqual({});
    expect(parseStoredAttribution(null)).toEqual({});
    expect(parseStoredAttribution(JSON.stringify({ first: { at: 1 }, last: 'x' }))).toEqual({});
    const parsed = parseStoredAttribution(
      JSON.stringify({ last: { at: T0.toISOString(), landingPath: '/p/a', landingKind: 'weird', source: 'x'.repeat(500) } })
    );
    expect(parsed.last).toEqual({ at: T0.toISOString(), landingPath: '/p/a', landingKind: 'other', source: 'x'.repeat(100) });
  });
});

describe('privacy signals, bots, visitor key', () => {
  it('honours Global Privacy Control and Do-Not-Track', () => {
    expect(isPrivacySignalOn({ globalPrivacyControl: true })).toBe(true);
    expect(isPrivacySignalOn({ doNotTrack: '1' })).toBe(true);
    expect(isPrivacySignalOn({ msDoNotTrack: '1' })).toBe(true);
    expect(isPrivacySignalOn({}, { doNotTrack: '1' })).toBe(true);
    expect(isPrivacySignalOn({ doNotTrack: '0', globalPrivacyControl: false })).toBe(false);
    expect(isPrivacySignalOn({ doNotTrack: 'unspecified' })).toBe(false);
  });

  it('flags crawlers, previewers and automation but not in-app browsers', () => {
    expect(isLikelyBot('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')).toBe(true);
    expect(isLikelyBot('facebookexternalhit/1.1')).toBe(true);
    expect(isLikelyBot('Mozilla/5.0 HeadlessChrome/120.0')).toBe(true);
    expect(isLikelyBot('Mozilla/5.0 (Macintosh) Chrome/120.0 Safari/537.36', true)).toBe(true);
    expect(isLikelyBot('')).toBe(true);
    expect(isLikelyBot('Mozilla/5.0 (iPhone) Mobile/15E148 Instagram 300.0')).toBe(false);
    expect(isLikelyBot('Mozilla/5.0 (iPhone) Mobile/15E148 [LinkedInApp]')).toBe(false);
    expect(isLikelyBot('Mozilla/5.0 (Windows NT 10.0) Chrome/120.0 Safari/537.36')).toBe(false);
  });

  it('makes a random key from the crypto generator, never without one', () => {
    expect(newVisitorKey({ getRandomValues: (a: any) => a, randomUUID: () => 'uuid-from-crypto' } as any)).toBe('uuid-from-crypto');
    const fixed = (arr: Uint8Array) => {
      arr.fill(171);
      return arr;
    };
    expect(newVisitorKey({ getRandomValues: fixed } as any)).toBe('ab'.repeat(16));
    expect(newVisitorKey(undefined)).toBeNull();
  });
});
