import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Compass, Tag } from 'lucide-react';
import { useAllBusinessPasses, useBusinessSources } from '../../../../hooks/useCreatorBusiness';
import type { CampaignRow, PassRow, SourceMoney, SourceRow, SourcesBlock } from '../../../../types/creatorBusiness';
import HubSelect from '../shared/HubSelect';
import { visitsNote } from './BusinessBlocks';
import { EARNINGS_LABEL, campaignSlug, formatCount, formatMinor, formatRatio, nextStep, plural, taggedLink } from './businessFormat';
import {
  BusinessHeader,
  BusinessTabs,
  BusinessToolbar,
  CopyButton,
  EmptyState,
  LinkField,
  NextStepPanel,
  Panel,
  PASSES_ENABLED,
  PassesUnavailable,
  ScopedError,
  SkeletonLines,
  SkeletonPanel,
} from './BusinessUi';
import { useBusinessScope } from './useBusinessScope';
import { cx, field, frame, surface, table } from './businessStyles';

/** Earnings of a source, one line per currency, with the purchases that have no recorded amount. */
const Earnings: React.FC<{ money: SourceMoney[] }> = ({ money }) =>
  money.length ? (
    <span className="flex flex-col items-end">
      {money.map((m) => (
        <span key={m.currency} className="whitespace-nowrap text-right">
          <span className="font-semibold tabular-nums text-white">{formatMinor(m.proceeds, m.currency, m.decimals)}</span>
          {m.amountUnknownPurchases > 0 && (
            <span className="block text-[11px] text-gray-400">+ {formatCount(m.amountUnknownPurchases)} with no amount</span>
          )}
        </span>
      ))}
    </span>
  ) : (
    <span className="text-gray-500">
      —<span className="sr-only">nothing paid</span>
    </span>
  );

const pct = (ratio: number | null) =>
  ratio === null ? (
    <span className="text-gray-500">
      —<span className="sr-only">no data</span>
    </span>
  ) : (
    formatRatio(ratio)
  );
const visitsCell = (value: number | null) => (value === null ? <span className="text-xs text-gray-400">Not counted</span> : formatCount(value));

const COLUMNS = 7;

