import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowDown, ArrowUp, Download, Search, SearchX, Users, X } from 'lucide-react';
import { exportBusinessCustomers } from '../../../../api/creatorBusiness';
import { useAllBusinessPasses, useBusinessCustomers } from '../../../../hooks/useCreatorBusiness';
import type { CustomerRow, CustomerSort } from '../../../../types/creatorBusiness';
import { plainApiError } from '../../../../utils/plainApiError';
import HubSelect from '../shared/HubSelect';
import { ACCESS_LABELS, EARNINGS_LABEL, emailHiddenText, formatCount, formatMomentDate, holdingText, nextStep, plural } from './businessFormat';
import { Monogram, PaidToYou } from './customerBits';
import {
  BUSINESS_BASE,
  BusinessHeader,
  BusinessTabs,
  BusinessToolbar,
  EmptyState,
  NextStepPanel,
  Pager,
  PASSES_ENABLED,
  PassesUnavailable,
  ScopedError,
  SkeletonLines,
  StaleNotice,
} from './BusinessUi';
import {
  CUSTOMER_FILTER_KEYS,
  MAX_SEARCH_LENGTH,
  QUICK_FILTERS,
  activeFilterCount,
  customerApiParams,
  parseCustomerState,
  type CustomerState,
} from './businessUrlState';
import { useBusinessScope } from './useBusinessScope';
import { button, cx, field, frame, segmented, surface, table } from './businessStyles';

const ANY = 'any';

const SOURCE_OPTIONS = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'x', label: 'X' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'google', label: 'Google search' },
  { value: 'newsletter', label: 'Newsletter / email' },
  { value: 'direct', label: 'Direct' },
  { value: 'other', label: 'Other site' },
  { value: 'unknown', label: 'Unknown' },
];

const SORT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'last_purchase:desc', label: 'Last purchase, newest first' },
  { value: 'last_purchase:asc', label: 'Last purchase, oldest first' },
  { value: 'first_purchase:desc', label: 'First purchase, newest first' },
  { value: 'first_purchase:asc', label: 'First purchase, oldest first' },
  { value: 'total_paid:desc', label: `${EARNINGS_LABEL}, highest first` },
  { value: 'total_paid:asc', label: `${EARNINGS_LABEL}, lowest first` },
  { value: 'purchases:desc', label: 'Most purchases first' },
  { value: 'purchases:asc', label: 'Fewest purchases first' },
];

const isOwnTarget = (event: React.MouseEvent): boolean => !(event.target as HTMLElement).closest('a, button');

/** Trigger a browser download of a Blob. */
function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

