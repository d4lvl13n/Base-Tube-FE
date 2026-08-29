import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { BarChart2, LayoutDashboard, Upload } from 'lucide-react';
import SidebarShell, { panelPositionClass } from '../SidebarShell';
import SidebarSection from '../SidebarSection';
import SidebarItem from '../SidebarItem';
import SidebarPrimaryAction from '../SidebarPrimaryAction';
import SidebarFooter from '../SidebarFooter';
import {
  COLLAPSED_STORAGE_KEY,
  SIDEBAR_RAIL_WIDTH,
  SIDEBAR_WIDTH,
  resetSidebarState,
  setSidebarCollapsed,
  setSidebarMobileOpen,
} from '../sidebarState';

const GoElsewhere: React.FC = () => {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate('/creator-hub/analytics')}>
      go
    </button>
  );
};

/**
 * A controllable `matchMedia`.
 *
 * `resetMocks` wipes the shared jest.fn(), and the sidebar asks this which of
 * its two forms is on screen — so it is a plain function that survives the
 * reset, keeps a live `matches` getter, and remembers its listeners so a test
 * can resize the window.
 */
let viewportListeners: Array<() => void> = [];
let isDesktopViewportStub = true;

const setViewport = (desktop: boolean) => {
  isDesktopViewportStub = desktop;
  viewportListeners = [];
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      get matches() {
        return isDesktopViewportStub;
      },
      media: query,
      onchange: null,
      addListener: (listener: () => void) => viewportListeners.push(listener),
      removeListener: (listener: () => void) => {
        viewportListeners = viewportListeners.filter((entry) => entry !== listener);
      },
      addEventListener: (_type: string, listener: () => void) =>
        viewportListeners.push(listener),
      removeEventListener: (_type: string, listener: () => void) => {
        viewportListeners = viewportListeners.filter((entry) => entry !== listener);
      },
      dispatchEvent: () => false,
    }),
  });
};

/** Resize the window past the breakpoint and tell whoever is listening. */
const resizeViewport = (desktop: boolean) => {
  isDesktopViewportStub = desktop;
  act(() => viewportListeners.forEach((listener) => listener()));
};

/** An opener that can be taken away, the way a route change takes one away. */
const OpenDrawer: React.FC = () => {
  const [unmounted, setUnmounted] = React.useState(false);
  return (
    <>
      {!unmounted && (
        <button type="button" onClick={() => setSidebarMobileOpen(true)}>
          open
        </button>
      )}
      <button type="button" onClick={() => setUnmounted(true)}>
        unmount opener
      </button>
    </>
  );
};

const renderSidebar = (path = '/creator-hub', className?: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <GoElsewhere />
      <OpenDrawer />
      <main>page</main>
      <SidebarShell
        className={className}
        top={<SidebarPrimaryAction icon={Upload} label="Upload" to="/creator-hub/upload" />}
        footer={<SidebarFooter name="Ada" handle="ada" />}
      >
        <SidebarSection label="Main">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/creator-hub" end />
          <SidebarItem
            icon={BarChart2}
            label="Analytics"
            to="/creator-hub/analytics"
            badge="Beta"
          />
        </SidebarSection>
      </SidebarShell>
    </MemoryRouter>
  );

beforeEach(() => {
  setViewport(true);
  act(() => resetSidebarState());
});

