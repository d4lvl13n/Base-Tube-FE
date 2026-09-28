import { confirmSignup, getToolFingerprint } from "../api/toolFunnel";
import type { ConfirmSignupData, ConfirmSignupRequest } from "../types/toolFunnel";
import { clearPendingReferralCode, getPendingReferralCode } from "./referralAttribution";
import { clearAllStudioDrafts } from "./studioDraft";
import { forgetStudioWelcome, noteStudioWelcomeCredits, noteStudioWelcomeDeferred } from "./studioWelcome";
import { forgetStudioFunnelState, loadEmailGate, saveEmailGate } from "./studioFunnel";
import type { EmailGateRecord } from "./studioFunnel";

// ---------------------------------------------------------------------------
// Gate confirmation: POST /tool/email-capture/confirm (the welcome credits),
// once per sign-in, after a sign-up or sign-in started from the gate (it asks for no
// email). The server is idempotent and decides the welcome credits from the
// account alone (verified primary email, not a wallet, once per email); the
// browser still sends it once (single flight, StrictMode-safe).
//
// Body: `marketingConsent` always, as the gate's checkbox left it (a real
// boolean); the pending referral code (localStorage `pending_referral_code`,
// written by any ?ref= link opened in this browser) only when this tab started
// the sign-up from the gate within the last 30 minutes, otherwise omitted.
// ---------------------------------------------------------------------------
/** How long after "Create my free account" the pending referral code goes with confirm. */
export const GATE_REFERRAL_WINDOW_MS = 30 * 60_000;
/**
 * Refusals that asking again cannot change: an email already used by another
 * account, a disposable address, the welcome credits limit of this network, a
 * banned account, a wallet account (no email).
 */
const FINAL_REFUSALS = ["EMAIL_IN_USE", "EMAIL_DISPOSABLE", "WELCOME_LIMIT_NETWORK", "ACCOUNT_BANNED"];
export function isEmailGateRefusalFinal(code: string, cause: string | null): boolean {
  return FINAL_REFUSALS.includes(code) || (code === "EMAIL_NOT_VERIFIED" && cause === "web3_no_email");
}
const availableCredits = (balance: ConfirmSignupData["balance"]): number | null =>
  typeof balance === "number" ? balance : balance && Number.isFinite(balance.available) ? balance.available : null;
let confirmInFlight: Promise<void> | null = null;
/** Bumped when the account changes: a confirmation still in flight is then ignored. */
let confirmToken = 0;
/**
 * A confirmation that has not answered after 20 s is shown as a retryable
 * failure, so a hanging request never holds the gate (the shared client
 * allows 10 minutes).
 */
export const CONFIRM_TIMEOUT_MS = 20_000;
export interface ConfirmDeps {
  confirm: (payload: ConfirmSignupRequest) => Promise<ConfirmSignupData>;
  onGranted?: (data: ConfirmSignupData) => void;
  now: () => number;
  timeoutMs: number;
}
const confirmDeps: ConfirmDeps = { confirm: confirmSignup, now: () => Date.now(), timeoutMs: CONFIRM_TIMEOUT_MS };
const TIMED_OUT = new Error("The confirmation did not answer in time.");
function withTimeout<T>(request: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(TIMED_OUT), ms);
    request.then(
      value => { clearTimeout(timer); resolve(value); },
      error => { clearTimeout(timer); reject(error); },
    );
  });
}
type ConfirmingRecord = Extract<EmailGateRecord, { phase: "confirming" }>;

