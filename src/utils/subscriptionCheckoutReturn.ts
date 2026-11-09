import { studioReturnDestination } from './studioDraft';

const KEY = 'thumbnail-studio:subscription-checkout-return:v1';
const TTL = 24 * 60 * 60 * 1000;

/** Browser Back does not use Stripe's cancel_url. Remember the same safe pricing destination. */
export function rememberSubscriptionCheckout(returnPath?: string, now = Date.now()) {
  try {
    const path = studioReturnDestination(returnPath ?? null);
    sessionStorage.setItem(KEY, JSON.stringify({ at: now, returnPath: path }));
  } catch { /* Stripe's explicit cancel link still works without session storage. */ }
}

export function subscriptionCheckoutReturn(now = Date.now()): string | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const value = JSON.parse(raw);
    if (!Number.isFinite(value?.at) || value.at > now + 60_000 || now - value.at > TTL) {
      clearSubscriptionCheckout();
      return null;
    }
    const path = studioReturnDestination(value.returnPath ?? null);
    return `/ai-thumbnails/pricing?checkout=cancelled${path ? `&return=${encodeURIComponent(path)}` : ''}`;
  } catch { return null; }
}

export function clearSubscriptionCheckout() {
  try { sessionStorage.removeItem(KEY); } catch { /* Storage can be unavailable. */ }
}
