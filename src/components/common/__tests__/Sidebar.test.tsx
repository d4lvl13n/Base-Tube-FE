import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '../Sidebar';
import { resetSidebarState } from '../../navigation';

jest.mock('@clerk/clerk-react', () => ({
  useUser: () => ({ isSignedIn: true, user: { username: 'ada', imageUrl: null } }),
}));

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: false, user: null }),
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

const renderSidebar = (className?: string) =>
  render(
    <MemoryRouter initialEntries={['/discover']}>
      <Sidebar className={className} />
    </MemoryRouter>
  );

beforeEach(() => {
  setViewport(true);
  act(() => resetSidebarState());
});

describe('the global sidebar', () => {
  it('keeps the positioning the page asked for', () => {
    // Every page that offsets its content with `--bt-sidebar-width` also pins
    // the column; if `relative` wins, the sidebar takes its width twice.
    renderSidebar('fixed left-0 top-16 bottom-0 z-40');

    const aside = screen.getByTestId('sidebar');
    expect(aside).toHaveClass('fixed');
    expect(aside).not.toHaveClass('relative');
  });

  it('pins itself when the page says nothing', () => {
    renderSidebar();

    const aside = screen.getByTestId('sidebar');
    expect(aside).toHaveClass('sticky');
    expect(aside).not.toHaveClass('relative');
  });

  it('keeps its routes and marks the one in view', () => {
    renderSidebar();

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Creator Hub' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Discover' })).toHaveAttribute('aria-current', 'page');
  });
});
