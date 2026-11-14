/**
 * Where a buyer came from: first touch and last non-direct touch, kept in this
 * browser only (localStorage, no cookie, no third party). Nothing leaves the
 * browser until a pass-page visit beacon or a pass checkout sends it.
 *
 * - First touch: the first arrival on the site, kept 30 days.
 * - Last non-direct touch: the latest arrival that had a real source (a UTM
 *   tag or an outside referrer), kept 30 days. A direct visit never
 *   overwrites it.
 * - Never a touch: internal navigation, page reloads / back-forward, returns
 *   from Stripe or from sign-in.
 * - Do-Not-Track / Global Privacy Control on: nothing is recorded or sent.
 *
 * The server normalises and truncates every value; the client only trims
 * lengths so a request never carries a huge string.
 *
 * Pure functions first (unit-tested); the thin browser glue is at the bottom.
 */

export type LandingKind = 'pass_page' | 'channel_page' | 'video_page' | 'other';

export interface AttributionTouch {
  source?: string;
  medium?: string;
  campaign?: string;
  /** Origin of the outside page only (scheme + host), never its path or query. */
  referrer?: string;
  landingPath: string;
  landingKind: LandingKind;
  landingRef?: string;
  /** ISO timestamp of the arrival. */
  at: string;
}

export interface StoredAttribution {
  first?: AttributionTouch;
  last?: AttributionTouch;
}

/** Request shape shared with the backend (contract field names). */
export interface AttributionPayload {
  source?: string;
  medium?: string;
  campaign?: string;
  referrer?: string;
  landingPath?: string;
  landingKind?: LandingKind;
  landingRef?: string;
  firstTouchAt?: string;
}

export type ArrivalResult =
  | { kind: 'ignored'; reason: 'repeat' | 'return' | 'internal' }
  | { kind: 'direct'; touch: AttributionTouch }
  | { kind: 'source'; touch: AttributionTouch };

export const ATTRIBUTION_STORAGE_KEY = 'bt_attribution_v1';
export const VISITOR_KEY_STORAGE_KEY = 'bt_visitor_key';
export const ATTRIBUTION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const ATTRIBUTION_LIMITS = {
  source: 100,
  medium: 64,
  campaign: 128,
  referrer: 255,
  landingPath: 512,
  landingRef: 64,
} as const;

/** Landing paths that are a return from payment or sign-in, never a new arrival. */
const RETURN_PATH_PREFIXES = [
  '/pay/',
  '/credits/',
  '/ai-thumbnails/billing/',
  '/ai-thumbnails/sign-in',
  '/ai-thumbnails/sign-up',
  '/ai-thumbnails/auth/',
  '/sign-in',
  '/sign-up',
  '/signin',
  '/signup',
  '/sso-callback',
  '/onboarding',
  '/dashboard/creator',
];

/** Query parameters that only appear on a return from Stripe or Clerk. */
const RETURN_QUERY_PARAMS = ['session_id', '__clerk_status', '__clerk_ticket', '__clerk_db_jwt', '__clerk_handshake'];

/** Referrer hosts of payment and sign-in providers: a return, not a source. */
const RETURN_REFERRER_HOSTS = [
  'stripe.com',
  'clerk.com',
  'clerk.accounts.dev',
  'accounts.dev',
  'accounts.google.com',
  'appleid.apple.com',
];

/**
 * Crawlers and link-preview fetchers. In-app browsers (Instagram, TikTok,
 * LinkedIn, Pinterest apps) are real people and must NOT match.
 */
const BOT_PATTERN =
  /bot\b|bot\/|crawl|spider|slurp|mediapartners|bingpreview|facebookexternalhit|embedly|quora link preview|whatsapp\/|headlesschrome|phantomjs|prerender|lighthouse|pagespeed|pingdom/i;

const clip = (value: string | null | undefined, max: number): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
};

const hostMatches = (host: string, domain: string) => host === domain || host.endsWith(`.${domain}`);

