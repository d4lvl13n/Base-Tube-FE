import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { VideoFilters, VideoSortOption, VideoVisibilityFilter } from '../types';
import { SortMenu } from './SortMenu';

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
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <h1 className="text-base font-semibold tracking-tight text-white whitespace-nowrap">
        Videos
        {total !== null && (
          <span className="ml-1.5 font-normal tabular-nums text-gray-500">
            · {total.toLocaleString()}
          </span>
        )}
      </h1>

      <div className="flex flex-wrap items-center gap-2 lg:justify-end lg:flex-nowrap">
        <div className="relative min-w-0 flex-1 sm:w-56 sm:flex-none">
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
            className="w-full rounded-lg border border-gray-800/60 bg-white/5 py-1.5 pl-9 pr-8
                       text-sm text-gray-100 placeholder:text-gray-500 transition-colors
                       hover:border-gray-700 focus-visible:border-[#fa7517]/40
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa7517]/40"
          />
          {draft !== '' && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500
                         transition-colors hover:text-white focus-visible:outline-none
                         focus-visible:ring-2 focus-visible:ring-[#fa7517]/40"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* A segmented control, not four buttons: exactly one of these is true
            at a time and the shared trough is what says so. */}
        <div
          className="flex shrink-0 items-center gap-0.5 rounded-lg border border-gray-800/60 bg-white/5 p-0.5"
          role="group"
          aria-label="Filter videos"
        >
          {CHIPS.map((chip) => {
            const active = filters.visibility === chip.value;
            return (
              <button
                key={chip.value}
                type="button"
                aria-pressed={active}
                onClick={() => onVisibilityChange(chip.value)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors
                            focus-visible:outline-none focus-visible:ring-2
                            focus-visible:ring-[#fa7517]/40 ${
                              active
                                ? 'bg-[#fa7517]/15 text-[#fa7517]'
                                : 'text-gray-400 hover:text-white'
                            }`}
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
