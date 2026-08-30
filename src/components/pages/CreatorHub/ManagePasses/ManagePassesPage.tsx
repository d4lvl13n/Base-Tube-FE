// src/components/pages/CreatorHub/ManagePasses/ManagePassesPage.tsx
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useCreatorPasses } from '../../../../hooks/usePass';
import { cx, form, list, page, segmented } from '../shared/hubStyles';
import PassesOverview from './PassesOverview';
import PassesList, { PassFilter } from './PassesList';
import { isPublished } from './passHelpers';

const CHIPS: { value: PassFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'live', label: 'Live' },
  { value: 'drafts', label: 'Drafts' },
];

/**
 * The pass management page, in the Videos management frame: one title with a
 * count, one orange action, the totals as a strip, and a segmented filter
 * instead of tabs — the numbers and the rows are on screen at the same time.
 */
const ManagePassesPage: React.FC = () => {
  const [filter, setFilter] = useState<PassFilter>('all');
  const { data: passes, isLoading, error, refetch } = useCreatorPasses();

  const visible = useMemo(() => {
    const rows = passes ?? [];
    if (filter === 'live') return rows.filter(isPublished);
    if (filter === 'drafts') return rows.filter((pass) => !isPublished(pass));
    return rows;
  }, [passes, filter]);

  const total = passes?.length ?? null;

  return (
    <div className={page.frame}>
      <div className={page.wide}>
        <header className={page.header}>
          <div className="min-w-0">
            <h1 className={page.title}>
              Content passes
              {total !== null && <span className={page.titleCount}>· {total.toLocaleString()}</span>}
            </h1>
            <p className={page.subtitle}>Bundle videos behind a pass and sell it with a link.</p>
          </div>
          <Link to="/creator-hub/create-content-pass" className={cx(form.primaryButton, 'mt-0.5')}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create pass
          </Link>
        </header>

        <PassesOverview passes={passes} isLoading={isLoading} error={error} />

        <div className="flex items-center justify-between gap-3">
          <p className={page.eyebrow}>Passes</p>
          <div className={segmented.trough} role="group" aria-label="Filter passes">
            {CHIPS.map((chip) => {
              const active = filter === chip.value;
              return (
                <button
                  key={chip.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(chip.value)}
                  className={cx(segmented.chip, active ? segmented.chipActive : segmented.chipIdle)}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className={list.panel}>
          <PassesList
            passes={visible}
            filtered={filter !== 'all' && (passes?.length ?? 0) > 0}
            isLoading={isLoading}
            error={error}
            onRetry={() => void refetch()}
            onClearFilter={() => setFilter('all')}
          />
        </div>
      </div>
    </div>
  );
};

export default ManagePassesPage;
