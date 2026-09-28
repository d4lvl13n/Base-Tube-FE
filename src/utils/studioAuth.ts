import { SAVE_STUDIO_DRAFT_EVENT, studioReturnDestination } from './studioDraft';
import { noteStudioAuthStart } from './studioWelcome';

/**
 * AI Thumbnails' own sign-in and sign-up pages (owner decision, 28 September
 * 2026). Same Clerk instance, users, credits and roles as base.tube; only the
 * pages, their copy and where they go afterwards differ. base.tube keeps its
 * general `/sign-in`, `/sign-in-web3`, `/sign-up` and onboarding unchanged.
 *
 * Every AI Thumbnails sign-in or sign-up (the pages, the gate in place, the
 * wallet) ends on one constant address, `STUDIO_AUTH_CONTINUE_PATH`. Clerk
 * keeps only its own query parameters from one of its steps to the next
 * (`/verify-email-address`, `/factor-one`, `/sso-callback`, …), so where to go
 * next is never read from the URL: it is the origin marker below, written in
 * this tab (sessionStorage survives Clerk's full-page steps and the Google or
 * Discord round trip) when an AI Thumbnails entry is used.
 */
export const STUDIO_SIGN_IN_PATH = '/ai-thumbnails/sign-in';
export const STUDIO_SIGN_UP_PATH = '/ai-thumbnails/sign-up';
export const STUDIO_AUTH_CONTINUE_PATH = '/ai-thumbnails/auth/continue';
/** Also where the brief a visitor wrote in this tab is restored (the tab's active draft). */
export const STUDIO_AUTH_DEFAULT_DESTINATION = '/ai-thumbnails/generate';

export type StudioAuthIntent = 'sign-up' | 'sign-in';
export interface StudioAuthOrigin {
  /** An allowed AI Thumbnails page (`studioReturnDestination`). */
  destination: string;
  /** The last AI Thumbnails auth page used in this tab. */
  intent: StudioAuthIntent;
  /** The sign-up page's marketing opt-in (never pre-checked). */
  consent?: boolean;
  /** When this tab last showed an AI Thumbnails auth entry or page. */
  startedAt: number;
}

export const STUDIO_AUTH_ORIGIN_KEY = 'thumbnail-studio:auth-origin:v1';
/** A marker older than this (no auth screen shown for 30 minutes) is ignored. */
export const STUDIO_AUTH_ORIGIN_TTL_MS = 30 * 60_000;
/**
 * A Clerk account created this recently when it reaches the continue screen was
 * made by this sign-in (a new Google or Discord account on the sign-in page): a
 * sign-up, whose welcome credits are confirmed too.
 */
export const STUDIO_NEW_ACCOUNT_WINDOW_MS = 10 * 60_000;

function read(now: number): StudioAuthOrigin | null {
  let value: any;
  try {
    const raw = sessionStorage.getItem(STUDIO_AUTH_ORIGIN_KEY);
    value = raw ? JSON.parse(raw) : null;
  } catch {
    value = undefined;
  }
  if (value === null) return null;
  const destination = typeof value?.destination === 'string' ? studioReturnDestination(value.destination) : undefined;
  const valid = destination !== undefined && (value.intent === 'sign-up' || value.intent === 'sign-in')
    && Number.isFinite(value.startedAt) && value.startedAt <= now + 60_000 && now - value.startedAt <= STUDIO_AUTH_ORIGIN_TTL_MS;
  if (!valid) {
    clearStudioAuthOrigin();
    return null;
  }
  return {
    destination,
    intent: value.intent,
    ...(typeof value.consent === 'boolean' ? { consent: value.consent } : {}),
    startedAt: value.startedAt,
  };
}
function write(origin: StudioAuthOrigin) {
  try {
    sessionStorage.setItem(STUDIO_AUTH_ORIGIN_KEY, JSON.stringify(origin));
  } catch {
    /* Without storage the visitor still signs in and lands on the default page. */
  }
}

