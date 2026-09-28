/**
 * The AI Thumbnails welcome card (owner decision, 28 September 2026). A new
 * account that signed up from AI Thumbnails skips base.tube's general
 * onboarding (Creator/Collector, Genesis Pass) and goes straight back to the
 * AI Thumbnails page it came from; this small card welcomes it there, once.
 *
 *   1. An AI Thumbnails sign-in or sign-up (its own pages, their entries, the
 *      gate's in-place screens) notes it in this tab (`noteStudioAuthStart`,
 *      sessionStorage, so Clerk's redirects, Google or Discord, keep it). A
 *      wallet account that was still PENDING is noted by account
 *      (`noteStudioWelcome`, utils/studioOnboarding).
 *   2. On an AI Thumbnails page, the signed-in account opens the card
 *      (`openStudioWelcome`) only when such a note exists and the account is
 *      new: a Clerk account created within the hour, or the noted wallet
 *      account. An existing account signing in never sees it.
 *   3. Once per account on this browser (localStorage). An opened card stays in
 *      this tab (sessionStorage) across pages and reloads (Clerk reloads the
 *      page right after a sign-up) until it is closed, for an hour at most.
 *   4. Its "credits added" line only when the welcome credits confirm (after
 *      the gate or the sign-up page) granted them in this tab
 *      (`noteStudioWelcomeCredits`); "Your welcome credits arrive on …" when it
 *      deferred them to another day (`noteStudioWelcomeDeferred`).
 */

type Listener = () => void;
const listeners = new Set<Listener>();
let version = 0;
const changed = () => {
  version++;
  listeners.forEach(listener => listener());
};
export const subscribeStudioWelcome = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export const getStudioWelcomeVersion = () => version;

const AUTH_KEY = 'thumbnail-studio:welcome-auth:v1';
const CARD_KEY = 'thumbnail-studio:welcome-card:v1';
const CREDITS_KEY = 'thumbnail-studio:welcome-credits:v1';
const SEEN_KEY = 'thumbnail-studio:welcome-seen:v1';
/** How long a note waits for its account, how new a Clerk account must be, and how long an open card stays. */
export const STUDIO_WELCOME_WINDOW_MS = 60 * 60_000;

const session = () => sessionStorage;
const local = () => localStorage;
function read(storage: () => Storage, key: string): any {
  try {
    const raw = storage().getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function write(storage: () => Storage, key: string, value: unknown) {
  try {
    if (value === null) storage().removeItem(key);
    else storage().setItem(key, JSON.stringify(value));
  } catch {
    /* Without storage the card is simply not shown. */
  }
}

/** An AI Thumbnails sign-up or sign-in was opened in this tab. */
export function noteStudioAuthStart(now = Date.now()) {
  write(session, AUTH_KEY, { at: now, account: null });
}
/** This account is new and came from AI Thumbnails (a wallet account that was still PENDING). */
export function noteStudioWelcome(account: string, now = Date.now()) {
  write(session, AUTH_KEY, { at: now, account });
}
/** The welcome credits confirm granted them to `account` in this tab. */
export function noteStudioWelcomeCredits(account: string, credits: number) {
  write(session, CREDITS_KEY, { account, credits });
  changed();
}
/** The welcome credits confirm deferred them: they are added on `grantOn` (null: the server gave no day). */
export function noteStudioWelcomeDeferred(account: string, grantOn: string | null) {
  write(session, CREDITS_KEY, { account, deferred: true, grantOn });
  changed();
}

function seenAccounts(): string[] {
  const stored = read(local, SEEN_KEY);
  return Array.isArray(stored) ? stored.filter((id: unknown): id is string => typeof id === 'string') : [];
}

export interface StudioWelcome {
  /** Welcome credits the gate's confirm granted in this tab; null when none were. */
  credits: number | null;
  /** The confirm deferred them to another day: when they are added (`grantOn`, or "" when unknown); else null. */
  arrivesOn: string | null;
}
/** The card open in this tab for `account`, or null. */
export function readStudioWelcome(account: string, now = Date.now()): StudioWelcome | null {
  const card = read(session, CARD_KEY);
  if (!card || card.account !== account || card.closed === true || !Number.isFinite(card.at) || now - card.at > STUDIO_WELCOME_WINDOW_MS) return null;
  const note = read(session, CREDITS_KEY);
  const mine = note?.account === account;
  return {
    credits: mine && Number.isFinite(note.credits) && note.credits > 0 ? note.credits : null,
    arrivesOn: mine && note.deferred === true ? (typeof note.grantOn === 'string' ? note.grantOn : '') : null,
  };
}

/**
 * Called on AI Thumbnails pages for the signed-in `account`. `createdAt`: when
 * the Clerk account was created (ms), null for a wallet account. Opens the card
 * for a new account that came from AI Thumbnails; true when it is open.
 */
export function openStudioWelcome(account: string, createdAt: number | null, now = Date.now()): boolean {
  if (account === 'anonymous') return false;
  if (readStudioWelcome(account, now)) return true;
  const note = read(session, AUTH_KEY);
  if (!note || !Number.isFinite(note.at)) return false;
  // One note, one decision: a sign-in that was not a new account never opens it later.
  write(session, AUTH_KEY, null);
  if (now - note.at > STUDIO_WELCOME_WINDOW_MS) return false;
  const isNew = typeof note.account === 'string'
    ? note.account === account
    : account.startsWith('clerk:') && createdAt !== null && Number.isFinite(createdAt) && Math.abs(now - createdAt) <= STUDIO_WELCOME_WINDOW_MS;
  const seen = seenAccounts();
  if (!isNew || seen.includes(account)) return false;
  write(local, SEEN_KEY, [...seen, account].slice(-50));
  write(session, CARD_KEY, { account, at: now });
  changed();
  return true;
}

/** The close button: the card does not come back for this account. */
export function closeStudioWelcome() {
  const card = read(session, CARD_KEY);
  if (card) write(session, CARD_KEY, { ...card, closed: true });
  changed();
}

/** Signed out or another account: what this tab kept for the previous one goes. */
export function forgetStudioWelcome() {
  write(session, CARD_KEY, null);
  write(session, CREDITS_KEY, null);
  changed();
}
