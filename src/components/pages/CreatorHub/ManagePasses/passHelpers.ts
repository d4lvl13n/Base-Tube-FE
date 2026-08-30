// src/components/pages/CreatorHub/ManagePasses/passHelpers.ts
import { toast } from 'react-toastify';
import type { Pass } from '../../../../types/pass';

/** Sold = minted + pending Stripe reservations; the backend folds both into `sold_count`. */
export const soldCount = (pass: Pass): number => pass.sold_count ?? pass.minted_count ?? 0;

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

/** `€12.00`, `$3.50` — never a bare number. Falls back to `12.00 XYZ` on an unknown code. */
export const formatMoney = (cents: number, currency: string | undefined): string => {
  const code = (currency || 'EUR').toUpperCase();
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: code }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${code}`;
  }
};

/**
 * Sequelize sends `createdAt`; older serializers sent `created_at`. Neither is
 * on the client type, so read both defensively and show nothing when absent.
 */
export const passCreatedAt = (pass: Pass): string | null => {
  const raw = pass as Pass & { createdAt?: string; created_at?: string };
  return raw.createdAt ?? raw.created_at ?? null;
};

export const formatDate = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
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
