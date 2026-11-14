// src/components/pages/CreatorHub/ManagePasses/PassesList.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as Tooltip from '@radix-ui/react-tooltip';
import { AlertCircle, RefreshCw, SearchX, Ticket } from 'lucide-react';
import type { Pass } from '../../../../types/pass';
import type { PassRow as BusinessPassRow } from '../../../../types/creatorBusiness';
import { EARNINGS_LABEL, formatMinor, saleState } from '../Business/businessFormat';
import { SaleFixLink, SalePill } from '../Business/BusinessUi';
import { button, cx, empty, hairlineBar, list, skeleton } from '../Business/businessStyles';
import PassRowActions from './PassRowActions';
import PassStatusPill from './PassStatusPill';
import PassesSkeleton from './PassesSkeleton';
import { isPublished, passHref, passPriceText, soldCount, soldText } from './passHelpers';

const PASSES_ENABLED = process.env.REACT_APP_SHOW_PASSES === 'true';
const FALLBACK_THUMBNAIL = '/assets/Content-pass.webp';

export type PassFilter = 'all' | 'live' | 'drafts';

interface PassesListProps {
  /** The rows after the page's client-side filter. */
  passes: Pass[];
  /** True when the filter — not the account — is why there are no rows. */
  filtered: boolean;
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  onClearFilter: () => void;
  /** Each pass's business row, ALL TIME (Business → Passes); absent when passes are off. */
  stats?: Map<string, BusinessPassRow>;
  statsLoading?: boolean;
  statsError?: boolean;
  /** Channel (and period) kept when opening a pass. */
  detailSearch?: string;
}

/**
 * Anything interactive inside the row (the title link, the action buttons,
 * the Radix menu) handles its own click; a click anywhere else on the row
 * opens the pass.
 */
const isOwnTarget = (event: React.MouseEvent<HTMLTableRowElement>): boolean =>
  !(event.target as HTMLElement).closest('a, button, [role="menu"], [role="menuitem"], [data-radix-popper-content-wrapper]');

interface StatsProps {
  stat?: BusinessPassRow;
  /** Business numbers are shown at all (passes on). */
  withStats: boolean;
  loading: boolean;
  failed: boolean;
}

/** A pass's earnings since it went on sale, one line per currency. */
const EarningsCell: React.FC<StatsProps> = ({ stat, loading, failed }) => {
  if (!stat) {
    if (loading) return <span className={cx(skeleton.line, 'ml-auto block h-3 w-16')} aria-hidden="true" />;
    if (failed) return <span className="text-xs text-gray-400">Not available</span>;
    return (
      <span className="text-gray-500">
        —<span className="sr-only">none</span>
      </span>
    );
  }
  if (!stat.totals.money.length) {
    return (
      <span className="text-gray-500">
        —<span className="sr-only">nothing paid yet</span>
      </span>
    );
  }
  return (
    <span className="flex flex-col items-end">
      {stat.totals.money.map((m) => (
        <span key={m.currency} className="whitespace-nowrap text-sm font-semibold tabular-nums text-white">
          {formatMinor(m.proceeds, m.currency, m.decimals)}
        </span>
      ))}
    </span>
  );
};

const PassRow: React.FC<{ pass: Pass; stats: StatsProps; detailSearch: string }> = ({ pass, stats, detailSearch }) => {
  const navigate = useNavigate();
  const href = isPublished(pass) ? `${passHref(pass)}${detailSearch}` : passHref(pass);
  const sold = soldCount(pass);
  const cap = pass.supply_cap;
  const videoCount = pass.videos?.length ?? 0;
  const thumbnail = pass.videos?.[0]?.thumbnail_url || FALLBACK_THUMBNAIL;
  const soldPct = cap ? Math.min(100, Math.round((sold / cap) * 100)) : 0;
  // The business API's answer to "can someone buy it right now?" replaces the lifecycle pill when it is here.
  const sale = stats.stat ? saleState(stats.stat, { videoCount }) : null;
  const num = cx(list.table.cell, 'text-right');

  return (
    <tr
      className={cx(list.table.row, 'cursor-pointer')}
      onClick={(event) => {
        if (isOwnTarget(event)) navigate(href);
      }}
    >
      <td className={list.table.cell}>
        <div className="flex min-w-0 items-center gap-3.5">
          <img
            src={thumbnail}
            alt=""
            loading="lazy"
            className="aspect-video w-24 shrink-0 rounded-lg border border-gray-800/60 bg-black object-cover"
          />
          <div className="min-w-0 flex-1">
            <Link to={href} className={cx(list.title, 'block')} title={pass.title}>
              {pass.title}
            </Link>
            <p className={cx(list.preview, 'mt-1 tabular-nums')}>
              {videoCount} {videoCount === 1 ? 'video' : 'videos'}
            </p>
          </div>
        </div>
      </td>
      <td className={list.table.cell}>
        {/* One pill (its reason is the tooltip) and, when the creator can fix it, one short action. */}
        {sale ? (
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <SalePill state={sale} />
            {sale.reason && <span className="sr-only">{sale.reason}</span>}
            <SaleFixLink state={sale} pass={stats.stat} className="whitespace-nowrap text-xs" />
          </div>
        ) : (
          <PassStatusPill pass={pass} />
        )}
      </td>
      <td className={num}>
        <div className="ml-auto w-28">
          <p className={cx(list.stat, 'whitespace-nowrap text-gray-100')}>{soldText(sold, cap)}</p>
          {cap ? (
            <div
              className={cx(hairlineBar.track, 'mt-2 h-1')}
              role="progressbar"
              aria-label="Passes sold"
              aria-valuemin={0}
              aria-valuemax={cap}
              aria-valuenow={Math.min(sold, cap)}
            >
              <div className={hairlineBar.fill} style={{ width: `${soldPct}%` }} />
            </div>
          ) : (
            <p className="mt-1 whitespace-nowrap text-[11px] text-amber-300">No cap set</p>
          )}
        </div>
      </td>
      <td className={num}>
        <span className={cx(list.stat, 'whitespace-nowrap')}>{passPriceText(pass, stats.stat?.price)}</span>
      </td>
      {stats.withStats && (
        <td className={num}>
          <EarningsCell {...stats} />
        </td>
      )}
      <td className={cx(list.table.cell, 'w-[7.5rem]')}>
        <div className={list.revealed}>
          <PassRowActions pass={pass} sale={stats.stat} />
        </div>
      </td>
    </tr>
  );
};

