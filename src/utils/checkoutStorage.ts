import type { CheckoutSessionResponse } from '../types/pass';

const CHECKOUT_STORAGE_KEY = 'content_pass_checkout_context';

export interface StoredCheckoutContext extends CheckoutSessionResponse {
  passId: string;
  savedAt: number;
}

export function persistCheckoutContext(passId: string, checkout: CheckoutSessionResponse): void {
  const payload: StoredCheckoutContext = {
    ...checkout,
    passId,
    savedAt: Date.now(),
  };

  try {
    localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage failures and rely on URL/session fallback.
  }
}

export function readCheckoutContext(): StoredCheckoutContext | null {
  try {
    const raw = localStorage.getItem(CHECKOUT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredCheckoutContext;
  } catch {
    return null;
  }
}

export function clearCheckoutContext(): void {
  try {
    localStorage.removeItem(CHECKOUT_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}
