import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { BarChart2, LayoutDashboard } from 'lucide-react';
import SidebarShell from '../SidebarShell';
import SidebarSection from '../SidebarSection';
import SidebarItem from '../SidebarItem';
import SidebarSearch from '../SidebarSearch';
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

const renderSidebar = (path = '/creator-hub') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <GoElsewhere />
      <SidebarShell top={<SidebarSearch />} footer={<SidebarFooter name="Ada" handle="ada" />}>
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
        screen.getByTestId('sidebar-search'),
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
});
