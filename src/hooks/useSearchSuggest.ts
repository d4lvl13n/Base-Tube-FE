import { useEffect, useRef, useState } from 'react';
import type { SearchSuggestions } from '@basetube/api';
import { searchApi } from '../api/search';

/** Nothing to show. Kept stable so callers can compare identity if they want. */
const EMPTY: SearchSuggestions = { titles: [], channels: [] };

export const SUGGEST_DEBOUNCE_MS = 150;
export const SUGGEST_MIN_CHARS = 2;
export const MAX_TITLE_SUGGESTIONS = 5;
export const MAX_CHANNEL_SUGGESTIONS = 3;

export interface UseSearchSuggestResult {
  suggestions: SearchSuggestions;
  isLoading: boolean;
}

/**
 * Suggestions for a partial query, one request per pause in typing.
 *
 * Two things keep the dropdown honest. The 150 ms debounce means a fast typist
 * costs one request, not one per keystroke. The AbortController means the
 * answer to a query you have already moved past is thrown away rather than
 * flashed on screen — without it, a slow early request can land after a fast
 * later one and show stale titles.
 *
 * Below `SUGGEST_MIN_CHARS` no request is made and the result is empty, so an
 * empty box never opens a dropdown.
 */
export function useSearchSuggest(
  input: string,
  options: { enabled?: boolean } = {}
): UseSearchSuggestResult {
  const { enabled = true } = options;
  const [suggestions, setSuggestions] = useState<SearchSuggestions>(EMPTY);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const term = input.trim();
    abortRef.current?.abort();
    abortRef.current = null;

    if (!enabled || term.length < SUGGEST_MIN_CHARS) {
      setSuggestions(EMPTY);
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;

    const timer = setTimeout(() => {
      searchApi
        .suggest(term, { signal: controller.signal })
        .then((response) => {
          if (controller.signal.aborted) return;
          setSuggestions({
            titles: (response?.data?.titles ?? []).slice(0, MAX_TITLE_SUGGESTIONS),
            channels: (response?.data?.channels ?? []).slice(0, MAX_CHANNEL_SUGGESTIONS),
          });
          setIsLoading(false);
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          // A failed suggest is not worth an error state: the box still works.
          setSuggestions(EMPTY);
          setIsLoading(false);
        });
    }, SUGGEST_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [input, enabled]);

  return { suggestions, isLoading };
}
