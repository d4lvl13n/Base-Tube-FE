import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useSearchSuggest, SUGGEST_MIN_CHARS } from '../../hooks/useSearchSuggest';

/** A row in the dropdown. Titles run a search; channels go to the channel. */
type Suggestion =
  | { kind: 'title'; label: string }
  | { kind: 'channel'; label: string; handle: string | null; id: number };

export const SEARCH_PLACEHOLDER = 'Search videos and creators';

interface SearchBoxProps {
  className?: string;
}

/**
 * The header search box.
 *
 * Typing opens a dropdown of what exists: titles you can search for, creators
 * you can go straight to. Two chars is the floor — one letter matches most of
 * the library and suggests nothing useful.
 *
 * The list is keyboard-first (arrows, Enter, Escape) because that is how the
 * box is used once someone knows the shortcut, and the mouse path is the
 * fallback rather than the other way round.
 */
const SearchBox: React.FC<SearchBoxProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const [value, setValue] = useState(searchParams.get('query') ?? '');
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const { suggestions } = useSearchSuggest(value, { enabled: isFocused });

  // The box mirrors the results page: landing on /search?query=… shows what
  // was searched for, so editing it is a correction rather than a retype.
  useEffect(() => {
    if (location.pathname === '/search') {
      setValue(new URLSearchParams(location.search).get('query') ?? '');
    }
  }, [location.pathname, location.search]);

  const options = useMemo<Suggestion[]>(
    () => [
      ...suggestions.titles.map((label) => ({ kind: 'title' as const, label })),
      ...suggestions.channels.map((channel) => ({
        kind: 'channel' as const,
        label: channel.name,
        handle: channel.handle,
        id: channel.id,
      })),
    ],
    [suggestions]
  );

  useEffect(() => setActiveIndex(-1), [options]);

  const showDropdown =
    isOpen && isFocused && value.trim().length >= SUGGEST_MIN_CHARS && options.length > 0;

  const runSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
    // URLSearchParams, so the header writes the same URL shape the results
    // page writes when a filter changes.
    navigate(`/search?${new URLSearchParams({ query: trimmed }).toString()}`);
  };

  const choose = (option: Suggestion) => {
    if (option.kind === 'channel') {
      setIsOpen(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
      // /channel/:identifier takes either; useChannelData sends a numeric one
      // to the by-id lookup. A channel with no handle is still reachable.
      navigate(`/channel/${option.handle ?? option.id}`);
      return;
    }
    setValue(option.label);
    runSearch(option.label);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (showDropdown && activeIndex >= 0) choose(options[activeIndex]);
      else runSearch(value);
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    if (options.length === 0) return;

    event.preventDefault();
    setIsOpen(true);
    const step = event.key === 'ArrowDown' ? 1 : -1;
    setActiveIndex((current) => {
      // From nothing selected, down lands on the first row and up on the last.
      if (current < 0) return step === 1 ? 0 : options.length - 1;
      return (current + step + options.length) % options.length;
    });
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative flex items-center">
        <Search
          className={`pointer-events-none absolute left-4 h-4 w-4 transition-colors
                      ${isFocused ? 'text-[#fa7517]' : 'text-white/40'}`}
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          // The sidebar's search row hands focus here rather than owning a
          // second query state that could disagree with this one.
          data-bt-search-input=""
          type="search"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls="search-suggestions"
          aria-autocomplete="list"
          aria-activedescendant={
            showDropdown && activeIndex >= 0 ? `search-suggestion-${activeIndex}` : undefined
          }
          aria-label={SEARCH_PLACEHOLDER}
          placeholder={SEARCH_PLACEHOLDER}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsFocused(true);
            setIsOpen(true);
          }}
          onBlur={() => {
            setIsFocused(false);
            setIsOpen(false);
          }}
          onKeyDown={onKeyDown}
          className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pl-10 pr-4
                     text-white placeholder:text-white/40 transition-colors
                     focus:border-[#fa7517]/40 focus:bg-white/10 focus:outline-none"
        />
      </div>

      {showDropdown && (
        <ul
          id="search-suggestions"
          role="listbox"
          aria-label="Search suggestions"
          // Keeps focus on the input so the blur handler does not close the
          // list out from under the click.
          onMouseDown={(event) => event.preventDefault()}
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl
                     border border-white/10 bg-black/95 py-1 shadow-2xl backdrop-blur-xl"
        >
          {/* An option owns no focus and no tab stop: the combobox input keeps
              both, and a button in here would put an interactive element inside
              a role="option", which screen readers refuse to announce as a
              choice. Click still works — it is handled on the row. */}
          {options.map((option, index) => (
            <li
              key={`${option.kind}-${option.kind === 'channel' ? option.id : option.label}`}
              id={`search-suggestion-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              onClick={() => choose(option)}
              onMouseEnter={() => setActiveIndex(index)}
              className={`flex cursor-pointer items-center gap-3 px-4 py-2 text-sm transition-colors
                          ${index === activeIndex ? 'bg-white/10 text-white' : 'text-gray-300'}`}
            >
              {option.kind === 'title' ? (
                <Search className="h-3.5 w-3.5 shrink-0 text-white/30" aria-hidden="true" />
              ) : (
                <span className="shrink-0 text-xs text-gray-600">Channel</span>
              )}
              <span className="min-w-0 flex-1 truncate">{option.label}</span>
              {option.kind === 'channel' && option.handle && (
                <span className="shrink-0 text-xs text-gray-600">@{option.handle}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBox;
