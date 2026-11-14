import React from 'react';
import type { AccessState, CustomerRow } from '../../../../types/creatorBusiness';
import { ACCESS_LABELS, formatMinor, plural } from './businessFormat';
import { cx, pillClass, type PillTone } from './businessStyles';

const ACCESS_TONE: Record<AccessState, PillTone> = {
  active: 'positive',
  refunded: 'attention',
  disputed: 'negative',
  none: 'neutral',
};

/** The access pill's colour, by what the state means. */
export const accessPillClass = (state: AccessState): string => pillClass(ACCESS_TONE[state]);

export const AccessPill: React.FC<{ state: AccessState }> = ({ state }) => <span className={accessPillClass(state)}>{ACCESS_LABELS[state]}</span>;

/** "New" (accent) or "Returning" (neutral): the same two pills everywhere. */
export const BuyerTypePill: React.FC<{ returning: boolean; title?: string }> = ({ returning, title }) => (
  <span className={pillClass(returning ? 'neutral' : 'accent')} title={title}>
    {returning ? 'Returning' : 'New'}
  </span>
);

/** Up to two initials of a display name ("Ana Lima" → "AL", "Buyer 3FA9C1" → "B3"). */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.slice(0, 2).map((word) => Array.from(word)[0] ?? '');
  return letters.join('').toUpperCase() || '?';
}

/** A quiet monogram instead of a stock avatar: the hub never has a buyer's photo. */
export const Monogram: React.FC<{ name: string; size?: 'sm' | 'lg' }> = ({ name, size = 'sm' }) => (
  <span
    aria-hidden="true"
    className={cx(
      'inline-flex shrink-0 items-center justify-center rounded-full border border-gray-800 bg-black font-semibold text-gray-300',
      size === 'lg' ? 'h-14 w-14 text-lg' : 'h-8 w-8 text-[11px]',
    )}
  >
    {initials(name)}
  </span>
);

/** A customer's earnings for the creator, one line per currency, never added together. */
export const PaidToYou: React.FC<{ paid: CustomerRow['paidToYou']; align?: 'left' | 'right'; size?: 'row' | 'hero' }> = ({
  paid,
  align = 'right',
  size = 'row',
}) => {
  if (!paid.length) return <span className="text-sm text-gray-400">None</span>;
  return (
    <span className={cx('flex flex-col', align === 'right' ? 'items-end' : 'items-start')}>
      {paid.map((p) => (
        <span key={p.currency} className={cx('whitespace-nowrap tabular-nums', align === 'right' && 'text-right')}>
          <span className={size === 'hero' ? 'text-3xl font-bold tracking-tight text-white' : 'text-sm font-semibold text-white'}>
            {formatMinor(p.amount, p.currency, p.decimals)}
          </span>
          {p.amountUnknownPurchases > 0 && (
            <span className="block text-[11px] font-normal text-gray-400">
              + {plural(p.amountUnknownPurchases, 'purchase', 'purchases')} with no recorded amount
            </span>
          )}
        </span>
      ))}
    </span>
  );
};
