// src/components/pages/CreatorHub/ManagePasses/passHelpers.ts
import { toast } from 'react-toastify';
import type { Pass } from '../../../../types/pass';
import { formatMinor } from '../Business/businessFormat';

/** Sold = minted + pending Stripe reservations; the backend folds both into `sold_count`. */
export const soldCount = (pass: Pass): number => pass.sold_count ?? pass.minted_count ?? 0;

/** "23 of 200" when the pass has a cap, "23 sold" otherwise. */
export const soldText = (sold: number, cap: number | null | undefined, locale?: string): string => {
  const n = new Intl.NumberFormat(locale);
  return cap ? `${n.format(sold)} of ${n.format(cap)}` : `${n.format(sold)} sold`;
};

/** A pass with no `publish_status` predates the draft flow and is live. */
export const isPublished = (pass: Pass): boolean =>
  !pass.publish_status || pass.publish_status === 'published';

/** Where a row opens: the detail page, or the wizard resumed on the draft. */
export const passHref = (pass: Pass): string =>
  isPublished(pass)
    ? `/creator-hub/passes/${pass.id}`
    : `/creator-hub/create-content-pass?draft=${pass.id}`;

export const draftHref = (pass: Pass): string => `/creator-hub/create-content-pass?draft=${pass.id}`;

export const publicPassPath = (pass: Pass): string => `/p/${pass.slug || pass.id}`;

export const publicPassUrl = (pass: Pass): string => `${window.location.origin}${publicPassPath(pass)}`;

// Money is formatted by `formatMinor` (Business/businessFormat.ts): minor units
// plus the currency's own decimals. The old `formatMoney` here divided every
// amount by 100, which showed USDC (6 decimals) 10,000 times too large; it is gone.

/**
 * A pass's price in the one money format ("EUR 49.00", never "€49.00"): the
 * business API's price when it is here (it carries its own decimals), else
 * the pass's `price_cents` in its currency (cents: 2 decimals).
 */
export const passPriceText = (
  pass: Pick<Pass, 'price_cents' | 'currency'>,
  businessPrice?: { amount: number; currency: string; decimals: number } | null,
): string =>
  businessPrice
    ? formatMinor(businessPrice.amount, businessPrice.currency, businessPrice.decimals)
    : formatMinor(pass.price_cents ?? 0, pass.currency || 'EUR', 2);

/**
 * Sequelize sends `createdAt`; older serializers sent `created_at`. Neither is
 * on the client type, so read both defensively and show nothing when absent.
 */
export const passCreatedAt = (pass: Pass): string | null => {
  const raw = pass as Pass & { createdAt?: string; created_at?: string };
  return raw.createdAt ?? raw.created_at ?? null;
};

export const formatDuration = (seconds: number | undefined): string | null => {
  if (!seconds || seconds <= 0) return null;
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(secs)}` : `${minutes}:${pad(secs)}`;
};

/** Truncate a hex address to `0x1234…abcd`. */
export const shortAddress = (address: string): string =>
  address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address;

export const copyToClipboard = async (text: string, label = 'Link'): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  } catch {
    toast.error(`Could not copy the ${label.toLowerCase()}`);
  }
};

export const copyPassLink = (pass: Pass): Promise<void> => copyToClipboard(publicPassUrl(pass), 'Link');
