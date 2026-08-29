import React from 'react';
import { PanelLeft } from 'lucide-react';
import Header from '../../common/Header';
import CreatorHubNav from './CreatorHubNav';
import { setSidebarMobileOpen, useSidebarWidth } from '../../navigation';
import { useIsDesktopViewport } from '../../navigation/sidebarState';

interface CreatorHubShellProps {
  children: React.ReactNode;
}

/**
 * The Creator Hub's chrome: the header, the nav column and the content beside it.
 *
 * The column's width is published as `--bt-hub-sidebar-width` on THIS container
 * rather than on `<html>`, and only this container's `<main>` reads it. The
 * global sidebar on the rest of the site is a different component with its own
 * control and its own layout, and nothing here should be able to move it.
 */
const CreatorHubShell: React.FC<CreatorHubShellProps> = ({ children }) => {
  const width = useSidebarWidth();
  const isDesktop = useIsDesktopViewport();

  return (
    <div
      className="min-h-screen bg-[#09090B]"
      data-testid="creator-hub-shell"
      style={{ '--bt-hub-sidebar-width': `${width}px` } as React.CSSProperties}
    >
      <Header className="sticky top-0 z-50" />

      <div className="flex">
        <CreatorHubNav />

        <main
          data-testid="creator-hub-main"
          className="min-w-0 flex-1 overflow-x-hidden"
          style={{
            marginLeft: 'var(--bt-hub-sidebar-width)',
            transition: 'margin-left 150ms ease-out',
          }}
        >
          {children}
        </main>
      </div>

      {/*
        Below `md` the column is a drawer, and a drawer with no visible opener
        is a menu that does not exist. The hub renders its own button rather
        than borrowing the header's panel icon, which belongs to the global
        sidebar and means something else.
      */}
      {!isDesktop && (
      <button
        type="button"
        onClick={() => setSidebarMobileOpen(true)}
        data-testid="creator-hub-menu-button"
        className="fixed bottom-4 left-4 z-40 flex h-11 items-center gap-2 rounded-full
                   border border-gray-800/60 bg-[#0f0f0f] px-4 text-[14px] text-gray-200
                   shadow-xl focus-visible:outline-none focus-visible:ring-2
                   focus-visible:ring-[#fa7517]/40"
      >
        <PanelLeft className="h-[18px] w-[18px] text-[#fa7517]" aria-hidden="true" />
        Menu
      </button>
      )}
    </div>
  );
};

export default CreatorHubShell;
