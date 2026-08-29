import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import SidebarSearch from '../SidebarSearch';
import { getSidebarState, resetSidebarState, setSidebarMobileOpen } from '../sidebarState';

const setViewport = (desktop: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: desktop,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
};

const Where: React.FC = () => <span data-testid="path">{useLocation().pathname}</span>;

const renderSearch = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      {/* Stands in for the header's real box, which the sidebar hands focus to. */}
      <input data-bt-search-input="" aria-label="Search videos and creators" />
      <SidebarSearch />
      <Where />
      <Routes>
        <Route path="*" element={null} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  act(() => resetSidebarState());
});

describe('SidebarSearch', () => {
  it('hands focus to the header box on desktop', () => {
    setViewport(true);
    renderSearch();

    fireEvent.click(screen.getByTestId('sidebar-search'));

    expect(screen.getByLabelText('Search videos and creators')).toHaveFocus();
    expect(screen.getByTestId('path')).toHaveTextContent('/');
  });

  it('goes to the search page below md instead of focusing a covered input', () => {
    // The drawer sits on top of the header there, so the caret would land in a
    // box behind the overlay.
    setViewport(false);
    renderSearch();
    act(() => setSidebarMobileOpen(true));

    fireEvent.click(screen.getByTestId('sidebar-search'));

    expect(screen.getByTestId('path')).toHaveTextContent('/search');
    expect(getSidebarState().mobileOpen).toBe(false);
    expect(screen.getByLabelText('Search videos and creators')).not.toHaveFocus();
  });

  it('answers ⌘K the same way', () => {
    setViewport(false);
    renderSearch();

    fireEvent.keyDown(window, { key: 'k', metaKey: true });

    expect(screen.getByTestId('path')).toHaveTextContent('/search');
  });

  it('shows the shortcut hint with enough contrast to read', () => {
    setViewport(true);
    renderSearch();

    expect(screen.getByText('⌘K').className).toContain('text-gray-400');
  });
});