/** Confirms once the sign-up or sign-in the gate started has signed `account` in. */
export function startEmailGateConfirm(
  account: string,
  overrides: Partial<ConfirmDeps> = {},
): Promise<void> | null {
  const deps = { ...confirmDeps, ...overrides };
  const record = loadEmailGate();
  if (!record || (record.phase !== "awaiting_sign_in" && record.phase !== "confirming")) return null;
  if (confirmInFlight) return confirmInFlight;
  if (record.phase === "confirming" && record.account && record.account !== account) {
    saveEmailGate(null);
    return null;
  }
  const confirming: ConfirmingRecord = {
    reason: record.reason, open: record.open, updatedAt: deps.now(), phase: "confirming", account,
    marketingConsent: record.marketingConsent, signUpStartedAt: record.signUpStartedAt,
  };
  saveEmailGate(confirming);
  return runConfirm(confirming, deps);
}
/** "Try again" after a refused confirmation (e.g. once the email is verified). */
export function retryEmailGateConfirm(account: string, overrides: Partial<ConfirmDeps> = {}) {
  const deps = { ...confirmDeps, ...overrides };
  const record = loadEmailGate();
  if (record?.phase !== "refused" || !record.retryable || (record.account && record.account !== account)) return null;
  if (confirmInFlight) return confirmInFlight;
  const confirming: ConfirmingRecord = {
    reason: record.reason, open: true, updatedAt: deps.now(), phase: "confirming", account,
    marketingConsent: record.marketingConsent, signUpStartedAt: record.signUpStartedAt,
  };
  saveEmailGate(confirming);
  return runConfirm(confirming, deps);
}
function runConfirm(record: ConfirmingRecord, deps: ConfirmDeps): Promise<void> {
  const token = confirmToken;
  const { marketingConsent, signUpStartedAt, account } = record;
  const now = deps.now();
  const referralCode = signUpStartedAt !== null && now >= signUpStartedAt && now - signUpStartedAt <= GATE_REFERRAL_WINDOW_MS
    ? getPendingReferralCode()
    : null;
  confirmInFlight = withTimeout(deps.confirm({
    marketingConsent,
    ...(referralCode ? { referralCode } : {}),
    fingerprint: getToolFingerprint(),
  }), deps.timeoutMs)
    .then(data => {
      if (token !== confirmToken) return;
      // Sent and accepted with this confirmation; an unsent code is left to the referral bridge's own rules.
      if (referralCode) clearPendingReferralCode();
      const deferred = !data.granted && data.deferred === true;
      const grantOn = deferred && typeof data.grantOn === "string" ? data.grantOn : null;
      // The welcome card of a new account says so (utils/studioWelcome).
      if (data.granted && account) noteStudioWelcomeCredits(account, data.signupCredits);
      if (deferred && account) noteStudioWelcomeDeferred(account, grantOn);
      // Already received by this account (a repeat call): nothing to announce.
      if (!data.granted && !deferred && data.alreadyGranted) saveEmailGate(null);
      else
        saveEmailGate({
          reason: record.reason, open: true, updatedAt: deps.now(), phase: "granted", account,
          credits: Number.isFinite(data.signupCredits) && data.signupCredits > 0 ? data.signupCredits : null,
          balance: availableCredits(data.balance), granted: data.granted, alreadyGranted: data.alreadyGranted, deferred, grantOn,
        });
      deps.onGranted?.(data);
    })
    .catch(error => {
      if (token !== confirmToken) return;
      const response = (error as { response?: { status?: unknown; data?: { error?: { code?: unknown; reason?: unknown; message?: unknown } } } })?.response;
      const body = response?.data?.error;
      const status = typeof response?.status === "number" ? response.status : undefined;
      const code = typeof body?.code === "string" ? body.code : error === TIMED_OUT ? "TIMEOUT" : "NETWORK_ERROR";
      const cause = typeof body?.reason === "string" ? body.reason : null;
      // Only a refusal's own sentence is kept; a server error's text is never shown.
      const message = status !== undefined && status >= 400 && status < 500 && typeof body?.message === "string" && body.message.trim()
        ? body.message.trim().slice(0, 500) : undefined;
      saveEmailGate({
        reason: record.reason, open: true, updatedAt: deps.now(), phase: "refused", marketingConsent, signUpStartedAt, account,
        code, cause, ...(status === undefined ? {} : { status }), ...(message ? { message } : {}),
        // A wallet account has no email, an email already used by another account had its credits: final.
        retryable: !isEmailGateRefusalFinal(code, cause),
      });
    })
    .finally(() => {
      if (token === confirmToken) confirmInFlight = null;
    });
  return confirmInFlight;
}

/**
 * Signed out, or another account signed in: the gate, this tab's brief drafts
 * and its welcome card belonged to the previous visitor. A confirmation still
 * in flight is ignored.
 */
export function forgetStudioFunnelForAccountChange() {
  confirmToken++;
  confirmInFlight = null;
  forgetStudioFunnelState();
  forgetStudioWelcome();
  clearAllStudioDrafts();
}

/** Tests only. */
export function resetStudioFunnelRunnerForTests() {
  confirmInFlight = null;
  confirmToken++;
}
