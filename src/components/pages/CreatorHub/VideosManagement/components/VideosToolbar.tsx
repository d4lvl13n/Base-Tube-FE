import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { VideoFilters, VideoSortOption, VideoVisibilityFilter } from '../types';
import { SortMenu } from './SortMenu';
import { cx, field, page, segmented } from '../../Business/businessStyles';

/**
 * How long we let a creator keep typing before asking the server again.
 *
 * Every keystroke is a page-1 request against a filtered index; 300 ms is long
 * enough that a word costs one request and short enough that the list still
 * feels attached to the keyboard.
 */
const SEARCH_DEBOUNCE_MS = 300;

const CHIPS: { value: VideoVisibilityFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
  { value: 'processing', label: 'Processing' },
];

interface VideosToolbarProps {
  filters: VideoFilters;
  /** The channel's video count as the server counts it, not the rows loaded. */
  total: number | null;
  onSearchChange: (value: string) => void;
  onVisibilityChange: (value: VideoVisibilityFilter) => void;
  onSortChange: (value: VideoSortOption) => void;
}

export const VideosToolbar: React.FC<VideosToolbarProps> = ({
  filters,
  total,
  onSearchChange,
  onVisibilityChange,
  onSortChange,
}) => {
  // The field is typed into locally and published on a timer. It still has to
  // follow the URL when something else changes it — "Clear filters", the back
  // button — which is what the effect below is for; it is deliberately not a
  // two-way binding on every render.
  const [draft, setDraft] = useState(filters.q);
  const publishedRef = useRef(filters.q);

  useEffect(() => {
    if (filters.q !== publishedRef.current) {
      publishedRef.current = filters.q;
      setDraft(filters.q);
    }
  }, [filters.q]);

  useEffect(() => {
    if (draft === publishedRef.current) return;
    const timer = setTimeout(() => {
      publishedRef.current = draft;
      onSearchChange(draft);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [draft, onSearchChange]);

  const clearSearch = useCallback(() => {
    publishedRef.current = '';
    setDraft('');
    onSearchChange('');
  }, [onSearchChange]);

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <h1 className={cx(page.title, 'whitespace-nowrap')}>
        Videos
        {total !== null && (
          <span className={page.titleCount}>
            · {total.toLocaleString()}
          </span>
        )}
      </h1>

      <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap lg:justify-end">
        <div className="relative min-w-0 flex-1 sm:w-60 sm:flex-none">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500"
            aria-hidden="true"
          />
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Search…"
            aria-label="Search videos"
            className={cx(field.input, 'pl-9 pr-8')}
          />
          {draft !== '' && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400
                         transition-colors hover:text-white focus-visible:outline-none
                         focus-visible:ring-2 focus-visible:ring-[#fa7517]/50"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* A segmented control, not four buttons: exactly one of these is true
            at a time and the shared trough is what says so. */}
        <div className={segmented.trough} role="group" aria-label="Filter videos">
          {CHIPS.map((chip) => {
            const active = filters.visibility === chip.value;
            return (
              <button
                key={chip.value}
                type="button"
                aria-pressed={active}
                onClick={() => onVisibilityChange(chip.value)}
                className={cx(segmented.chip, 'px-2.5', active ? segmented.chipActive : segmented.chipIdle)}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        <SortMenu value={filters.sort} onChange={onSortChange} />
      </div>
    </div>
  );
};

export default VideosToolbar;