/** Last two labels of a host name ("beta.base.tube" → "base.tube"). */
const siteOf = (host: string): string => host.split('.').slice(-2).join('.');

/** Scheme + host of an http(s) referrer, or null when there is none / it is not a web page. */
export function referrerOrigin(referrer: string | null | undefined): URL | null {
  if (!referrer) return null;
  try {
    const url = new URL(referrer);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url;
  } catch {
    return null;
  }
}

/** What kind of page the visitor landed on, and its id or slug from the URL. */
export function landingFromPath(pathname: string): { landingKind: LandingKind; landingRef?: string } {
  const segments = pathname.split('/').filter(Boolean);
  const [first, second] = segments;
  const ref = second ? clip(decodeSafe(second), ATTRIBUTION_LIMITS.landingRef) : undefined;
  if ((first === 'p' || first === 'watch') && ref) return { landingKind: 'pass_page', landingRef: ref };
  if (first === 'channel' && ref) return { landingKind: 'channel_page', landingRef: ref };
  if ((first === 'video' || first === 'embed') && ref) return { landingKind: 'video_page', landingRef: ref };
  return { landingKind: 'other' };
}

function decodeSafe(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Decide what an arrival (one full page load) means.
 * `navigationType` comes from the Navigation Timing API ('navigate' | 'reload' | 'back_forward' | 'prerender').
 */
export function classifyArrival(input: {
  href: string;
  referrer: string;
  navigationType?: string;
  now: Date;
}): ArrivalResult {
  if (input.navigationType === 'reload' || input.navigationType === 'back_forward') {
    return { kind: 'ignored', reason: 'repeat' };
  }

  let url: URL;
  try {
    url = new URL(input.href);
  } catch {
    return { kind: 'ignored', reason: 'internal' };
  }

  const path = url.pathname || '/';
  if (RETURN_PATH_PREFIXES.some((prefix) => path === prefix.replace(/\/$/, '') || path.startsWith(prefix))) {
    return { kind: 'ignored', reason: 'return' };
  }
  if (RETURN_QUERY_PARAMS.some((param) => url.searchParams.has(param))) {
    return { kind: 'ignored', reason: 'return' };
  }

  const ref = referrerOrigin(input.referrer);
  if (ref) {
    const refHost = ref.hostname.toLowerCase();
    const ownHost = url.hostname.toLowerCase();
    if (refHost === ownHost || hostMatches(refHost, siteOf(ownHost))) {
      return { kind: 'ignored', reason: 'internal' };
    }
    if (RETURN_REFERRER_HOSTS.some((domain) => hostMatches(refHost, domain))) {
      return { kind: 'ignored', reason: 'return' };
    }
  }

  const source = clip(url.searchParams.get('utm_source'), ATTRIBUTION_LIMITS.source);
  const medium = clip(url.searchParams.get('utm_medium'), ATTRIBUTION_LIMITS.medium);
  const campaign = clip(url.searchParams.get('utm_campaign'), ATTRIBUTION_LIMITS.campaign);
  const referrer = ref ? clip(ref.origin, ATTRIBUTION_LIMITS.referrer) : undefined;

  const touch: AttributionTouch = {
    ...(source ? { source } : {}),
    ...(medium ? { medium } : {}),
    ...(campaign ? { campaign } : {}),
    ...(referrer ? { referrer } : {}),
    landingPath: clip(path, ATTRIBUTION_LIMITS.landingPath) ?? '/',
    ...landingFromPath(path),
    at: input.now.toISOString(),
  };

  return source || medium || campaign || referrer ? { kind: 'source', touch } : { kind: 'direct', touch };
}

const isFresh = (touch: AttributionTouch | undefined, now: Date): touch is AttributionTouch => {
  if (!touch) return false;
  const at = Date.parse(touch.at);
  if (!Number.isFinite(at)) return false;
  // A timestamp in the future (clock change) is treated as fresh only up to one TTL ahead.
  return now.getTime() - at < ATTRIBUTION_TTL_MS && at - now.getTime() < ATTRIBUTION_TTL_MS;
};

/** Drop touches older than 30 days. */
export function pruneExpired(state: StoredAttribution | null | undefined, now: Date): StoredAttribution {
  const next: StoredAttribution = {};
  if (isFresh(state?.first, now)) next.first = state!.first;
  if (isFresh(state?.last, now)) next.last = state!.last;
  return next;
}

/** Record an arrival: first touch once, last touch only from a real source. */
export function applyArrival(
  state: StoredAttribution | null | undefined,
  arrival: ArrivalResult,
  now: Date
): StoredAttribution {
  const next = pruneExpired(state, now);
  if (arrival.kind === 'ignored') return next;
  if (!next.first) next.first = arrival.touch;
  if (arrival.kind === 'source') next.last = arrival.touch;
  return next;
}

/** The attribution to send: last non-direct touch, else the first touch; plus when the first touch happened. */
export function buildAttributionPayload(
  state: StoredAttribution | null | undefined,
  now: Date
): AttributionPayload | undefined {
  const fresh = pruneExpired(state, now);
  const base = fresh.last ?? fresh.first;
  if (!base) return undefined;
  const payload: AttributionPayload = {
    source: clip(base.source, ATTRIBUTION_LIMITS.source),
    medium: clip(base.medium, ATTRIBUTION_LIMITS.medium),
    campaign: clip(base.campaign, ATTRIBUTION_LIMITS.campaign),
    referrer: clip(base.referrer, ATTRIBUTION_LIMITS.referrer),
    landingPath: clip(base.landingPath, ATTRIBUTION_LIMITS.landingPath),
    landingKind: base.landingKind,
    landingRef: clip(base.landingRef, ATTRIBUTION_LIMITS.landingRef),
    firstTouchAt: (fresh.first ?? base).at,
  };
  (Object.keys(payload) as Array<keyof AttributionPayload>).forEach((key) => {
    if (payload[key] === undefined) delete payload[key];
  });
  return payload;
}

/** Parse stored JSON, keeping only well-formed touches. */
export function parseStoredAttribution(raw: string | null | undefined): StoredAttribution {
  if (!raw) return {};
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    const out: StoredAttribution = {};
    const first = toTouch(value?.first);
    const last = toTouch(value?.last);
    if (first) out.first = first;
    if (last) out.last = last;
    return out;
  } catch {
    return {};
  }
}

