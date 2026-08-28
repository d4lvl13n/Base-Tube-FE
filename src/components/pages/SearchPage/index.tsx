import React, { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { SearchHighlight, SearchSort } from '@basetube/api';
import Header from '../../common/Header';
import Sidebar from '../../common/Sidebar';
import { useVideoSearch, SEARCH_PAGE_SIZE } from '../../../hooks/useSearch';
import { useSearchSuggest } from '../../../hooks/useSearchSuggest';
import FilterRail from './FilterRail';
import ResultRow from './ResultRow';
import {
  hasActiveFilters,
  readFilters,
  toSearchOptions,
  toggleCategory,
  writeFilters,
  type DurationBucketId,
  type SearchFilters,
} from './searchParams';

/** A row-shaped skeleton, so the page does not reflow when results land. */
const ResultSkeleton: React.FC = () => (
  <div className="flex animate-pulse flex-col gap-4 py-5 sm:flex-row">
    <div className="w-full shrink-0 rounded-lg bg-gray-900 pt-[56.25%] sm:w-64 sm:pt-0 sm:h-36" />
    <div className="flex-1 space-y-2.5 pt-1">
      <div className="h-4 w-3/4 rounded bg-gray-900" />
      <div className="h-3 w-1/3 rounded bg-gray-900" />
      <div className="h-3 w-full rounded bg-gray-900" />
      <div className="h-3 w-5/6 rounded bg-gray-900" />
    </div>
  </div>
);

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => readFilters(searchParams), [searchParams]);
  const [expandedResults, setExpandedResults] = useState(false);

  const searchOptions = useMemo(
    () => toSearchOptions(filters, 1, SEARCH_PAGE_SIZE),
    [filters]
  );

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useVideoSearch(searchOptions);

  const pages = useMemo(() => data?.pages ?? [], [data]);
  const results = useMemo(() => pages.flatMap((page) => page.data ?? []), [pages]);
  const highlights = useMemo(
    () =>
      pages.reduce<Record<string, SearchHighlight>>(
        (all, page) => Object.assign(all, page.highlights ?? {}),
        {}
      ),
    [pages]
  );

  const first = pages[0];
  const total = first?.total ?? results.length;
  const engine = first?.engine;
  const processingTimeMs = first?.processingTimeMs;

  const isEmpty = !isLoading && !isError && results.length === 0;
  // Only worth a suggestion when the query found nothing.
  const { suggestions } = useSearchSuggest(filters.query, { enabled: isEmpty });
  const didYouMean = suggestions.titles.find(
    (title) => title.toLowerCase() !== filters.query.trim().toLowerCase()
  );

  const applyFilters = useCallback(
    (next: SearchFilters) => {
      setExpandedResults(false);
      setSearchParams(writeFilters(next));
    },
    [setSearchParams]
  );

  const onSortChange = (sort: SearchSort) => applyFilters({ ...filters, sort });
  const onCategoryToggle = (category: string) =>
    applyFilters({ ...filters, categories: toggleCategory(filters.categories, category) });
  const onDurationChange = (duration: DurationBucketId | null) =>
    applyFilters({ ...filters, duration });
  const onClear = () =>
    applyFilters({ ...filters, categories: [], duration: null, channelId: null });

  const onLoadMore = () => {
    setExpandedResults(true);
    void fetchNextPage();
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header className="fixed left-0 right-0 top-0 z-50" />
      <div className="flex pt-16">
        <Sidebar className="fixed bottom-0 left-0 top-16 z-40" />
        <main className="ml-16 flex-1 overflow-auto px-6 py-10">
          <div className="mx-auto max-w-5xl">
            <header>
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                {filters.query ? `Results for “${filters.query}”` : 'Browse videos'}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {isLoading ? (
                  'Searching…'
                ) : (
                  <>
                    {total === 1 ? '1 result' : `${total.toLocaleString()} results`}
                    {processingTimeMs != null && ` · ${processingTimeMs} ms`}
                    {engine === 'mysql' && (
                      <span className="text-amber-500/80"> · search degraded, showing basic matches</span>
                    )}
                  </>
                )}
              </p>
            </header>

            <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:gap-10">
              <FilterRail
                filters={filters}
                facets={first?.facets}
                onSortChange={onSortChange}
                onCategoryToggle={onCategoryToggle}
                onDurationChange={onDurationChange}
                onClear={onClear}
                showClear={hasActiveFilters(filters)}
              />

              <div className="min-w-0 flex-1">
                {isLoading ? (
                  <div className="divide-y divide-white/5">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <ResultSkeleton key={index} />
                    ))}
                  </div>
                ) : isError ? (
                  <div className="py-16 text-center">
                    <p className="text-sm text-gray-300">Search is not answering right now.</p>
                    <button
                      type="button"
                      onClick={() => refetch()}
                      className="mt-4 rounded-md bg-[#fa7517] px-3.5 py-2 text-sm font-medium
                                 text-black transition-colors hover:bg-[#ff8c3a]"
                    >
                      Try again
                    </button>
                  </div>
                ) : isEmpty ? (
                  <div className="py-16 text-center">
                    <p className="text-sm text-gray-300">
                      {filters.query
                        ? `Nothing matched “${filters.query}”.`
                        : 'Nothing matched these filters.'}
                    </p>
                    {didYouMean ? (
                      <p className="mt-2 text-sm text-gray-500">
                        Did you mean{' '}
                        <button
                          type="button"
                          onClick={() => applyFilters({ ...filters, query: didYouMean })}
                          className="text-[#fa7517] underline-offset-4 hover:underline"
                        >
                          {didYouMean}
                        </button>
                        ?
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-gray-500">
                        Try fewer words, or clear a filter.
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-white/5">
                      {results.map((result) => (
                        <ResultRow
                          key={result.id}
                          result={result}
                          highlight={highlights[String(result.id)]}
                        />
                      ))}
                    </div>

                    {isFetchingNextPage && (
                      <div className="divide-y divide-white/5">
                        <ResultSkeleton />
                      </div>
                    )}

                    {hasNextPage && !isFetchingNextPage && (
                      <button
                        type="button"
                        onClick={onLoadMore}
                        className="mt-8 w-full rounded-md border border-white/10 py-2.5 text-sm
                                   text-gray-300 transition-colors hover:border-[#fa7517]/40 hover:text-white"
                      >
                        Load more
                      </button>
                    )}

                    {!hasNextPage && expandedResults && (
                      <p className="mt-8 text-center text-sm text-gray-600">
                        That is everything.
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SearchPage;
