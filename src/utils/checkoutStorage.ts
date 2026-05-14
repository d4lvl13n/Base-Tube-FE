import type { CheckoutSessionResponse } from '../types/pass';
import type { CryptoPurchasePhase } from '../types/onchainPass';

const CHECKOUT_STORAGE_KEY = 'content_pass_checkout_context';
const CRYPTO_CHECKOUT_STORAGE_KEY = 'crypto_purchase_context';
const CRYPTO_CONTEXT_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24h stale guard

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

/**
 * Crypto purchase resume context.
 *
 * Written immediately after the tx receipt lands so that if the user closes the
 * tab / refreshes / navigates away, the resume hook on next mount can pick up
 * where we left off and call /crypto/confirm again (idempotent on same txHash).
 */
export interface StoredCryptoPurchaseContext {
  purchaseId: string;
  passId: string;
  txHash: string;
  phase: Extract<CryptoPurchasePhase, 'tx-pending' | 'confirming' | 'polling' | 'completed' | 'failed'>;
  savedAt: number;
  explorerUrl?: string;
}

export function persistCryptoCheckoutContext(ctx: Omit<StoredCryptoPurchaseContext, 'savedAt'> & { savedAt?: number }): void {
  const payload: StoredCryptoPurchaseContext = {
    ...ctx,
    savedAt: ctx.savedAt ?? Date.now(),
  };
  try {
    localStorage.setItem(CRYPTO_CHECKOUT_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage failures.
  }
}

export function readCryptoCheckoutContext(): StoredCryptoPurchaseContext | null {
  try {
    const raw = localStorage.getItem(CRYPTO_CHECKOUT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredCryptoPurchaseContext;
    if (!parsed?.purchaseId || !parsed?.txHash) return null;
    if (Date.now() - (parsed.savedAt || 0) > CRYPTO_CONTEXT_MAX_AGE_MS) {
      clearCryptoCheckoutContext();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearCryptoCheckoutContext(): void {
  try {
    localStorage.removeItem(CRYPTO_CHECKOUT_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}

export function updateCryptoCheckoutPhase(phase: StoredCryptoPurchaseContext['phase']): void {
  const existing = readCryptoCheckoutContext();
  if (!existing) return;
  persistCryptoCheckoutContext({ ...existing, phase });
}
