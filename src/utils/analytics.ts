// GA4 (G-DQELH44BE4), shared with base.tube: the _ga cookie lives on .base.tube, so a visitor keeps
// one client id from the landing page to this app. Page views are GA4's own (first load and history
// changes); this module sends the conversion steps. Every call is a no-op when gtag is blocked.
export const GA4_MEASUREMENT_ID = 'G-DQELH44BE4';

type Gtag = (...args: unknown[]) => void;
function gtag(): Gtag | null {
  const candidate = typeof window !== 'undefined' ? (window as unknown as { gtag?: unknown }).gtag : undefined;
  return typeof candidate === 'function' ? (candidate as Gtag) : null;
}

/** A GA4 event; `beacon` so it is still sent when the page leaves right after (Stripe Checkout). */
export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  gtag()?.('event', name, { ...params, transport_type: 'beacon' });
}

/**
 * This browser's GA4 client id ("GA1.1.<id>.<time>" in the _ga cookie gives "<id>.<time>"), or null.
 * Checkout carries it so the server reports the trial or the payment under the same visitor.
 */
export function ga4ClientId(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)_ga=GA\d\.\d\.(\d{1,20}\.\d{1,20})(?:;|$)/);
  return match ? match[1] : null;
}

/** `sign_up` once per account (the continue screen can run again in the same tab). */
export function trackSignUp(accountId: string, method: 'clerk' | 'wallet') {
  const key = `ga4:sign_up:${accountId}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch { /* Storage may be disabled: the event is still sent. */ }
  trackEvent('sign_up', { method });
}
