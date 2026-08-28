import React from 'react';
import type { SearchFacets, SearchSort } from '@basetube/api';
import {
  DURATION_BUCKETS,
  SORT_OPTIONS,
  type DurationBucketId,
  type SearchFilters,
} from './searchParams';

interface FilterRailProps {
  filters: SearchFilters;
  facets: SearchFacets | null | undefined;
  onSortChange: (sort: SearchSort) => void;
  onCategoryToggle: (category: string) => void;
  onDurationChange: (duration: DurationBucketId | null) => void;
  onClear: () => void;
  showClear: boolean;
}

const SECTION_LABEL = 'text-xs font-medium uppercase tracking-wide text-gray-500';

/**
 * The filter rail.
 *
 * Categories come from the facets of the current result set, so every box
 * here leads somewhere: a category with no matches is not offered. Counts sit
 * on the right because they are the reason to pick one box over another.
 */
const FilterRail: React.FC<FilterRailProps> = ({
  filters,
  facets,
  onSortChange,
  onCategoryToggle,
  onDurationChange,
  onClear,
  showClear,
}) => {
  const categories = Object.entries(facets?.categories ?? {}).sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
  );

  return (
    <aside className="w-full shrink-0 lg:w-56" aria-label="Search filters">
      <div className="space-y-6">
        <div>
          <label htmlFor="search-sort" className={SECTION_LABEL}>
            Sort
          </label>
          <select
            id="search-sort"
            value={filters.sort}
            onChange={(event) => onSortChange(event.target.value as SearchSort)}
            className="mt-2 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2
                       text-sm text-gray-200 focus:border-[#fa7517]/40 focus:outline-none"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id} className="bg-black">
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {categories.length > 0 && (
          <fieldset>
            <legend className={SECTION_LABEL}>Category</legend>
            <ul className="mt-2 space-y-0.5">
              {categories.map(([name, count]) => (
                <li key={name}>
                  <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-1.5
                                    text-sm text-gray-300 transition-colors hover:bg-white/5">
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(name)}
                      onChange={() => onCategoryToggle(name)}
                      className="h-3.5 w-3.5 shrink-0 accent-[#fa7517]"
                    />
                    <span className="min-w-0 flex-1 truncate">{name}</span>
                    <span className="shrink-0 text-xs tabular-nums text-gray-600">{count}</span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        )}

        <fieldset>
          <legend className={SECTION_LABEL}>Length</legend>
          <ul className="mt-2 space-y-0.5">
            {DURATION_BUCKETS.map((bucket) => {
              const selected = filters.duration === bucket.id;
              return (
                <li key={bucket.id}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onDurationChange(selected ? null : bucket.id)}
                    className={`w-full rounded-md px-1.5 py-1.5 text-left text-sm transition-colors
                                hover:bg-white/5 ${
                                  selected ? 'text-[#fa7517]' : 'text-gray-300'
                                }`}
                  >
                    {bucket.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </fieldset>

        {showClear && (
          <button
            type="button"
            onClick={onClear}
            className="text-sm text-gray-500 underline-offset-4 transition-colors hover:text-gray-300 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>
    </aside>
  );
};

export default FilterRail;