/** The valid marker of this tab, or null (an invalid or expired one is removed). */
export function readStudioAuthOrigin(now = Date.now()): StudioAuthOrigin | null {
  return read(now);
}
export function clearStudioAuthOrigin() {
  try {
    sessionStorage.removeItem(STUDIO_AUTH_ORIGIN_KEY);
  } catch {
    /* Storage may be disabled. */
  }
}

/**
 * An AI Thumbnails sign-in or sign-up entry was used on `from` (pathname +
 * search): the visitor comes back there afterwards (the default page when
 * `from` is not an allowed destination). The visitor's brief on screen is
 * saved first, and the welcome card notes the start. `consent`: the gate's
 * opt-in box; a new start otherwise has none yet.
 */
export function startStudioAuth(intent: StudioAuthIntent, from: string, consent?: boolean, now = Date.now()) {
  window.dispatchEvent(new Event(SAVE_STUDIO_DRAFT_EVENT));
  noteStudioAuthStart(now);
  write({
    destination: studioReturnDestination(from) ?? STUDIO_AUTH_DEFAULT_DESTINATION,
    intent,
    ...(typeof consent === 'boolean' ? { consent } : {}),
    startedAt: now,
  });
}

/**
 * The AI Thumbnails sign-in or sign-up page is on screen (also each of Clerk's
 * steps, which reload the page): it becomes the intent, the marker stays valid
 * while the visitor goes through the steps, and a visit without an entry (a
 * bookmark, a new tab) gets the default destination.
 */
export function touchStudioAuthOrigin(intent: StudioAuthIntent, now = Date.now()): StudioAuthOrigin {
  const current = read(now);
  const next: StudioAuthOrigin = current
    ? { ...current, intent, startedAt: now }
    : { destination: STUDIO_AUTH_DEFAULT_DESTINATION, intent, startedAt: now };
  write(next);
  return next;
}

/** The sign-up page's opt-in box changed. */
export function setStudioAuthConsent(consent: boolean, now = Date.now()) {
  const current = read(now) ?? { destination: STUDIO_AUTH_DEFAULT_DESTINATION, intent: 'sign-up' as const, startedAt: now };
  write({ ...current, consent });
}

// Clerk's own redirect parameters. Clerk ranks them above the component's
// props (force: query, then prop), so on the AI Thumbnails pages any of them
// that is not the constant continue address is dropped before Clerk renders.
const CLERK_REDIRECT_PARAMS = [
  'redirect_url', 'after_sign_in_url', 'after_sign_up_url',
  'sign_in_force_redirect_url', 'sign_in_fallback_redirect_url',
  'sign_up_force_redirect_url', 'sign_up_fallback_redirect_url',
];
function isContinueUrl(value: string): boolean {
  try {
    const url = new URL(value, window.location.origin);
    return url.origin === window.location.origin && url.pathname === STUDIO_AUTH_CONTINUE_PATH && !url.search;
  } catch {
    return false;
  }
}
function cleanQuery(query: string): string {
  const params = new URLSearchParams(query);
  let changed = false;
  CLERK_REDIRECT_PARAMS.forEach(key => {
    const values = params.getAll(key);
    const kept = values.filter(isContinueUrl);
    if (kept.length === values.length) return;
    changed = true;
    params.delete(key);
    kept.forEach(value => params.append(key, value));
  });
  if (!changed) return query;
  const next = params.toString();
  return next ? `?${next}` : '';
}
/**
 * The URL an AI Thumbnails auth page must have before Clerk renders on it:
 * `search` and `hash` without a foreign Clerk redirect (also in a Clerk hash
 * route such as `#/sso-callback?…`), or null when they are already clean.
 */
export function cleanStudioAuthUrl(search: string, hash: string): { search: string; hash: string } | null {
  const cleanSearch = cleanQuery(search);
  let cleanHash = hash;
  if (hash.startsWith('#/') && hash.includes('?')) {
    const at = hash.indexOf('?');
    const query = cleanQuery(hash.slice(at));
    cleanHash = hash.slice(0, at) + query;
  }
  return cleanSearch === search && cleanHash === hash ? null : { search: cleanSearch, hash: cleanHash };
}
