// src/components/pages/CreatorHub/ManagePasses/PassesOverview.tsx
import React, { useMemo } from 'react';
import type { Pass } from '../../../../types/pass';
import { cx, list, page, skeleton } from '../shared/hubStyles';
import { formatMoney, soldCount } from './passHelpers';

interface PassesOverviewProps {
  passes: Pass[] | undefined;
  sales?: {
    card: { currency: string; purchase_count: number; gross_minor: number; fee_minor: number; proceeds_minor: number };
    crypto: { currency: string; purchase_count: number; gross_minor: number; fee_minor: number; proceeds_minor: number };
    buyers: number;
    pass_holders: number;
  } | null;
  isLoading: boolean;
  error: unknown;
}

interface Tile {
  label: string;
  value: string;
  hint?: string;
}

/**
 * Four numbers above the list, in one panel divided by hairlines — no cards,
 * no icons, no change arrows. Revenue carries its currency; a creator selling
 * in two currencies sees one total per currency rather than a meaningless sum.
 */
const PassesOverview: React.FC<PassesOverviewProps> = ({ passes, sales, isLoading, error }) => {
  const tiles = useMemo<Tile[]>(() => {
    const rows = passes ?? [];
    let sold = 0;
    let cappedSold = 0;
    let supplyCap = 0;
    rows.forEach((pass) => {
      const passSold = soldCount(pass);
      sold += passSold;
      if (pass.supply_cap) {
        supplyCap += pass.supply_cap;
        cappedSold += passSold;
      }
    });

    const revenue = sales
      ? [
          `${formatMoney(sales.card.proceeds_minor, sales.card.currency)} card`,
          `${formatMoney(sales.crypto.proceeds_minor, sales.crypto.currency)} crypto`,
        ].join(' · ')
      : '—';

    const hasUnlimited = rows.some((pass) => !pass.supply_cap);

    return [
      { label: 'Passes', value: rows.length.toLocaleString() },
      { label: 'Sold', value: (sales ? sales.card.purchase_count + sales.crypto.purchase_count : sold).toLocaleString() },
      {
        label: 'Available supply',
        value: supplyCap > 0 ? Math.max(0, supplyCap - cappedSold).toLocaleString() : hasUnlimited ? '∞' : '0',
        hint: supplyCap > 0 && hasUnlimited ? 'capped passes only' : undefined,
      },
      { label: 'Your proceeds', value: revenue, hint: sales ? 'after the platform fee; refunds excluded' : 'loading sales' },
    ];
  }, [passes, sales]);

  return (
    <div
      className={cx(
        list.panel,
        'grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-800/60',
        '[&>*:nth-child(3)]:border-l-0 md:[&>*:nth-child(3)]:border-l',
        '[&>*:nth-child(n+3)]:border-t md:[&>*:nth-child(n+3)]:border-t-0',
      )}
      role="group"
      aria-label="Pass totals"
    >
      {tiles.map((tile) => (
        <div key={tile.label} className="min-w-0 border-gray-800/60 px-4 py-3 md:px-5">
          <p className={page.eyebrow}>{tile.label}</p>
          {isLoading ? (
            <div className={cx(skeleton.line, 'mt-2 h-5 w-16')} aria-hidden="true" />
          ) : (
            <p
              className={cx(
                'mt-1 truncate text-xl font-semibold tabular-nums',
                error ? 'text-gray-600' : 'text-white',
              )}
              title={error ? undefined : tile.value}
            >
              {error ? '—' : tile.value}
            </p>
          )}
          {tile.hint && !isLoading && !error && <p className="mt-0.5 text-xs text-gray-600">{tile.hint}</p>}
        </div>
      ))}
    </div>
  );
};

export default PassesOverview;
