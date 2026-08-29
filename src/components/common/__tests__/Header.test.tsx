import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from '../Header';
import { getSidebarState, resetSidebarState } from '../../navigation';

jest.mock('@clerk/clerk-react', () => ({
  useUser: () => ({ isSignedIn: false, user: null }),
}));

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: false, user: null }),
}));

// The real box talks to the suggest endpoint; the header test is about the
// panel button next to it.
jest.mock('../SearchBox', () => ({
  __esModule: true,
  default: () => <input aria-label="Search videos and creators" />,
  SEARCH_PLACEHOLDER: 'Search videos and creators',
}));

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

const renderHeader = () =>
  render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>
  );

const panelButton = () => screen.getByRole('button', { name: /sidebar/i });

beforeEach(() => {
  act(() => resetSidebarState());
});

describe('the header panel button', () => {
  it('narrows the column on desktop and says so', () => {
    setViewport(true);
    renderHeader();

    expect(panelButton()).toHaveAccessibleName('Collapse sidebar');
    expect(panelButton()).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(panelButton());

    expect(getSidebarState().collapsed).toBe(true);
    expect(panelButton()).toHaveAccessibleName('Expand sidebar');
    expect(panelButton()).toHaveAttribute('aria-expanded', 'false');
  });

  it('reports the drawer below md, not the column nobody can see', () => {
    // `!collapsed` describes a desktop column that does not exist here, so the
    // button used to announce "expanded" over a closed drawer.
    setViewport(false);
    renderHeader();

    expect(getSidebarState().collapsed).toBe(false);
    expect(panelButton()).toHaveAccessibleName('Expand sidebar');
    expect(panelButton()).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(panelButton());

    expect(getSidebarState().mobileOpen).toBe(true);
    expect(getSidebarState().collapsed).toBe(false);
    expect(panelButton()).toHaveAccessibleName('Collapse sidebar');
    expect(panelButton()).toHaveAttribute('aria-expanded', 'true');
  });
});
