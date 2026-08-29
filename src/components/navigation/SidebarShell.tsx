import React, { useCallback, useEffect, useRef } from 'react';
import { PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { SidebarViewContext } from './SidebarViewContext';
import {
  SIDEBAR_RAIL_WIDTH,
  SIDEBAR_WIDTH,
  setSidebarCollapsed,
  setSidebarMobileOpen,
  useIsDesktopViewport,
  useSidebarState,
} from './sidebarState';
import { useSidebarShortcuts } from './useSidebarShortcuts';

export interface SidebarShellProps {
  /** Accessible name for the landmark. */
  label?: string;
  /** Switcher / search — anything that sits above the scrolling item list. */
  top?: React.ReactNode;
  /** Account row, pinned to the bottom. */
  footer?: React.ReactNode;
  /** Sections and items. */
  children: React.ReactNode;
  /** Positioning classes from the page (`fixed left-0 top-16 …`). */
  className?: string;
  /** The rail-edge chevron. Off for nested navs that are never collapsed. */
  edgeToggle?: boolean;
}

const PANEL_CLASS =
  'flex flex-col overflow-hidden border-r border-gray-800/60 bg-[#0f0f0f] ' +
  'transition-[width] duration-150 ease-out motion-reduce:transition-none';

const POSITIONED = /(^|\s)(fixed|absolute|sticky|relative)(\s|$)/;

/**
 * The edge chevron is absolutely placed, so the panel has to be a containing
 * block — but adding `relative` unconditionally silently beat the page's
 * `fixed`, because Tailwind emits `.relative` after `.fixed` and the last rule
 * wins. The column then stayed in the flex flow while the page ALSO reserved
 * `--bt-sidebar-width` beside it, so the sidebar ate its width twice and never
 * pinned to the viewport. Only fall back to `relative` when the caller has not
 * positioned the panel itself.
 */
export const panelPositionClass = (className: string): string =>
  POSITIONED.test(className) ? '' : 'relative';

/**
 * Where focus goes when the drawer closes and the thing that opened it is no
 * longer there — the header button unmounts on a route change, and focus left
 * on a detached node silently falls back to `<body>`, which reads as "nowhere"
 * and sends the next Tab to the top of the document.
 */
const focusPageStart = () => {
  const main = document.querySelector<HTMLElement>('[data-bt-main], main');
  if (main) {
    // Programmatic focus only; a negative tabindex keeps it out of the tab
    // order, so nobody has to Tab past the page body to reach the content.
    if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
    main.focus();
    return;
  }
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
};

/** Everything you can tab to inside the drawer. */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
  'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const SidebarBody: React.FC<{
  top?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  collapsed: boolean;
}> = ({ top, footer, children, collapsed }) => (
  <>
    {top && (
      <div className={`shrink-0 border-b border-gray-800/60 ${collapsed ? 'px-3 py-3' : 'p-3'}`}>
        {top}
      </div>
    )}

    <nav
      className={`custom-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-3 ${
        collapsed ? 'px-3' : 'px-2'
      }`}
    >
      {children}
    </nav>

    {footer && (
      <div className={`shrink-0 border-t border-gray-800/60 ${collapsed ? 'px-3 py-3' : 'p-2'}`}>
        {footer}
      </div>
    )}
  </>
);

/**
 * The sidebar frame: one column, two widths, and a drawer below `md`.
 *
 * The width is a CSS transition on a plain `<aside>` rather than a spring on a
 * motion component. A spring overshoots, and an overshooting width is exactly
 * what clipped the old collapsed rail's icons mid-animation.
 */