const LANDING_KINDS: LandingKind[] = ['pass_page', 'channel_page', 'video_page', 'other'];

function toTouch(value: unknown): AttributionTouch | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const v = value as Record<string, unknown>;
  if (typeof v.at !== 'string' || typeof v.landingPath !== 'string') return undefined;
  const kind = LANDING_KINDS.includes(v.landingKind as LandingKind) ? (v.landingKind as LandingKind) : 'other';
  const str = (x: unknown, max: number) => (typeof x === 'string' ? clip(x, max) : undefined);
  const touch: AttributionTouch = {
    landingPath: str(v.landingPath, ATTRIBUTION_LIMITS.landingPath) ?? '/',
    landingKind: kind,
    at: v.at,
  };
  const source = str(v.source, ATTRIBUTION_LIMITS.source);
  const medium = str(v.medium, ATTRIBUTION_LIMITS.medium);
  const campaign = str(v.campaign, ATTRIBUTION_LIMITS.campaign);
  const referrer = str(v.referrer, ATTRIBUTION_LIMITS.referrer);
  const landingRef = str(v.landingRef, ATTRIBUTION_LIMITS.landingRef);
  if (source) touch.source = source;
  if (medium) touch.medium = medium;
  if (campaign) touch.campaign = campaign;
  if (referrer) touch.referrer = referrer;
  if (landingRef) touch.landingRef = landingRef;
  return touch;
}

