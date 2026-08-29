import React, { useEffect } from 'react';
import { PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { SidebarViewContext } from './SidebarViewContext';
import {
  SIDEBAR_RAIL_WIDTH,
  SIDEBAR_WIDTH,
  setSidebarCollapsed,
  setSidebarMobileOpen,
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
  const location = useLocation();

  useSidebarShortcuts();

  // A drawer that survives navigation covers the page it just opened.
  useEffect(() => {
    setSidebarMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSidebarMobileOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  return (
    <>
      <aside
        aria-label={label}
        data-testid="sidebar"
        data-collapsed={collapsed ? 'true' : 'false'}
        style={{ width: collapsed ? SIDEBAR_RAIL_WIDTH : SIDEBAR_WIDTH }}
        className={`group/sidebar relative hidden md:flex ${PANEL_CLASS} ${className}`}
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
                       rounded-md border border-gray-800/60 bg-[#0f0f0f] text-gray-500 opacity-0
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

      {mobileOpen && (
        <div className="fixed inset-0 z-[70] md:hidden" data-testid="sidebar-drawer">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setSidebarMobileOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-black/60"
          />
          <div
            style={{ width: SIDEBAR_WIDTH }}
            className={`absolute inset-y-0 left-0 ${PANEL_CLASS}`}
          >
            <div className="flex items-center justify-end px-2 pt-2">
              <button
                type="button"
                onClick={() => setSidebarMobileOpen(false)}
                aria-label="Close navigation"
                className="grid h-8 w-8 place-items-center rounded-md text-gray-500
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
