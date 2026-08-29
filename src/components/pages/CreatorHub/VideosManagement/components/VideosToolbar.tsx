import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { VideoFilters, VideoSortOption, VideoVisibilityFilter } from '../types';

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

const SORTS: { value: VideoSortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'most_viewed', label: 'Most viewed' },
  { value: 'most_liked', label: 'Most liked' },
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
      <h1 className="text-lg font-semibold text-white whitespace-nowrap">
        Videos
        {total !== null && (
          <span className="text-gray-500 font-normal"> · {total.toLocaleString()}</span>
        )}
      </h1>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap lg:justify-end">
        <div className="relative sm:w-56">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
            aria-hidden="true"
          />
          <input
            type="search"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Search…"
            aria-label="Search videos"
            className="w-full rounded-lg border border-gray-800/50 bg-black/30 py-2 pl-9 pr-8
                       text-sm text-white placeholder:text-gray-500
                       focus:border-[#fa7517]/50 focus:outline-none focus:ring-1 focus:ring-[#fa7517]/40"
          />
          {draft !== '' && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500
                         hover:text-white focus:outline-none focus-visible:text-white"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        <div
          className="flex flex-wrap gap-1 rounded-lg border border-gray-800/50 bg-black/30 p-1"
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
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors
                            focus:outline-none focus-visible:ring-1 focus-visible:ring-[#fa7517]/60 ${
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

        <label className="flex items-center gap-2 text-xs text-gray-500">
          <span className="hidden sm:inline">Sort</span>
          <select
            value={filters.sort}
            onChange={(event) => onSortChange(event.target.value as VideoSortOption)}
            aria-label="Sort videos"
            className="rounded-lg border border-gray-800/50 bg-black/30 px-2 py-2 text-sm text-white
                       focus:border-[#fa7517]/50 focus:outline-none"
          >
            {SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
};

export default VideosToolbar;
