import React, { useCallback, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { isDesktopViewport, setSidebarMobileOpen } from './sidebarState';
import SidebarTooltip from './SidebarTooltip';
import { useSidebarView } from './SidebarViewContext';

export const SEARCH_PATH = '/search';

/** Marks the header's real search input so the sidebar can hand focus to it. */
export const HEADER_SEARCH_SELECTOR = '[data-bt-search-input]';

/**
 * Focus the search box the header already renders.
 *
 * The sidebar deliberately owns no query state: two inputs bound to the same
 * URL disagree the moment one of them is typed in.
 */
export const focusHeaderSearch = (): boolean => {
  if (typeof document === 'undefined') return false;
  const input = document.querySelector<HTMLInputElement>(HEADER_SEARCH_SELECTOR);
  if (!input) return false;
  input.focus();
  input.select?.();
  return true;
};

export interface SidebarSearchProps {
  className?: string;
}

const SidebarSearch: React.FC<SidebarSearchProps> = ({ className = '' }) => {
  const { collapsed } = useSidebarView();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const open = useCallback(() => {
    // The results page keeps the query and every filter in the URL, so
    // navigating to a bare /search from /search?query=cats would silently
    // throw the search away. Once you are there, this row only reopens the box.
    const onResultsPage = pathname === SEARCH_PATH;

    // Below `md` the sidebar is an overlay sitting on top of the header, so
    // focusing the header's input first would put the caret in a box nobody
    // can see. Close the drawer, then reach for it.
    if (!isDesktopViewport()) {
      setSidebarMobileOpen(false);
      if (onResultsPage) {
        focusHeaderSearch();
        return;
      }
      navigate(SEARCH_PATH);
      return;
    }

    if (focusHeaderSearch() || onResultsPage) return;
    navigate(SEARCH_PATH);
  }, [navigate, pathname]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'k' && event.key !== 'K') return;
      if (!event.metaKey && !event.ctrlKey) return;
      event.preventDefault();
      open();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  if (collapsed) {
    return (
      <SidebarTooltip label="Search">
        <button
          type="button"
          onClick={open}
          aria-label="Search"
          data-testid="sidebar-search"
          className={`grid h-9 w-9 place-items-center rounded-md text-gray-400
                      transition-colors duration-150 hover:bg-white/[0.04] hover:text-white
                      focus-visible:outline-none focus-visible:ring-2
                      focus-visible:ring-[#fa7517]/40 motion-reduce:transition-none ${className}`}
        >
          <Search className="h-[18px] w-[18px]" aria-hidden="true" />
        </button>
      </SidebarTooltip>
    );
  }

  return (
    <button
      type="button"
      onClick={open}
      data-testid="sidebar-search"
      className={`flex h-9 w-full items-center gap-2.5 rounded-md border border-gray-800/60
                  bg-white/[0.02] px-2.5 text-[14px] text-gray-500 transition-colors duration-150
                  hover:border-gray-700 hover:text-gray-300 focus-visible:outline-none
                  focus-visible:ring-2 focus-visible:ring-[#fa7517]/40
                  motion-reduce:transition-none ${className}`}
    >
      <Search className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate text-left">Search</span>
      <kbd className="shrink-0 font-sans text-[11px] text-gray-400">⌘K</kbd>
    </button>
  );
};

export default SidebarSearch;
