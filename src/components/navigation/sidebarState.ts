import { useSyncExternalStore } from 'react';

/**
 * One sidebar, two trees.
 *
 * The header lives in `App`, the sidebar is rendered by each page, and the
 * Creator Hub mounts its own nav inside a route layout. A React context would
 * have to be threaded through all three; a module store is read by whoever
 * needs it, in any tree, and answers synchronously on the very first render —
 * which is the whole point: a collapsed rail that flashes open for one frame
 * is worse than no persistence at all.
 */
export const COLLAPSED_STORAGE_KEY = 'bt.sidebar.collapsed';

/** Expanded and rail widths, in pixels. The CSS variable carries them too. */
export const SIDEBAR_WIDTH = 240;
export const SIDEBAR_RAIL_WIDTH = 60;

/** Below this, the sidebar is a drawer rather than a column. */
export const SIDEBAR_DESKTOP_QUERY = '(min-width: 768px)';

interface SidebarState {
  collapsed: boolean;
  /** Only meaningful below `md`, where the sidebar is an overlay. */
  mobileOpen: boolean;
}

const listeners = new Set<() => void>();

const readPersisted = (): boolean => {
  try {
    return window.localStorage.getItem(COLLAPSED_STORAGE_KEY) === 'true';
  } catch {
    // Private mode, disabled storage — the sidebar still has to render.
    return false;
  }
};

let state: SidebarState = {
  collapsed: typeof window === 'undefined' ? false : readPersisted(),
  mobileOpen: false,
};

/**
 * The width lives on `<html>` so page content can offset itself in CSS
 * (`.bt-sidebar-offset`) without every page subscribing to this store.
 */
const publishWidth = (collapsed: boolean) => {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.sidebarCollapsed = collapsed ? 'true' : 'false';
};

publishWidth(state.collapsed);

const emit = () => {
  listeners.forEach((listener) => listener());
};

const set = (next: Partial<SidebarState>) => {
  const merged = { ...state, ...next };
  if (merged.collapsed === state.collapsed && merged.mobileOpen === state.mobileOpen) return;
  state = merged;
  publishWidth(state.collapsed);
  emit();
};

export const getSidebarState = (): SidebarState => state;

export const subscribeToSidebar = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const isDesktopViewport = (): boolean => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true;
  return window.matchMedia(SIDEBAR_DESKTOP_QUERY).matches;
};

export const setSidebarCollapsed = (collapsed: boolean) => {
  try {
    window.localStorage.setItem(COLLAPSED_STORAGE_KEY, collapsed ? 'true' : 'false');
  } catch {
    // Not persisting is survivable; not collapsing is not.
  }
  set({ collapsed });
};

export const setSidebarMobileOpen = (mobileOpen: boolean) => set({ mobileOpen });

/**
 * What the header's panel button does. On a phone the sidebar is an overlay,
 * so the same control opens and closes the drawer instead of narrowing a
 * column that is not on screen.
 */
export const toggleSidebar = () => {
  if (isDesktopViewport()) {
    setSidebarCollapsed(!state.collapsed);
    return;
  }
  setSidebarMobileOpen(!state.mobileOpen);
};

/** Test seam: resets both flags and the persisted value. */
export const resetSidebarState = () => {
  try {
    window.localStorage.removeItem(COLLAPSED_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  state = { collapsed: false, mobileOpen: false };
  publishWidth(false);
  emit();
};

export const useSidebarState = (): SidebarState =>
  useSyncExternalStore(subscribeToSidebar, getSidebarState, getSidebarState);

export const useSidebarCollapsed = (): boolean => useSidebarState().collapsed;
