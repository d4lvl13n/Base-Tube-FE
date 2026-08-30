// src/components/pages/CreatorHub/ManagePasses/PassesList.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as Tooltip from '@radix-ui/react-tooltip';
import { AlertCircle, RefreshCw, SearchX, Ticket } from 'lucide-react';
import type { Pass } from '../../../../types/pass';
import { cx, form, hairlineBar, list, tierPill } from '../shared/hubStyles';
import PassRowActions from './PassRowActions';
import PassStatusPill from './PassStatusPill';
import PassesSkeleton from './PassesSkeleton';
import { passHref, soldCount } from './passHelpers';

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
}

/**
 * Anything interactive inside the row (the title link, the action buttons,
 * the Radix menu) handles its own click; a click anywhere else on the row is
 * the whole-card navigation the old card had.
 */
const isOwnTarget = (event: React.MouseEvent<HTMLTableRowElement>): boolean =>
  !(event.target as HTMLElement).closest('a, button, [role="menu"], [role="menuitem"], [data-radix-popper-content-wrapper]');

const PassRow: React.FC<{ pass: Pass }> = ({ pass }) => {
  const navigate = useNavigate();
  const href = passHref(pass);
  const sold = soldCount(pass);
  const cap = pass.supply_cap;
  const videoCount = pass.videos?.length ?? 0;
  const thumbnail = pass.videos?.[0]?.thumbnail_url || FALLBACK_THUMBNAIL;
  const soldPct = cap ? Math.min(100, Math.round((sold / cap) * 100)) : 0;

  return (
    <tr
      className={cx(list.table.row, 'cursor-pointer')}
      onClick={(event) => {
        if (isOwnTarget(event)) navigate(href);
      }}
    >
      <td className={list.table.cell}>
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={thumbnail}
            alt=""
            loading="lazy"
            className="aspect-video w-24 shrink-0 rounded-md border border-gray-800/60 bg-black object-cover"
          />
          <div className="min-w-0 flex-1">
            <Link to={href} className={cx(list.title, 'block')} title={pass.title}>
              {pass.title}
            </Link>
            <p className={cx(list.preview, 'mt-1 flex items-center gap-1.5')}>
              <span className="tabular-nums">
                {videoCount} {videoCount === 1 ? 'video' : 'videos'}
              </span>
              {pass.tier && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className={tierPill}>{pass.tier}</span>
                </>
              )}
            </p>
          </div>
        </div>
      </td>
      <td className={list.table.cell}>
        <PassStatusPill pass={pass} />
      </td>
      <td className={cx(list.table.cell, 'text-right')}>
        <span className={cx(list.stat, 'whitespace-nowrap text-gray-200')}>{pass.formatted_price}</span>
      </td>
      <td className={cx(list.table.cell, 'text-right')}>
        <div className="ml-auto w-24">
          <p className={cx(list.stat, 'whitespace-nowrap')}>
            <span className="text-gray-200">{sold.toLocaleString()}</span>
            {cap ? ` / ${cap.toLocaleString()}` : ' sold'}
          </p>
          <div
            className={cx(hairlineBar.track, 'mt-1.5')}
            role={cap ? 'progressbar' : undefined}
            aria-label={cap ? 'Supply sold' : undefined}
            aria-valuemin={cap ? 0 : undefined}
            aria-valuemax={cap ? cap : undefined}
            aria-valuenow={cap ? Math.min(sold, cap) : undefined}
          >
            {cap ? <div className={hairlineBar.fill} style={{ width: `${soldPct}%` }} /> : null}
          </div>
        </div>
      </td>
      <td className={cx(list.table.cell, 'w-[7.5rem]')}>
        <div className={list.revealed}>
          <PassRowActions pass={pass} />
        </div>
      </td>
    </tr>
  );
};

/**
 * The pass rows, in the same panel and vocabulary as the video list. The data
 * arrives from the page (one `useCreatorPasses` call feeds the strip, the
 * filter and this table); this component only decides what the rows look like.
 */
const PassesList: React.FC<PassesListProps> = ({
  passes,
  filtered,
  isLoading,
  error,
  onRetry,
  onClearFilter,
}) => {
  if (isLoading) {
    return <PassesSkeleton />;
  }

  if (error) {
    return (
      <div className={list.emptyState.wrapper} role="alert">
        <AlertCircle className="h-8 w-8 text-red-400/80" aria-hidden="true" />
        <p className={cx('mt-4', list.emptyState.title)}>Couldn&apos;t load your passes</p>
        <p className={list.emptyState.subtitle}>Something went wrong on our side. Try again in a moment.</p>
        <button type="button" onClick={onRetry} className={cx(form.secondaryButton, 'mt-4')}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Retry
        </button>
      </div>
    );
  }

  if (!passes.length) {
    if (filtered) {
      return (
        <div className={list.emptyState.wrapper}>
          <SearchX className="h-8 w-8 text-gray-600" aria-hidden="true" />
          <p className={cx('mt-4', list.emptyState.title)}>Nothing matches</p>
          <p className={list.emptyState.subtitle}>No pass here fits the current filter.</p>
          <button type="button" onClick={onClearFilter} className={cx(form.secondaryButton, 'mt-4')}>
            Show all passes
          </button>
        </div>
      );
    }

    return (
      <div className={list.emptyState.wrapper}>
        <Ticket className="h-8 w-8 text-gray-600" aria-hidden="true" />
        <p className={cx('mt-4', list.emptyState.title)}>
          {PASSES_ENABLED ? 'No content passes yet' : 'Content passes are coming soon'}
        </p>
        <p className={list.emptyState.subtitle}>
          {PASSES_ENABLED
            ? 'Bundle videos behind a pass and sell it with a single link.'
            : 'You will be able to bundle videos behind a pass and sell it with a link.'}
        </p>
        {PASSES_ENABLED ? (
          <Link to="/creator-hub/create-content-pass" className={cx(form.primaryButton, 'mt-4')}>
            Create your first pass
          </Link>
        ) : (
          <span className={cx(form.secondaryButton, 'mt-4 cursor-not-allowed opacity-50')} aria-disabled="true">
            Coming soon
          </span>
        )}
      </div>
    );
  }

  return (
    <Tooltip.Provider delayDuration={300}>
      <table className="w-full">
        <thead className={list.table.header}>
          <tr>
            <th className={list.table.headerCell}>Pass</th>
            <th className={cx(list.table.headerCell, 'w-[9rem]')}>Status</th>
            <th className={cx(list.table.headerCell, 'w-24 text-right')}>Price</th>
            <th className={cx(list.table.headerCell, 'w-32 text-right')}>Sold</th>
            <th className={cx(list.table.headerCell, 'w-[7.5rem]')}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className={list.divider}>
          {passes.map((pass) => (
            <PassRow key={pass.id} pass={pass} />
          ))}
        </tbody>
      </table>
    </Tooltip.Provider>
  );
};

export default PassesList;