const ListEmpty: React.FC<{ icon: React.ReactNode; title: string; body: string; action: React.ReactNode; role?: 'alert' }> = ({ icon, title, body, action, role }) => (
  <div className={empty.wrapper} role={role}>
    <span className={empty.icon}>{icon}</span>
    <p className={empty.title}>{title}</p>
    <p className={empty.body}>{body}</p>
    <div className="mt-5">{action}</div>
  </div>
);

/**
 * The pass rows: lasting facts only (status, sold, price, earnings since the
 * pass went on sale). Period analysis — buyers, conversion, refunds — is on
 * each pass's own page. The data arrives from the page; this component only
 * decides what the rows look like.
 */
const PassesList: React.FC<PassesListProps> = ({
  passes,
  filtered,
  isLoading,
  error,
  onRetry,
  onClearFilter,
  stats,
  statsLoading = false,
  statsError = false,
  detailSearch = '',
}) => {
  if (isLoading) {
    return <PassesSkeleton />;
  }

  if (error) {
    return (
      <ListEmpty
        role="alert"
        icon={<AlertCircle className="h-5 w-5 text-red-300" aria-hidden="true" />}
        title="Couldn't load your passes"
        body="Something went wrong on our side. Try again in a moment."
        action={
          <button type="button" onClick={onRetry} className={button.secondary}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
        }
      />
    );
  }

  if (!passes.length) {
    if (filtered) {
      return (
        <ListEmpty
          icon={<SearchX className="h-5 w-5" aria-hidden="true" />}
          title="Nothing matches"
          body="No pass here fits this filter."
          action={
            <button type="button" onClick={onClearFilter} className={button.secondary}>
              Show all passes
            </button>
          }
        />
      );
    }

    return (
      <ListEmpty
        icon={<Ticket className="h-5 w-5" aria-hidden="true" />}
        title={PASSES_ENABLED ? 'No pass yet' : 'Content passes are coming soon'}
        body={
          PASSES_ENABLED
            ? 'A pass sells access to a set of your videos with one link.'
            : 'You will be able to sell access to a set of your videos with one link.'
        }
        action={
          PASSES_ENABLED ? (
            <Link to="/creator-hub/create-content-pass" className={button.primary}>
              Create your first pass
            </Link>
          ) : (
            <span className={cx(button.secondary, 'cursor-not-allowed opacity-50')} aria-disabled="true">
              Coming soon
            </span>
          )
        }
      />
    );
  }

  const withStats = Boolean(stats);
  const th = list.table.headerCell;
  return (
    <Tooltip.Provider delayDuration={300}>
      {/* The page column hides overflow: a wide table scrolls inside its panel on a phone. */}
      <div className="overflow-x-auto">
        <table className={cx('w-full', withStats ? 'min-w-[52rem]' : 'min-w-[42rem]')}>
          <thead className={list.table.header}>
            <tr>
              <th className={th}>Pass</th>
              <th className={cx(th, 'w-[18rem]')}>Status</th>
              <th className={cx(th, 'w-36 text-right')}>Sold</th>
              <th className={cx(th, 'w-28 text-right')}>Price</th>
              {withStats && <th className={cx(th, 'w-40 text-right')}>{EARNINGS_LABEL}</th>}
              <th className={cx(th, 'w-[7.5rem]')}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className={list.divider}>
            {passes.map((pass) => (
              <PassRow
                key={pass.id}
                pass={pass}
                detailSearch={detailSearch}
                stats={{ stat: stats?.get(pass.id), withStats, loading: statsLoading, failed: statsError }}
              />
            ))}
          </tbody>
        </table>
      </div>
    </Tooltip.Provider>
  );
};

export default PassesList;