describe('SidebarShell', () => {
  it('renders labels and the full width when expanded', () => {
    renderSidebar();

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Main')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toHaveStyle(`width: ${SIDEBAR_WIDTH}px`);
  });

  describe('the collapsed rail', () => {
    it('renders no text at all', () => {
      renderSidebar();
      act(() => setSidebarCollapsed(true));

      const sidebar = screen.getByTestId('sidebar');
      expect(sidebar).toHaveStyle(`width: ${SIDEBAR_RAIL_WIDTH}px`);
      expect(sidebar.textContent).toBe('');
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
      expect(screen.queryByText('Beta')).not.toBeInTheDocument();
    });

    it('keeps every row inside the rail', () => {
      renderSidebar();
      act(() => setSidebarCollapsed(true));

      const rows = [
        ...screen.getAllByTestId('sidebar-item'),
        screen.getByTestId('sidebar-primary-action'),
        screen.getByTestId('sidebar-footer'),
      ];

      expect(rows.length).toBeGreaterThan(0);
      rows.forEach((row) => {
        // 36px button inside a 60px rail with 12px of padding either side.
        expect(row.className).toMatch(/(^|\s)h-9(\s|$)/);
        expect(row.className).toMatch(/(^|\s)w-9(\s|$)/);
      });
    });

    it('turns a badge into a dot', () => {
      renderSidebar();
      act(() => setSidebarCollapsed(true));

      expect(screen.getByTestId('sidebar-item-dot')).toBeInTheDocument();
    });

    it('names each row with a tooltip', async () => {
      renderSidebar();
      act(() => setSidebarCollapsed(true));

      const [dashboard] = screen.getAllByTestId('sidebar-item');
      expect(dashboard).toHaveAccessibleName('Dashboard');

      fireEvent.focus(dashboard);

      expect(await screen.findByRole('tooltip')).toHaveTextContent('Dashboard');
    });
  });

  describe('the bracket shortcuts', () => {
    it('closes on [ and opens on ], and remembers the choice', () => {
      renderSidebar();

      fireEvent.keyDown(window, { key: '[' });
      expect(screen.getByTestId('sidebar')).toHaveAttribute('data-collapsed', 'true');
      expect(window.localStorage.getItem(COLLAPSED_STORAGE_KEY)).toBe('true');

      fireEvent.keyDown(window, { key: ']' });
      expect(screen.getByTestId('sidebar')).toHaveAttribute('data-collapsed', 'false');
      expect(window.localStorage.getItem(COLLAPSED_STORAGE_KEY)).toBe('false');
    });

    it('works the drawer below md, where the column is not on screen', () => {
      setViewport(false);
      renderSidebar();

      fireEvent.keyDown(window, { key: ']' });
      expect(screen.getByTestId('sidebar-drawer')).toBeInTheDocument();

      fireEvent.keyDown(window, { key: '[' });
      expect(screen.queryByTestId('sidebar-drawer')).not.toBeInTheDocument();
      // The desktop preference is untouched: it describes a column that does
      // not exist at this width.
      expect(screen.getByTestId('sidebar')).toHaveAttribute('data-collapsed', 'false');
    });

    it('is ignored while typing', () => {
      renderSidebar();
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      fireEvent.keyDown(input, { key: '[' });

      expect(screen.getByTestId('sidebar')).toHaveAttribute('data-collapsed', 'false');
      input.remove();
    });
  });

  it('marks the item that matches the route', () => {
    renderSidebar('/creator-hub/analytics');

    const [dashboard, analytics] = screen.getAllByTestId('sidebar-item');
    expect(analytics).toHaveAttribute('data-active', 'true');
    expect(analytics).toHaveAttribute('aria-current', 'page');
    expect(dashboard).toHaveAttribute('data-active', 'false');
  });

  describe('the mobile drawer', () => {
    beforeEach(() => setViewport(false));

    it('closes on Escape', () => {
      renderSidebar();
      act(() => setSidebarMobileOpen(true));
      expect(screen.getByTestId('sidebar-drawer')).toBeInTheDocument();

      fireEvent.keyDown(window, { key: 'Escape' });

      expect(screen.queryByTestId('sidebar-drawer')).not.toBeInTheDocument();
    });

    it('closes when the route changes', () => {
      renderSidebar();
      act(() => setSidebarMobileOpen(true));
      expect(screen.getByTestId('sidebar-drawer')).toBeInTheDocument();

      fireEvent.click(screen.getByText('go'));

      expect(screen.queryByTestId('sidebar-drawer')).not.toBeInTheDocument();
    });

    it('is full width even when the desktop preference is collapsed', () => {
      renderSidebar();
      act(() => {
        setSidebarCollapsed(true);
        setSidebarMobileOpen(true);
      });

      expect(screen.getByTestId('sidebar-drawer')).toHaveTextContent('Dashboard');
    });
  });

  describe('positioning', () => {
    it('does not add `relative` over the page\'s own position', () => {
      // Tailwind emits `.relative` after `.fixed`, so an unconditional
      // `relative` silently won and left the column in the flex flow while the
      // page ALSO reserved its width beside it.
      expect(panelPositionClass('fixed left-0 top-16 bottom-0 z-40')).toBe('');
      expect(panelPositionClass('sticky top-16 h-[calc(100vh-4rem)] self-start')).toBe('');
      expect(panelPositionClass('')).toBe('relative');
    });

    it('keeps a page-supplied `fixed` on the desktop panel', () => {
      renderSidebar('/creator-hub', 'fixed left-0 top-16 bottom-0 z-40');

      const aside = screen.getByTestId('sidebar');
      expect(aside).toHaveClass('fixed');
      expect(aside).not.toHaveClass('relative');
    });

    it('anchors the edge chevron when the page says nothing', () => {
      renderSidebar();
      expect(screen.getByTestId('sidebar')).toHaveClass('relative');
    });
  });

  describe('the drawer as a modal', () => {
    beforeEach(() => setViewport(false));

    const openDrawer = () => {
      const opener = screen.getByRole('button', { name: 'open' });
      opener.focus();
      fireEvent.click(opener);
      return opener;
    };

    it('takes focus to the close button', () => {
      renderSidebar();
      openDrawer();

      expect(screen.getByRole('button', { name: 'Close navigation' })).toHaveFocus();
    });

    it('keeps Tab inside the drawer', () => {
      renderSidebar();
      openDrawer();

      const dialog = screen.getByRole('dialog');
      const close = screen.getByRole('button', { name: 'Close navigation' });
      const last = within(dialog).getByTestId('sidebar-footer');

      // Backwards off the first row lands on the last one, not on the page
      // underneath, which the overlay has already covered.
      fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
      expect(last).toHaveFocus();

      fireEvent.keyDown(window, { key: 'Tab' });
      expect(close).toHaveFocus();
    });

    it('hands focus back to whatever opened it', () => {
      renderSidebar();
      const opener = openDrawer();

      fireEvent.keyDown(window, { key: 'Escape' });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(opener).toHaveFocus();
    });

    it('falls back to the page when the opener has gone', () => {
      // The header button unmounts on a route change. Focus left on a detached
      // node quietly becomes `<body>`, and the next Tab restarts at the top of
      // the document.
      renderSidebar();
      openDrawer();

      fireEvent.click(screen.getByRole('button', { name: 'unmount opener' }));
      expect(screen.queryByRole('button', { name: 'open' })).not.toBeInTheDocument();

      fireEvent.keyDown(window, { key: 'Escape' });

      expect(screen.getByRole('main')).toHaveFocus();
    });

    it('closes itself when the window grows past md', () => {
      // Otherwise a display:none dialog stays mounted with a global Tab trap
      // still reading from it, and focus disappears into a modal nobody sees.
      renderSidebar();
      const opener = openDrawer();

      resizeViewport(true);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(opener).toHaveFocus();

      // The trap went with it: Tab is nobody's business again.
      const elsewhere = screen.getByRole('button', { name: 'go' });
      elsewhere.focus();
      fireEvent.keyDown(window, { key: 'Tab' });
      expect(elsewhere).toHaveFocus();
    });

    it('closes when the backdrop is clicked', () => {
      renderSidebar();
      openDrawer();

      fireEvent.click(screen.getByTestId('sidebar-drawer-backdrop'));

      expect(screen.queryByTestId('sidebar-drawer')).not.toBeInTheDocument();
    });
  });

  it('labels sections with enough contrast to read', () => {
    renderSidebar();
    // gray-600 on #0f0f0f is ~2.5:1; gray-400 clears 4.5:1.
    expect(screen.getByText('Main').className).toContain('text-gray-400');
  });
});