const SortHeader: React.FC<{ label: string; sort: CustomerSort; state: CustomerState; onSort: (sort: CustomerSort, dir: 'asc' | 'desc') => void; align?: 'right' }> = ({
  label,
  sort,
  state,
  onSort,
  align,
}) => {
  const active = state.sort === sort;
  return (
    <th className={cx(table.th, align === 'right' && 'text-right')} aria-sort={active ? (state.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button
        type="button"
        onClick={() => onSort(sort, active && state.dir === 'desc' ? 'asc' : 'desc')}
        className={cx(
          'inline-flex items-center gap-1 rounded-sm font-medium transition-colors hover:text-white',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa7517]/50',
          active && 'text-white',
        )}
      >
        {label}
        {active &&
          (state.dir === 'asc' ? (
            <ArrowUp className="h-3.5 w-3.5 text-[#fa7517]" aria-hidden="true" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5 text-[#fa7517]" aria-hidden="true" />
          ))}
      </button>
    </th>
  );
};

/** Who: the name (opens the customer page) and the email, or why it is not shown. No badges: those are on the customer page. */
const CustomerName: React.FC<{ row: CustomerRow; href: string; backState: unknown }> = ({ row, href, backState }) => (
  <div className="flex min-w-0 items-center gap-3">
    <Monogram name={row.displayName} />
    <div className="min-w-0">
      <Link
        to={href}
        state={backState}
        className="block min-w-0 max-w-full truncate rounded-sm text-sm font-medium text-gray-100 transition-colors hover:text-[#fa7517] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa7517]/50"
        title={row.displayName}
      >
        {row.displayName}
      </Link>
      {row.email ? (
        <p className="mt-0.5 truncate text-xs text-gray-400" title={row.email}>
          {row.email}
        </p>
      ) : (
        <p className="mt-0.5 line-clamp-2 text-[11px] text-gray-400">{emailHiddenText(row.emailHidden)}</p>
      )}
    </div>
  </div>
);

/** What the customer has: "2 passes", and only when it differs, one quiet second fact. */
const Holding: React.FC<{ row: CustomerRow; align?: 'left' | 'right' }> = ({ row, align = 'left' }) => {
  const holding = holdingText(row);
  return (
    <span className={cx('flex flex-col', align === 'right' ? 'items-end text-right' : 'items-start')}>
      <span className={cx('whitespace-nowrap text-sm', row.passesHeld > 0 ? 'text-gray-100' : 'text-gray-400')}>{holding.main}</span>
      {holding.note && <span className="whitespace-nowrap text-[11px] text-amber-200/90">{holding.note}</span>}
    </span>
  );
};

/**
 * Business → Customers: one row per person who paid, with every filter of
 * the API as a control, sorts, pages and a CSV export of the filtered list.
 * People who never paid are never listed.
 */
const CustomersPage: React.FC = () => {
  const scope = useBusinessScope();
  const navigate = useNavigate();
  const location = useLocation();
  const state = useMemo(() => parseCustomerState(scope.params), [scope.params]);
  const apiParams = useMemo(() => ({ ...scope.apiParams, ...customerApiParams(state) }), [scope.apiParams, state]);
  const customers = useBusinessCustomers(apiParams, { enabled: PASSES_ENABLED });
  const passes = useAllBusinessPasses(scope.apiParams, { enabled: PASSES_ENABLED });
  const data = customers.data;
  const search = scope.linkSearch();
  const backState = { back: `${location.pathname}${location.search}` };

  // Search: typed locally, written to the address after a short pause.
  const update = scope.update;
  const [searchText, setSearchText] = useState(state.search);
  const typing = useRef(false);
  useEffect(() => {
    if (!typing.current) setSearchText(state.search);
  }, [state.search]);
  useEffect(() => {
    if (!typing.current) return undefined;
    const timer = window.setTimeout(() => {
      typing.current = false;
      update({ q: searchText.trim() || null }, { resetPage: true, replace: true });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchText, update]);

  const [exporting, setExporting] = useState(false);
  const [exportNote, setExportNote] = useState<{ tone: 'ok' | 'warn' | 'error'; text: string } | null>(null);

  const setFilter = (key: string, value: string | null) => scope.update({ [key]: value === ANY ? null : value }, { resetPage: true });
  const onSort = (sort: CustomerSort, dir: 'asc' | 'desc') => scope.update({ sort, dir }, { resetPage: true });
  const clearFilters = () => {
    typing.current = false;
    setSearchText('');
    scope.update(Object.fromEntries(CUSTOMER_FILTER_KEYS.map((key) => [key, null])), { resetPage: true });
  };
  const filtersOn = activeFilterCount(state) > 0 || state.search !== '';

  const passOptions = useMemo(
    () => [
      { value: ANY, label: 'All passes' },
      ...(passes.data?.items ?? []).map((p) => ({ value: p.passId, label: p.title || 'Untitled pass' })),
      ...(state.passId && !(passes.data?.items ?? []).some((p) => p.passId === state.passId)
        ? [{ value: state.passId, label: 'Selected pass' }]
        : []),
    ],
    [passes.data, state.passId],
  );

  const currencies = useMemo(() => {
    const set = new Set<string>();
    (data?.items ?? []).forEach((row) => row.paidToYou.forEach((p) => set.add(p.currency)));
    (passes.data?.items ?? []).forEach((p) => p.totals.money.forEach((m) => set.add(m.currency)));
    if (data?.sortCurrency) set.add(data.sortCurrency);
    return Array.from(set).sort();
  }, [data, passes.data]);

  const runExport = async () => {
    setExporting(true);
    setExportNote(null);
    try {
      const { page: _page, pageSize: _size, ...exportParams } = apiParams;
      const out = await exportBusinessCustomers(exportParams);
      download(out.blob, out.filename);
      // What the server wrote: rows in the file, people matching, and whether it stopped at the cap.
      if (out.truncated) {
        const cap = data?.exportRowCap;
        setExportNote({
          tone: 'warn',
          text: `${out.filename} holds the first ${out.rows !== null ? formatCount(out.rows) : 'part'} of ${
            out.total !== null ? formatCount(out.total) : 'the matching'
          } customers${cap ? `: an export stops at ${formatCount(cap)}` : ''}. Narrow the period or the filters to get the rest.`,
        });
      } else {
        setExportNote({
          tone: 'ok',
          text: out.rows !== null ? `Downloaded ${out.filename}: ${plural(out.rows, 'customer', 'customers')}.` : `Downloaded ${out.filename}.`,
        });
      }
    } catch (error) {
      setExportNote({ tone: 'error', text: plainApiError(error, 'The export could not be made. Please try again.').message });
    } finally {
      setExporting(false);
    }
  };

  const detailHref = (row: CustomerRow) => `${BUSINESS_BASE}/customers/${encodeURIComponent(row.customerId)}${search}`;

  const filterBar = (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-[14rem] flex-1 sm:max-w-sm">
          <span className="sr-only">Search customers by name or shared email</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            type="search"
            value={searchText}
            maxLength={MAX_SEARCH_LENGTH}
            onChange={(event) => {
              typing.current = true;
              setSearchText(event.target.value);
            }}
            placeholder="Search name or email"
            className={cx(field.input, 'pl-9')}
          />
        </label>
        <HubSelect value={state.passId ?? ANY} ariaLabel="Pass" onChange={(v) => setFilter('pass', v)} options={passOptions} />
        <HubSelect
          value={state.access ?? ANY}
          ariaLabel="Access"
          onChange={(v) => setFilter('access', v)}
          options={[
            { value: ANY, label: 'Any access' },
            { value: 'active', label: ACCESS_LABELS.active },
            { value: 'refunded', label: ACCESS_LABELS.refunded },
            { value: 'disputed', label: ACCESS_LABELS.disputed },
            { value: 'none', label: ACCESS_LABELS.none },
          ]}
        />
        <HubSelect
          value={state.buyerType ?? ANY}
          ariaLabel="New or returning"
          onChange={(v) => setFilter('buyer', v)}
          options={[
            { value: ANY, label: 'New and returning' },
            { value: 'new', label: 'New buyers' },
            { value: 'returning', label: 'Returning buyers' },
          ]}
        />
        <HubSelect
          value={state.canContact === null ? ANY : state.canContact ? 'yes' : 'no'}
          ariaLabel="Can email"
          onChange={(v) => setFilter('contact', v)}
          options={[
            { value: ANY, label: 'Email or not' },
            { value: 'yes', label: 'Can email' },
            { value: 'no', label: 'Cannot email' },
          ]}
        />
        <HubSelect
          value={state.opened ?? ANY}
          ariaLabel="Opened"
          onChange={(v) => setFilter('opened', v)}
          options={[
            { value: ANY, label: 'Opened or not' },
            { value: 'opened', label: 'Opened something' },
            { value: 'never', label: 'Not opened yet' },
          ]}
        />
        <HubSelect
          value={state.source ?? ANY}
          ariaLabel="Source"
          onChange={(v) => setFilter('source', v)}
          options={[{ value: ANY, label: 'Any source' }, ...SOURCE_OPTIONS]}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Quick filters">
          {QUICK_FILTERS.map((chip) => {
            const on = scope.params.get(chip.key) === chip.value;
            return (
              <button
                key={chip.id}
                type="button"
                aria-pressed={on}
                onClick={() => setFilter(chip.key, on ? null : chip.value)}
                className={cx(segmented.chip, 'rounded-full border', on ? cx(segmented.chipActive, 'border-[#fa7517]/30') : cx(segmented.chipIdle, 'border-gray-800'))}
              >
                {chip.label}
              </button>
            );
          })}
          {filtersOn && (
            <button type="button" onClick={clearFilters} className={cx(button.ghost, 'h-8 text-xs')}>
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Clear filters
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {state.sort === 'total_paid' && currencies.length > 1 && (
            <HubSelect
              className="!min-w-[7rem]"
              value={data?.sortCurrency ?? state.sortCurrency ?? currencies[0]}
              ariaLabel="Currency to sort by"
              onChange={(v) => scope.update({ cur: v }, { resetPage: true })}
              options={currencies.map((c) => ({ value: c, label: `In ${c}` }))}
            />
          )}
          <HubSelect
            value={`${state.sort}:${state.dir}`}
            ariaLabel="Sort"
            onChange={(v) => {
              const [sort, dir] = v.split(':') as [CustomerSort, 'asc' | 'desc'];
              onSort(sort, dir);
            }}
            options={SORT_OPTIONS}
          />
        </div>
      </div>
    </div>
  );

  let body: React.ReactNode;
  if (!PASSES_ENABLED) {
    body = <PassesUnavailable />;
  } else if (!data && customers.isLoading) {
    body = (
      <div className={cx(surface.card, 'p-5 md:p-6')} aria-busy="true">
        <SkeletonLines lines={8} />
      </div>
    );
  } else if (!data) {
    body = <ScopedError error={customers.error} onRetry={() => void customers.refetch()} scope={scope} what="your customers" />;
  } else if (data.pagination.total === 0) {
    if (filtersOn) {
      body = (
        <EmptyState
          icon={SearchX}
          title="Nobody matches"
          body="No customer in these days fits the search and filters."
          action={
            <button type="button" onClick={clearFilters} className={button.secondary}>
              Clear filters
            </button>
          }
        />
      );
    } else if (data.scope.passCount === 0) {
      body = <NextStepPanel step={{ kind: 'no_pass' }} search={search} />;
    } else {
      body = (
        <div className="space-y-6">
          <EmptyState
            icon={Users}
            title="Nobody paid you in these days"
            body="People appear here from their first paid purchase."
            action={
              scope.period.preset !== 'all' ? (
                <button type="button" onClick={() => scope.setPreset('all')} className={button.secondary}>
                  Show all time
                </button>
              ) : undefined
            }
          />
          {passes.data && <NextStepPanel step={nextStep(passes.data.items)} search={search} compact noSalesTitle="Get your first buyers" />}
        </div>
      );
    }
  } else {
    const rows = data.items;
    body = (
      <div
        className={cx(surface.card, 'transition-opacity motion-reduce:transition-none', customers.isPlaceholderData && 'opacity-60')}
        aria-busy={customers.isFetching}
      >
        {customers.isError && <StaleNotice what="list" onRetry={() => void customers.refetch()} className="m-3" />}
        {/* Phone and small tablet: one card per person. */}
        <ul className={cx(surface.divider, 'md:hidden')}>
          {rows.map((row) => (
            <li key={row.customerId} className="space-y-3 px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <CustomerName row={row} href={detailHref(row)} backState={backState} />
                <PaidToYou paid={row.paidToYou} />
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                <dt className="text-gray-400">Has access to</dt>
                <dd>
                  <Holding row={row} align="right" />
                </dd>
                <dt className="text-gray-400">Last purchase</dt>
                <dd className="text-right text-gray-200">{formatMomentDate(row.lastPurchaseAt)}</dd>
                <dt className="text-gray-400">Came from</dt>
                <dd className="text-right text-gray-200">{row.firstSource.label}</dd>
              </dl>
            </li>
          ))}
        </ul>

        {/* Tablet and up: the table. */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[48rem]">
            <thead className={table.head}>
              <tr>
                <th className={table.th}>Customer</th>
                <th className={table.th}>Has access to</th>
                <SortHeader label={EARNINGS_LABEL} sort="total_paid" state={state} onSort={onSort} align="right" />
                <SortHeader label="Last purchase" sort="last_purchase" state={state} onSort={onSort} />
                <th className={table.th}>Came from</th>
              </tr>
            </thead>
            <tbody className={table.body}>
              {rows.map((row) => (
                <tr
                  key={row.customerId}
                  className={cx(table.row, 'cursor-pointer')}
                  onClick={(event) => {
                    if (isOwnTarget(event)) navigate(detailHref(row), { state: backState });
                  }}
                >
                  <td className={cx(table.td, 'max-w-[24rem]')}>
                    <CustomerName row={row} href={detailHref(row)} backState={backState} />
                  </td>
                  <td className={table.td}>
                    <Holding row={row} />
                  </td>
                  <td className={cx(table.td, 'text-right')}>
                    <PaidToYou paid={row.paidToYou} />
                  </td>
                  <td className={cx(table.td, 'whitespace-nowrap text-sm tabular-nums text-gray-300')}>{formatMomentDate(row.lastPurchaseAt)}</td>
                  <td className={cx(table.td, 'whitespace-nowrap text-sm text-gray-300')}>{row.firstSource.label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pager
          page={data.pagination.page}
          pageSize={data.pagination.pageSize}
          total={data.pagination.total}
          noun={['customer', 'customers']}
          onPage={(next) => scope.update({ page: next > 1 ? next : null })}
          onPageSize={(size) => scope.update({ size: size === 25 ? null : size }, { resetPage: true })}
        />
      </div>
    );
  }

  const total = data?.pagination.total ?? null;
  const cap = data?.exportRowCap ?? null;

  return (
    <div className={frame.page}>
      <div className={frame.business}>
        <BusinessHeader
          title="Customers"
          count={total}
          subtitle="Everyone who paid you, one row per person."
          actions={
            PASSES_ENABLED && (
              <button
                type="button"
                onClick={() => void runExport()}
                disabled={exporting || !data || data.pagination.total === 0}
                className={button.primary}
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                {exporting ? 'Preparing file…' : 'Export CSV'}
              </button>
            )
          }
        />
        <BusinessTabs search={search} />
        {PASSES_ENABLED && <BusinessToolbar scope={scope} apiChannels={data?.scope.channels} range={data?.range} />}
        {PASSES_ENABLED && filterBar}
        {PASSES_ENABLED && (
          <div className="space-y-1 text-xs text-gray-400" aria-live="polite">
            <p>
              The export uses these filters. Emails are in it only for customers who allow you to contact them.
              {total !== null && cap !== null && total > cap ? ` These filters match ${formatCount(total)} customers; the file stops at ${formatCount(cap)}.` : ''}
            </p>
            {exportNote && (
              <p
                role={exportNote.tone === 'error' ? 'alert' : 'status'}
                className={exportNote.tone === 'error' ? 'text-red-300' : exportNote.tone === 'warn' ? 'text-amber-300' : 'text-emerald-300'}
              >
                {exportNote.text}
              </p>
            )}
          </div>
        )}
        {body}
      </div>
    </div>
  );
};

export default CustomersPage;
