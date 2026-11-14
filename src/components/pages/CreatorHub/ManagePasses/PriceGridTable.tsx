// A pass's price grid for its creator: one row per tier. In the wizard it
// shows the grid being promised; on the pass page each row also says how
// many of its passes are paid, and the tier on offer is marked. No chart, no
// change figures (owner's copy rule).
import React from 'react';
import { cx, pillClass, surface, table, text } from '../Business/businessStyles';
import { formatMinor } from '../Business/businessFormat';
import type { PriceTierDto, PublicTierState } from '../../../../utils/passPricing';

export interface GridRow extends PriceTierDto {
  /** Passes of this tier paid for (pass page only). */
  paid?: number;
  state?: PublicTierState;
}

const PriceGridTable: React.FC<{ rows: GridRow[]; currency?: string | null; caption?: string; className?: string }> = ({
  rows,
  currency,
  caption = 'Price grid',
  className,
}) => {
  if (rows.length < 2) return null;
  const withSales = rows.some((row) => typeof row.paid === 'number');
  return (
    <div className={cx(surface.inset, 'overflow-x-auto', className)}>
      <table className="w-full text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className={table.head}>
          <tr>
            <th scope="col" className={cx(table.th, 'py-2')}>Tier</th>
            <th scope="col" className={cx(table.th, table.num, 'py-2')}>{withSales ? 'Paid / passes' : 'Passes'}</th>
            <th scope="col" className={cx(table.th, table.num, 'py-2')}>Price</th>
          </tr>
        </thead>
        <tbody className={table.body}>
          {rows.map((row, i) => (
            <tr key={i}>
              <td className="px-4 py-2 text-gray-300">
                <span className="tabular-nums">{i + 1}</span>
                {row.state === 'current' && <span className={pillClass('accent', 'ml-2')}>On sale now</span>}
                {row.state === 'sold' && <span className={pillClass('neutral', 'ml-2')}>Sold</span>}
              </td>
              <td className="px-4 py-2 text-right tabular-nums text-gray-200">
                {withSales ? `${(row.paid ?? 0).toLocaleString('en-US')} / ${row.size.toLocaleString('en-US')}` : row.size.toLocaleString('en-US')}
              </td>
              <td className="whitespace-nowrap px-4 py-2 text-right font-semibold tabular-nums text-white">
                {formatMinor(row.priceCents, currency || 'EUR', 2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {withSales && <p className={cx(text.note, 'px-4 py-2')}>Paid passes only. A refund before the pass is claimed puts it back in its tier.</p>}
    </div>
  );
};

export default PriceGridTable;
