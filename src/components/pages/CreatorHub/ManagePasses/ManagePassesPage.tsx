// src/components/pages/CreatorHub/ManagePasses/ManagePassesPage.tsx
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import type { BusinessScopeParams } from '../../../../api/creatorBusiness';
import { useCreatorPasses } from '../../../../hooks/usePass';
import { useAllBusinessPasses, useBusinessOverview } from '../../../../hooks/useCreatorBusiness';
import type { PassRow } from '../../../../types/creatorBusiness';
import { cx, frame, form, list, page, segmented } from '../Business/businessStyles';
import { BusinessTabs, ChannelFilter, PASSES_ENABLED, SalesOffBanner } from '../Business/BusinessUi';
import { useBusinessScope } from '../Business/useBusinessScope';
import PassesOverview from './PassesOverview';
import StripeConnectStrip from './StripeConnectStrip';
import PassesList, { PassFilter } from './PassesList';
import { isPublished } from './passHelpers';

const CHIPS: { value: PassFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'live', label: 'Live' },
  { value: 'drafts', label: 'Drafts' },
];

const parseFilter = (raw: string | null): PassFilter => (raw === 'live' || raw === 'drafts' ? raw : 'all');

/**
 * The pass management page (Business → Passes): lasting facts about each
 * pass, all counted since the pass went on sale — no period control here.
 * Period analysis (buyers, conversion, refunds) lives on the Overview and on
 * each pass's own page. The filter and the channel live in the address.
 */
const ManagePassesPage: React.FC = () => {
  const scope = useBusinessScope();
  const filter = parseFilter(scope.params.get('filter'));
  const channelId = scope.scope.channelId;
  const { data: passes, isLoading, error, refetch } = useCreatorPasses();
  // Every number on this page is all time (since each pass went on sale).
  const allTime = useMemo<BusinessScopeParams>(() => ({ range: 'all', channelId: channelId ?? undefined }), [channelId]);
  const business = useAllBusinessPasses(allTime, { enabled: PASSES_ENABLED });
  const overview = useBusinessOverview(allTime, { enabled: PASSES_ENABLED });

  const stats = useMemo(() => {
    const map = new Map<string, PassRow>();
    (business.data?.items ?? []).forEach((row) => map.set(row.passId, row));
    return map;
  }, [business.data]);

  // The management list is every pass of the account; the channel filter keeps
  // the passes of that channel (known from the business rows).
  const channelFiltered = channelId !== null;
  const scoped = useMemo(() => {
    const rows = passes ?? [];
    if (!channelFiltered) return rows;
    if (!business.data) return [];
    return rows.filter((pass) => stats.has(pass.id));
  }, [passes, channelFiltered, business.data, stats]);

  const visible = useMemo(() => {
    if (filter === 'live') return scoped.filter(isPublished);
    if (filter === 'drafts') return scoped.filter((pass) => !isPublished(pass));
    return scoped;
  }, [scoped, filter]);

  const total = passes ? scoped.length : null;
  // Platform switch: the same answer on every business endpoint; read it from whichever arrived.
  const sales = overview.data ?? business.data;

  return (
    <div className={page.frame}>
      <div className={frame.business}>
        <header className={page.header}>
          <div className="min-w-0">
            <h1 className={page.title}>
              Passes
              {total !== null && <span className={page.titleCount}>{total.toLocaleString()}</span>}
            </h1>
            <p className={page.subtitle}>
              Sell access to a set of your videos with one link. Every number here counts all sales since each pass went on sale.
            </p>
          </div>
          <Link to="/creator-hub/create-content-pass" className={form.primaryButton}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create pass
          </Link>
        </header>

        {PASSES_ENABLED && <BusinessTabs search={scope.linkSearch()} />}
        {PASSES_ENABLED && sales && !sales.salesEnabled && <SalesOffBanner reason={sales.salesDisabledReason} />}

        <StripeConnectStrip />

        <PassesOverview
          passes={scoped}
          stats={PASSES_ENABLED ? stats : undefined}
          money={PASSES_ENABLED ? overview.data?.totals.money : undefined}
          isLoading={isLoading || (PASSES_ENABLED && overview.isLoading)}
          error={error}
          moneyError={!PASSES_ENABLED || (!overview.data && overview.isError)}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">All passes</h2>
          <div className="flex flex-wrap items-center gap-2">
            {PASSES_ENABLED && <ChannelFilter scope={scope} apiChannels={overview.data?.scope.channels} />}
            <div className={segmented.trough} role="group" aria-label="Filter passes">
              {CHIPS.map((chip) => {
                const active = filter === chip.value;
                return (
                  <button
                    key={chip.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => scope.update({ filter: chip.value === 'all' ? null : chip.value })}
                    className={cx(segmented.chip, active ? segmented.chipActive : segmented.chipIdle)}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className={list.panel}>
          <PassesList
            passes={visible}
            filtered={filter !== 'all' && scoped.length > 0}
            isLoading={isLoading || (channelFiltered && business.isLoading)}
            error={error}
            onRetry={() => void refetch()}
            onClearFilter={() => scope.update({ filter: null })}
            stats={PASSES_ENABLED ? stats : undefined}
            statsLoading={PASSES_ENABLED && business.isLoading}
            statsError={PASSES_ENABLED && !business.data && business.isError}
            detailSearch={scope.linkSearch()}
          />
        </div>
      </div>
    </div>
  );
};

export default ManagePassesPage;
