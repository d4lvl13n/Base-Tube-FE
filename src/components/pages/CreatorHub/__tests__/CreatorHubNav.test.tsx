import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CreatorHubNav from '../CreatorHubNav';
import { resetSidebarState } from '../../../navigation';

const mockUseChannelSelection = jest.fn();

jest.mock('@clerk/clerk-react', () => ({
  useUser: () => ({ isSignedIn: true, user: { username: 'ada', imageUrl: null } }),
}));

jest.mock('../../../../contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: false, user: null }),
}));

jest.mock('../../../../contexts/ChannelSelectionContext', () => ({
  useChannelSelection: () => mockUseChannelSelection(),
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

const renderNav = (path = '/creator-hub') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <CreatorHubNav />
    </MemoryRouter>
  );

beforeEach(() => {
  setViewport(true);
  act(() => resetSidebarState());
  mockUseChannelSelection.mockReturnValue({
    channels: [
      { id: 1, name: 'Base Tube', handle: 'basetube', channel_image_url: null },
      { id: 2, name: 'Side Project', handle: 'side', channel_image_url: null },
    ],
    selectedChannelId: '1',
    setSelectedChannelId: jest.fn(),
    isLoading: false,
  });
});

describe('CreatorHubNav', () => {
  it('pins the column to the viewport', () => {
    renderNav();

    const aside = screen.getByTestId('sidebar');
    expect(aside).toHaveClass('fixed');
    expect(aside).not.toHaveClass('relative');
  });

  it('offers one filled action, not three competing blocks', () => {
    renderNav();

    const upload = screen.getByTestId('sidebar-primary-action');
    expect(upload).toHaveAttribute('href', '/creator-hub/upload');
    expect(upload.className).toContain('bg-[#fa7517]');
    expect(screen.queryByText('Create Content Pass')).not.toBeInTheDocument();
    expect(screen.queryByText('Create Channel')).not.toBeInTheDocument();
  });

  it('names the current channel in the switcher', () => {
    renderNav();

    expect(screen.getByTestId('sidebar-switcher')).toHaveAccessibleName(
      'Switch channel, current: Base Tube'
    );
  });

  it('marks the section in view', () => {
    renderNav('/creator-hub/analytics');

    expect(screen.getByRole('link', { name: 'Analytics' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });
});