const SidebarShell: React.FC<SidebarShellProps> = ({
  label = 'Primary navigation',
  top,
  footer,
  children,
  className = '',
  edgeToggle = true,
}) => {
  const { collapsed, mobileOpen } = useSidebarState();
  const isDesktop = useIsDesktopViewport();
  const location = useLocation();
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useSidebarShortcuts();

  const closeDrawer = useCallback(() => setSidebarMobileOpen(false), []);

  // A drawer that survives navigation covers the page it just opened.
  useEffect(() => {
    setSidebarMobileOpen(false);
  }, [location.pathname]);

  // Widening the window past `md` swaps the drawer for the column. Leaving
  // `mobileOpen` set would keep a display:none dialog mounted with a global
  // Tab trap still reading from it — focus would vanish into a modal nobody
  // can see.
  useEffect(() => {
    if (isDesktop && mobileOpen) setSidebarMobileOpen(false);
  }, [isDesktop, mobileOpen]);

  // The drawer is modal: it takes focus on open and hands it back on close,
  // so the control that opened it is still where the user left it.
  useEffect(() => {
    if (!mobileOpen) return undefined;

    const opener = document.activeElement;
    openerRef.current = opener instanceof HTMLElement ? opener : null;
    closeRef.current?.focus();

    return () => {
      const returnTo = openerRef.current;
      openerRef.current = null;
      if (returnTo && document.contains(returnTo)) {
        returnTo.focus();
        return;
      }
      focusPageStart();
    };
  }, [mobileOpen]);

  // Escape closes it; Tab cannot leave it. Without the trap the next Tab lands
  // on the page underneath, which the overlay has already covered.
  useEffect(() => {
    if (!mobileOpen) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDrawer();
        return;
      }
      if (event.key !== 'Tab') return;

      const panel = drawerRef.current;
      if (!panel) return;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (!panel.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
        return;
      }
      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen, closeDrawer]);

  return (
    <>
      {/* Desktop vs drawer is decided in JS from the same matchMedia query the
          width offset uses — NOT with `hidden md:flex`. A dependency
          (@coinbase/onchainkit/styles.css) ships its own compiled Tailwind with
          `.hidden{display:none}` later in the document, so any responsive
          "hidden → flex" override in our stylesheet loses the cascade. */}
      {isDesktop && (
      <aside
        aria-label={label}
        data-testid="sidebar"
        data-collapsed={collapsed ? 'true' : 'false'}
        style={{ width: collapsed ? SIDEBAR_RAIL_WIDTH : SIDEBAR_WIDTH }}
        className={`group/sidebar ${panelPositionClass(
          className
        )} ${PANEL_CLASS} ${className}`}
      >
        <SidebarViewContext.Provider value={{ collapsed }}>
          <SidebarBody top={top} footer={footer} collapsed={collapsed}>
            {children}
          </SidebarBody>
        </SidebarViewContext.Provider>

        {edgeToggle && (
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="absolute right-1 top-1/2 z-10 grid h-6 w-6 -translate-y-1/2 place-items-center
                       rounded-md border border-gray-800/60 bg-[#0f0f0f] text-gray-400 opacity-0
                       transition-opacity duration-150 hover:text-white
                       focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-[#fa7517]/40 group-hover/sidebar:opacity-100
                       motion-reduce:transition-none"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <PanelLeftClose className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>
        )}
      </aside>
      )}

      {mobileOpen && !isDesktop && (
        <div className="fixed inset-0 z-[70]" data-testid="sidebar-drawer">
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            data-testid="sidebar-drawer-backdrop"
            onClick={closeDrawer}
            className="absolute inset-0 h-full w-full cursor-default bg-black/60"
          />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            style={{ width: SIDEBAR_WIDTH }}
            className={`absolute inset-y-0 left-0 ${PANEL_CLASS}`}
          >
            <div className="flex items-center justify-end px-2 pt-2">
              <button
                ref={closeRef}
                type="button"
                onClick={closeDrawer}
                aria-label="Close navigation"
                className="grid h-8 w-8 place-items-center rounded-md text-gray-400
                           hover:bg-white/[0.04] hover:text-white focus-visible:outline-none
                           focus-visible:ring-2 focus-visible:ring-[#fa7517]/40"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <SidebarViewContext.Provider value={{ collapsed: false }}>
              <SidebarBody top={top} footer={footer} collapsed={false}>
                {children}
              </SidebarBody>
            </SidebarViewContext.Provider>
          </div>
        </div>
      )}
    </>
  );
};

export default SidebarShell;