const CampaignRows: React.FC<{ id: string; rows: CampaignRow[]; truncated: boolean }> = ({ id, rows, truncated }) => (
  <tr id={id}>
    <td colSpan={COLUMNS} className="bg-white/[0.015] px-4 pb-4 pt-1 md:px-5">
      {rows.length ? (
        <table className="w-full max-w-4xl text-xs">
          <caption className="py-2 text-left text-xs font-medium text-gray-400">Campaigns{truncated ? ' (top 20 by purchases)' : ''}</caption>
          <thead>
            <tr className="text-left text-gray-400">
              <th className="py-1.5 pr-3 font-medium">Campaign</th>
              <th className="py-1.5 pr-3 text-right font-medium">{EARNINGS_LABEL}</th>
              <th className="py-1.5 pr-3 text-right font-medium">Purchases</th>
              <th className="py-1.5 pr-3 text-right font-medium">Buyers</th>
              <th className="py-1.5 text-right font-medium">Checkouts started</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/40">
            {rows.map((c) => (
              <tr key={c.campaign ?? '(none)'} className="text-gray-300">
                <td className="max-w-[14rem] truncate py-2 pr-3" title={c.campaign ?? undefined}>
                  {c.campaign ?? <span className="text-gray-400">No campaign name</span>}
                </td>
                <td className="py-2 pr-3 text-right">
                  <Earnings money={c.money} />
                </td>
                <td className="py-2 pr-3 text-right tabular-nums">{formatCount(c.paidPurchases)}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{formatCount(c.buyers)}</td>
                <td className="py-2 text-right tabular-nums">{formatCount(c.checkoutsStarted)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="py-2 text-xs text-gray-400">No campaign names for this source.</p>
      )}
    </td>
  </tr>
);

const SourceTableRow: React.FC<{ row: SourceRow }> = ({ row }) => {
  const [open, setOpen] = useState(false);
  const id = `campaigns-${row.key}`;
  const num = cx(table.td, table.num, 'text-sm text-gray-300');
  return (
    <>
      <tr className={table.row}>
        <td className={table.td}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={id}
            className="inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-gray-100 transition-colors hover:text-[#fa7517] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa7517]/50"
          >
            <ChevronRight className={cx('h-4 w-4 text-gray-400 transition-transform motion-reduce:transition-none', open && 'rotate-90')} aria-hidden="true" />
            {row.label}
            <span className="sr-only">{open ? ', hide campaigns' : ', show campaigns'}</span>
          </button>
        </td>
        <td className={cx(table.td, 'text-right text-sm')}>
          <Earnings money={row.money} />
        </td>
        <td className={num}>{formatCount(row.paidPurchases)}</td>
        <td className={num}>{formatCount(row.buyers)}</td>
        <td className={num}>{visitsCell(row.uniqueVisitors)}</td>
        <td className={num}>{formatCount(row.checkoutsStarted)}</td>
        <td className={num}>{pct(row.visitorConversion)}</td>
      </tr>
      {open && <CampaignRows id={id} rows={row.campaigns} truncated={row.campaignsTruncated} />}
    </>
  );
};

const SourceCard: React.FC<{ row: SourceRow }> = ({ row }) => (
  <li className="space-y-3 px-4 py-4">
    <div className="flex items-start justify-between gap-3">
      <p className="text-sm font-medium text-gray-100">{row.label}</p>
      <span className="text-sm">
        <Earnings money={row.money} />
      </span>
    </div>
    <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
      <dt className="text-gray-400">Purchases</dt>
      <dd className="text-right tabular-nums text-gray-200">{formatCount(row.paidPurchases)}</dd>
      <dt className="text-gray-400">Buyers</dt>
      <dd className="text-right tabular-nums text-gray-200">{formatCount(row.buyers)}</dd>
      <dt className="text-gray-400">Unique visitors</dt>
      <dd className="text-right tabular-nums text-gray-200">{visitsCell(row.uniqueVisitors)}</dd>
      <dt className="text-gray-400">Checkouts started</dt>
      <dd className="text-right tabular-nums text-gray-200">{formatCount(row.checkoutsStarted)}</dd>
      <dt className="text-gray-400">Visitors who paid</dt>
      <dd className="text-right tabular-nums text-gray-200">{pct(row.visitorConversion)}</dd>
    </dl>
    {row.campaigns.some((c) => c.campaign) && (
      <p className="text-xs text-gray-400">
        Campaigns:{' '}
        {row.campaigns
          .filter((c) => c.campaign)
          .map((c) => `${c.campaign} (${plural(c.paidPurchases, 'purchase', 'purchases')})`)
          .join(', ')}
      </p>
    )}
  </li>
);

/**
 * The per-source table (also used for one pass on its page): earnings, then
 * purchases and buyers, then how many people came and how many of them paid.
 * Click a source to see its campaigns.
 */
export const SourcesTable: React.FC<{ block: SourcesBlock }> = ({ block }) => (
  <div className={surface.card}>
    <ul className={cx(surface.divider, 'md:hidden')}>
      {block.sources.map((row) => (
        <SourceCard key={row.key} row={row} />
      ))}
    </ul>
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full min-w-[52rem]">
        <thead className={table.head}>
          <tr>
            <th className={table.th}>Source</th>
            <th className={cx(table.th, 'text-right')}>{EARNINGS_LABEL}</th>
            <th className={cx(table.th, 'text-right')}>Purchases</th>
            <th className={cx(table.th, 'text-right')}>Buyers</th>
            <th className={cx(table.th, 'text-right')}>Unique visitors</th>
            <th className={cx(table.th, 'text-right')}>Checkouts started</th>
            <th className={cx(table.th, 'text-right')}>Visitors who paid</th>
          </tr>
        </thead>
        <tbody className={table.body}>
          {block.sources.map((row) => (
            <SourceTableRow key={row.key} row={row} />
          ))}
        </tbody>
      </table>
    </div>
    <p className="border-t border-gray-800/50 px-4 py-3 text-xs text-gray-400 md:px-5">{visitsNote(block)}</p>
  </div>
);

const PLACES = [
  { id: 'youtube', where: 'YouTube video description', source: 'youtube', medium: 'video_description' },
  { id: 'instagram', where: 'Instagram bio or story', source: 'instagram', medium: 'social' },
  { id: 'tiktok', where: 'TikTok bio', source: 'tiktok', medium: 'social' },
  { id: 'x', where: 'X post', source: 'x', medium: 'social' },
  { id: 'facebook', where: 'Facebook post', source: 'facebook', medium: 'social' },
  { id: 'newsletter', where: 'Newsletter or email', source: 'newsletter', medium: 'email' },
] as const;

/** Copyable tagged versions of the creator's own pass link. */
export const TagLinksHelper: React.FC<{ passes: PassRow[] }> = ({ passes }) => {
  const published = useMemo(
    () => passes.filter((p) => p.status === 'on_sale' || p.status === 'paused' || p.status === 'sold_out'),
    [passes],
  );
  const [passId, setPassId] = useState(published[0]?.passId ?? '');
  const [campaign, setCampaign] = useState('');
  useEffect(() => {
    if (!published.some((p) => p.passId === passId) && published[0]) setPassId(published[0].passId);
  }, [published, passId]);
  const pass = published.find((p) => p.passId === passId) ?? published[0];
  const slug = campaignSlug(campaign);

  return (
    <Panel
      title="Tag your links"
      icon={Tag}
      id="tag-links"
      subtitle="Use a tagged link in each place you share your pass. A purchase that follows it is credited to that place."
      className="scroll-mt-24"
    >
      {!pass ? (
        <p className="text-sm text-gray-400">Publish a pass first: tagged links are made from its public link.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-3">
            {published.length > 1 && (
              <div className="flex flex-col gap-1">
                <span className={field.label}>Pass</span>
                <HubSelect
                  value={pass.passId}
                  ariaLabel="Pass to link to"
                  onChange={setPassId}
                  options={published.map((p) => ({ value: p.passId, label: p.title || 'Untitled pass' }))}
                />
              </div>
            )}
            <label className="flex min-w-[14rem] flex-1 flex-col gap-1 sm:max-w-xs">
              <span className={field.label}>Campaign name (optional)</span>
              <input
                value={campaign}
                maxLength={80}
                onChange={(event) => setCampaign(event.target.value)}
                placeholder="e.g. spring launch"
                className={field.input}
              />
            </label>
            {slug && <p className="pb-2 text-xs text-gray-400">Tag: {slug}</p>}
          </div>
          <ul className={cx(surface.divider, 'mt-5 border-t border-gray-800/50')}>
            {PLACES.map((place) => {
              const url = taggedLink(pass.publicUrl, { source: place.source, medium: place.medium, campaign });
              return (
                <li key={place.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-4">
                  <span className="shrink-0 text-sm text-gray-300 sm:w-52">{place.where}</span>
                  <LinkField url={url} />
                  <CopyButton text={url} label="Copy" />
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-gray-400">
            An untagged link still counts when the browser says where the visitor came from. Tags make it exact.
          </p>
        </>
      )}
    </Panel>
  );
};

/**
 * Business → Sources: per source and campaign — earnings per currency,
 * purchases, buyers, visits, checkouts, conversion — and copyable tagged links.
 */
const SourcesPage: React.FC = () => {
  const scope = useBusinessScope();
  const sources = useBusinessSources(scope.apiParams, { enabled: PASSES_ENABLED });
  const passes = useAllBusinessPasses(scope.apiParams, { enabled: PASSES_ENABLED });
  const data = sources.data;
  const search = scope.linkSearch();
  const passRows = useMemo(() => passes.data?.items ?? [], [passes.data]);

  // Arriving from a "tag your link" button: scroll to the helper once it exists.
  useEffect(() => {
    if (window.location.hash === '#tag-links' && data && passes.data) {
      document.getElementById('tag-links')?.scrollIntoView({ block: 'start' });
    }
  }, [data, passes.data]);

  let body: React.ReactNode;
  if (!PASSES_ENABLED) {
    body = <PassesUnavailable />;
  } else if (!data && sources.isLoading) {
    body = (
      <div className="space-y-6" aria-busy="true">
        <SkeletonPanel lines={6} />
        <SkeletonPanel lines={4} />
      </div>
    );
  } else if (!data) {
    body = <ScopedError error={sources.error} onRetry={() => void sources.refetch()} scope={scope} what="your sources" />;
  } else if (data.scope.passCount === 0) {
    body = <NextStepPanel step={{ kind: 'no_pass' }} search={search} />;
  } else {
    body = (
      <div
        className={cx('space-y-6 transition-opacity motion-reduce:transition-none', sources.isPlaceholderData && 'opacity-60')}
        aria-busy={sources.isFetching}
      >
        {data.sources.length ? (
          <SourcesTable block={data} />
        ) : (
          <EmptyState icon={Compass} title="No visits, checkouts or purchases in these days" body={visitsNote(data)} />
        )}
        {passes.data && nextStep(passRows).kind === 'draft' && <NextStepPanel step={nextStep(passRows)} search={search} compact />}
        {passes.isLoading ? (
          <div className={cx(surface.card, 'p-5 md:p-6')}>
            <SkeletonLines lines={4} />
          </div>
        ) : (
          <TagLinksHelper passes={passRows} />
        )}
      </div>
    );
  }

  return (
    <div className={frame.page}>
      <div className={frame.business}>
        <BusinessHeader title="Sources" subtitle="Where your buyers come from, and which links bring them." />
        <BusinessTabs search={search} />
        {PASSES_ENABLED && <BusinessToolbar scope={scope} apiChannels={data?.scope.channels} range={data?.range} />}
        {body}
      </div>
    </div>
  );
};

export default SourcesPage;