/** Do-Not-Track or Global Privacy Control is on. */
export function isPrivacySignalOn(nav: {
  doNotTrack?: string | null;
  globalPrivacyControl?: boolean;
  msDoNotTrack?: string | null;
} | null | undefined, win?: { doNotTrack?: string | null } | null): boolean {
  if (nav?.globalPrivacyControl === true) return true;
  const values = [nav?.doNotTrack, nav?.msDoNotTrack, win?.doNotTrack];
  return values.some((v) => v === '1' || v === 'yes');
}

/** Crawlers, link previewers, headless and automated browsers. */
export function isLikelyBot(userAgent: string | null | undefined, webdriver?: boolean): boolean {
  if (webdriver === true) return true;
  if (!userAgent) return true;
  return BOT_PATTERN.test(userAgent);
}

/** Random id for this browser, from the browser's crypto generator. Null when no crypto generator exists. */
export function newVisitorKey(cryptoImpl: Pick<Crypto, 'getRandomValues'> & { randomUUID?: () => string } | undefined): string | null {
  if (!cryptoImpl) return null;
  if (typeof cryptoImpl.randomUUID === 'function') return cryptoImpl.randomUUID();
  if (typeof cryptoImpl.getRandomValues !== 'function') return null;
  const bytes = cryptoImpl.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

const VISITOR_KEY_PATTERN = /^[A-Za-z0-9-]{16,64}$/;

// ─── Browser glue ────────────────────────────────────────────────────────────

const browserNavigationType = (): string | undefined => {
  try {
    const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    return entry?.type;
  } catch {
    return undefined;
  }
};

const readStorage = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (key: string, value: string) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage full or blocked: attribution is best effort.
  }
};

const removeStorage = (key: string) => {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
};

const browserPrivacySignalOn = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return true;
  return isPrivacySignalOn(
    navigator as Navigator & { globalPrivacyControl?: boolean; msDoNotTrack?: string },
    window as unknown as { doNotTrack?: string }
  );
};

/** Tracking is allowed in this browser: no privacy signal, not a bot. */
export function attributionAllowed(): boolean {
  if (browserPrivacySignalOn()) return false;
  return !isLikelyBot(navigator.userAgent, navigator.webdriver);
}

let captured = false;

/** Call once at startup, before the router changes the URL. */
export function captureAttributionOnArrival(): void {
  if (captured || typeof window === 'undefined') return;
  captured = true;
  if (browserPrivacySignalOn()) {
    // The visitor asked not to be tracked: forget anything recorded earlier.
    removeStorage(ATTRIBUTION_STORAGE_KEY);
    removeStorage(VISITOR_KEY_STORAGE_KEY);
    return;
  }
  if (!attributionAllowed()) return;
  const now = new Date();
  const arrival = classifyArrival({
    href: window.location.href,
    referrer: document.referrer,
    navigationType: browserNavigationType(),
    now,
  });
  const next = applyArrival(parseStoredAttribution(readStorage(ATTRIBUTION_STORAGE_KEY)), arrival, now);
  if (next.first || next.last) writeStorage(ATTRIBUTION_STORAGE_KEY, JSON.stringify(next));
  else removeStorage(ATTRIBUTION_STORAGE_KEY);
}

/** The attribution to attach to a checkout or visit, or undefined (none recorded, or tracking not allowed). */
export function getStoredAttribution(): AttributionPayload | undefined {
  if (!attributionAllowed()) return undefined;
  return buildAttributionPayload(parseStoredAttribution(readStorage(ATTRIBUTION_STORAGE_KEY)), new Date());
}

/** This browser's random visitor key, created on first use. Null when tracking is not allowed. */
export function getVisitorKey(): string | null {
  if (!attributionAllowed()) return null;
  const existing = readStorage(VISITOR_KEY_STORAGE_KEY);
  if (existing && VISITOR_KEY_PATTERN.test(existing)) return existing;
  const key = newVisitorKey(typeof crypto !== 'undefined' ? crypto : undefined);
  if (!key) return null;
  writeStorage(VISITOR_KEY_STORAGE_KEY, key);
  return key;
}
