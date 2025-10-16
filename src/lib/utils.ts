import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a uint-like string balance into a human-readable decimal string.
 * - Accepts numeric strings safely (no BigInt literals)
 * - Optionally divides by a given number of decimals
 */
export function formatAmount(
  amount: string | number | null | undefined,
  options: { decimals?: number; minFraction?: number; maxFraction?: number } = {}
) {
  const { decimals = 0, minFraction = 0, maxFraction = 4 } = options;
  if (amount == null) return '0';
  const raw = typeof amount === 'number' ? String(amount) : amount;
  if (!/^-?\d+$/.test(raw)) return String(amount);

  if (decimals === 0) {
    const n = Number(raw);
    return Number.isNaN(n)
      ? raw
      : n.toLocaleString(undefined, {
          minimumFractionDigits: minFraction,
          maximumFractionDigits: maxFraction,
        });
  }

  const negative = raw.startsWith('-');
  const digitsOnly = negative ? raw.slice(1) : raw;
  const pad = digitsOnly.padStart(decimals + 1, '0');
  const intPart = pad.slice(0, pad.length - decimals);
  const fracRaw = pad.slice(pad.length - decimals);
  const fracTrim = fracRaw.replace(/0+$/, '');
  const fracSized = fracTrim
    ? fracTrim.slice(0, maxFraction).padEnd(
        Math.max(minFraction, Math.min(maxFraction, fracTrim.length)),
        '0'
      )
    : ''.padEnd(minFraction, '0');

  const joined = fracSized ? `${intPart}.${fracSized}` : intPart;
  return (negative ? '-' : '') + joined;
}