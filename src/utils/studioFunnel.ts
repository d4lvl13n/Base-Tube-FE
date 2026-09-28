/**
 * The account gate of AI Thumbnails (spec §17.3, owner decision 28 September
 * 2026): generating (or another account-only action, or free audits used up)
 * needs a free account → the AI Thumbnails sign-up in place → verified account
 * → welcome credits (POST /tool/email-capture/confirm). A sign-up on the AI
 * Thumbnails sign-up page gets the same confirmation (`armStudioAuthConfirm`,
 * utils/studioAuth). There is no anonymous generation, so nothing is claimed.
 *
 * The gate and its pending state outlive the page that started it: they
 * survive Clerk's full-page redirects (sessionStorage), and the confirmation is
 * run by a coordinator mounted above the routes (StudioFunnelBridge).
 */

type Listener = () => void;
function createStore<T>(initial: T) {
  let value = initial;
  const listeners = new Set<Listener>();
  return {
    get: () => value,
    /** Lazy first read during render: no listener is notified. */
    init: (next: T) => {
      value = next;
    },
    set: (next: T) => {
      value = next;
      listeners.forEach(listener => listener());
    },
    subscribe: (listener: Listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
const readJson = (storage: Storage, key: string): any => {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
const remove = (storage: () => Storage, key: string) => {
  try {
    storage().removeItem(key);
  } catch {
    /* Storage may be disabled. */
  }
};

// ---------------------------------------------------------------------------
// The last signed-in account this browser saw. Sign-out and account switches
// are detected against it, also across full-page reloads: what one visitor
// left (gate, brief drafts, welcome card) never reaches the next account.
// ---------------------------------------------------------------------------
const ACCOUNT_KEY = "thumbnail-studio:funnel-account:v1";
export type StudioAccountChange = "anonymous" | "first" | "same" | "switched" | "signed-out";
export function observeStudioFunnelAccount(account: string): StudioAccountChange {
  let stored: string | null;
  try {
    stored = localStorage.getItem(ACCOUNT_KEY);
  } catch {
    return account === "anonymous" ? "anonymous" : "same";
  }
  if (account === "anonymous") {
    if (!stored) return "anonymous";
    remove(() => localStorage, ACCOUNT_KEY);
    return "signed-out";
  }
  if (stored === account) return "same";
  try {
    localStorage.setItem(ACCOUNT_KEY, account);
  } catch {
    /* Without storage a switch is only seen by this page. */
  }
  return stored ? "switched" : "first";
}

// ---------------------------------------------------------------------------
// Account gate ("email gate"). One record per tab in sessionStorage:
//   form (the offer and the consent box) → awaiting_sign_in (the AI
//   Thumbnails sign-up, or sign-in, shown in place) → (signed in) confirming →
//   granted | refused. `open` says whether the window is shown; closing an
//   unfinished gate keeps it pending so a later sign-in still confirms. The
//   gate asks for no email: the account's own verified email decides the
//   welcome credits on the server.
// From `confirming` on, the record belongs to the signed-in account.
// ---------------------------------------------------------------------------
/**
 * Why the gate opened: generating, editing, auditing or saving needs an account
 * (`generate`, `edit`, `audit`, `save`), or a visitor's free audits are used up
 * on the platform for today (`audit_capacity`). `account`: no window was asked
 * for, an AI Thumbnails sign-up page account is confirming (`armStudioAuthConfirm`).
 */
export type EmailGateReason = "generate" | "edit" | "audit" | "save" | "audit_capacity" | "account";
/** The AI Thumbnails screen the gate shows in place. */
export type EmailGateFlow = "sign-up" | "sign-in";
/** What the gate keeps for the confirmation that follows the sign-up or sign-in. */
export interface EmailGateStart {
  /** The opt-in, never pre-checked; sent with confirm as a real boolean. */
  marketingConsent: boolean;
  /**
   * When "Create my free account" opened the sign-up in this tab. The pending
   * referral code goes with confirm only within 30 minutes of it; null for a
   * sign-in.
   */
  signUpStartedAt: number | null;
}
/** A confirmation for one account. */
export interface EmailGateConfirmation extends EmailGateStart {
  /** The account the confirmation runs for; null only for records saved before accounts were kept. */
  account: string | null;
}
export type EmailGateRecord = { reason: EmailGateReason; open: boolean; updatedAt: number } & (
  | { phase: "form"; marketingConsent: boolean }
  | ({ phase: "awaiting_sign_in"; flow: EmailGateFlow } & EmailGateStart)
  | ({ phase: "confirming" } & EmailGateConfirmation)
  | {
      phase: "granted";
      /** The welcome credits (`signupCredits`); null when the server did not say. */
      credits: number | null;
      /** Credits available after the grant, when the server said. */
      balance: number | null;
      granted: boolean;
      alreadyGranted: boolean;
      /** Today's welcome credits are all given: they are added on `grantOn`. */
      deferred: boolean;
      grantOn: string | null;
      account: string | null;
    }
  | ({
      phase: "refused";
      /** Server code, e.g. EMAIL_NOT_VERIFIED or EMAIL_IN_USE, or NETWORK_ERROR / TIMEOUT. */
      code: string;
      /** The refusal's reason, e.g. web3_no_email or email_not_verified. */
      cause: string | null;
      retryable: boolean;
      /** The HTTP status, for the technical detail shown in development. */
      status?: number;
      /** The server's own sentence for a refusal (4xx) that has one. */
      message?: string;
    } & EmailGateConfirmation)
);
const GATE_KEY = "thumbnail-studio:email-gate:v1";
export const EMAIL_GATE_TTL = 24 * 60 * 60 * 1000;
const GATE_REASONS: EmailGateReason[] = ["generate", "edit", "audit", "save", "audit_capacity", "account"];
/** Reasons of records saved while visitors could generate for free: a pending sign-up still confirms. */
const LEGACY_GATE_REASONS: Record<string, EmailGateReason> = { quota: "generate", network: "generate", capacity: "generate", busy: "generate", share: "save" };
function cleanGate(value: any, now: number): EmailGateRecord | null {
  if (!value || typeof value !== "object") return null;
  const reason: EmailGateReason | undefined = GATE_REASONS.includes(value.reason) ? value.reason : LEGACY_GATE_REASONS[value.reason];
  if (!reason) return null;
  if (!Number.isFinite(value.updatedAt) || value.updatedAt + EMAIL_GATE_TTL <= now) return null;
  const base = { reason, open: value.open === true, updatedAt: value.updatedAt };
  const account = typeof value.account === "string" && value.account.length <= 200 ? value.account : null;
  const start: EmailGateStart = {
    marketingConsent: value.marketingConsent === true,
    signUpStartedAt: Number.isFinite(value.signUpStartedAt) ? value.signUpStartedAt : null,
  };
  switch (value.phase) {
    case "form":
      return { ...base, phase: "form", marketingConsent: start.marketingConsent };
    case "awaiting_sign_in":
      return { ...base, phase: "awaiting_sign_in", flow: value.flow === "sign-in" ? "sign-in" : "sign-up", ...start };
    case "confirming":
      return { ...base, phase: "confirming", ...start, account };
    case "granted":
      return {
        ...base, phase: "granted", credits: Number.isFinite(value.credits) && value.credits > 0 ? value.credits : null,
        balance: Number.isFinite(value.balance) ? value.balance : null,
        granted: value.granted === true, alreadyGranted: value.alreadyGranted === true,
        deferred: value.deferred === true, grantOn: typeof value.grantOn === "string" ? value.grantOn.slice(0, 40) : null, account,
      };
    case "refused":
      return typeof value.code === "string"
        ? {
            ...base, phase: "refused", ...start, account, code: value.code,
            cause: typeof value.cause === "string" ? value.cause : null, retryable: value.retryable === true,
            ...(Number.isInteger(value.status) ? { status: value.status } : {}),
            ...(typeof value.message === "string" ? { message: value.message.slice(0, 500) } : {}),
          }
        : null;
    default:
      return null;
  }
}
function readGate(): EmailGateRecord | null {
  let stored: unknown = null;
  try {
    stored = readJson(sessionStorage, GATE_KEY);
  } catch {
    return null;
  }
  const record = cleanGate(stored, Date.now());
  if (stored && !record) remove(() => sessionStorage, GATE_KEY);
  return record;
}
const gateStore = createStore<EmailGateRecord | null>(null);
let gateLoaded = false;
export function loadEmailGate(): EmailGateRecord | null {
  if (!gateLoaded) {
    gateLoaded = true;
    gateStore.init(readGate());
  }
  return gateStore.get();
}
export function saveEmailGate(record: EmailGateRecord | null) {
  gateLoaded = true;
  if (record) {
    try {
      sessionStorage.setItem(GATE_KEY, JSON.stringify(record));
    } catch {
      /* The gate still works in this page; a full redirect would lose it. */
    }
  } else remove(() => sessionStorage, GATE_KEY);
  gateStore.set(record);
}
export const subscribeEmailGate = gateStore.subscribe;
/** Re-read the stored gate (tests, and a page that just came back from a redirect). */
export function reloadEmailGate() {
  gateLoaded = false;
  return loadEmailGate();
}

/**
 * Open the gate. A gate already waiting for its sign-up or sign-in reopens
 * where it stopped instead of asking again.
 */
export function openEmailGate(reason: EmailGateReason, now = Date.now()) {
  const current = loadEmailGate();
  if (current && (current.phase === "awaiting_sign_in" || current.phase === "confirming")) {
    saveEmailGate({ ...current, reason, open: true, updatedAt: now });
    return;
  }
  saveEmailGate({ phase: "form", reason, open: true, updatedAt: now, marketingConsent: false });
}
/**
 * The visitor chose "Create my free account" (`sign-up`) or "I already have an
 * account" (`sign-in`): the AI Thumbnails screen opens in place. The choice and the
 * consent are kept so a full-page redirect (Google, Discord) still confirms.
 */
export function startEmailGateSignIn(flow: EmailGateFlow, marketingConsent: boolean, now = Date.now()) {
  const current = loadEmailGate();
  if (!current) return;
  saveEmailGate({
    reason: current.reason, open: true, updatedAt: now, phase: "awaiting_sign_in", flow, marketingConsent,
    signUpStartedAt: flow === "sign-up" ? now : null,
  });
}
/**
 * A sign-up on the AI Thumbnails sign-up page (or a new account made on its
 * sign-in page) has just signed in, without the gate: the bridge confirms its
 * welcome credits exactly as for the gate, with the page's consent box. A
 * sign-up or sign-in the gate itself started keeps its own record.
 */
export function armStudioAuthConfirm(start: EmailGateStart, now = Date.now()) {
  const current = loadEmailGate();
  if (current && (current.phase === "awaiting_sign_in" || current.phase === "confirming")) return;
  saveEmailGate({ reason: "account", open: false, updatedAt: now, phase: "awaiting_sign_in", flow: "sign-up", ...start });
}
/** Back from the screen in place to the offer, keeping the consent box as it was. */
export function backToEmailGateOffer(now = Date.now()) {
  const current = loadEmailGate();
  if (current?.phase !== "awaiting_sign_in") return;
  saveEmailGate({ reason: current.reason, open: true, updatedAt: now, phase: "form", marketingConsent: current.marketingConsent });
}
/**
 * Close the window. A sign-up or sign-in in progress stays pending, and so does
 * a refusal that can still be retried: confirm is the only way to the welcome
 * credits, so a network error or an email verified later must not lose them.
 * Anything else is forgotten.
 */
export function closeEmailGate(now = Date.now()) {
  const current = loadEmailGate();
  if (!current) return;
  if (isEmailGatePending(current) || isEmailGateRetryable(current))
    saveEmailGate({ ...current, open: false, updatedAt: now });
  else saveEmailGate(null);
}
function isEmailGatePending(record: EmailGateRecord) {
  return record.phase === "awaiting_sign_in" || record.phase === "confirming";
}
/** A refused confirmation the creator can still retry (not a wallet account, an email in use or a banned account). */
export function isEmailGateRetryable(record: EmailGateRecord | null): record is Extract<EmailGateRecord, { phase: "refused" }> {
  return record?.phase === "refused" && record.retryable;
}

/**
 * Sign-in, sign-up and onboarding screens (base.tube's and AI Thumbnails', with
 * Clerk's steps, and the AI Thumbnails continue screen): the funnel waits until
 * the visitor leaves them.
 */
export function isAuthRoute(pathname: string): boolean {
  return /^\/(?:sign-in|sign-up|signin|signup|sign-in-web3|onboarding|ai-thumbnails\/(?:sign-in|sign-up|auth\/continue))(?:\/|$)/.test(pathname);
}

/** Signed out or switched account: forget the gate the previous visitor left. */
export function forgetStudioFunnelState() {
  saveEmailGate(null);
}

/** Tests only: forget the in-memory state of this module. */
export function resetStudioFunnelForTests() {
  gateLoaded = false;
  gateStore.set(null);
}
