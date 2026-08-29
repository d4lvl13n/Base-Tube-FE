import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CreatorHubShell from '../CreatorHubShell';
import { getSidebarState, resetSidebarState, setSidebarCollapsed } from '../../../navigation';

// The header is global chrome this change does not touch, and the column has
// its own test; this one is about the layout contract between them.
jest.mock('../../../common/Header', () => ({
  __esModule: true,
  default: () => <header>header</header>,
}));

jest.mock('../CreatorHubNav', () => ({
  __esModule: true,
  default: () => <aside>nav</aside>,
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

const renderShell = () =>
  render(
    <MemoryRouter>
      <CreatorHubShell>
        <p>hub page</p>
      </CreatorHubShell>
    </MemoryRouter>
  );

const hubWidth = () =>
  screen.getByTestId('creator-hub-shell').style.getPropertyValue('--bt-hub-sidebar-width');

beforeEach(() => {
  setViewport(true);
  act(() => resetSidebarState());
});

describe('CreatorHubShell', () => {
  it('publishes the column width on its own container, not on the document', () => {
    // Scoped to the hub on purpose: the rest of the site lays itself out
    // against the global sidebar, and nothing here may move it.
    renderShell();

    expect(hubWidth()).toBe('240px');
    expect(document.documentElement.getAttribute('style')).toBeNull();
    expect(document.documentElement.dataset.sidebarCollapsed).toBeUndefined();
  });

  it('narrows to the rail width when the column collapses', () => {
    renderShell();

    act(() => setSidebarCollapsed(true));

    expect(hubWidth()).toBe('60px');
  });

  it('reserves nothing below md, where the column is a drawer', () => {
    setViewport(false);
    renderShell();

    expect(hubWidth()).toBe('0px');
  });

  it('offsets only its own main against that width', () => {
    renderShell();

    expect(screen.getByTestId('creator-hub-main')).toHaveStyle(
      'margin-left: var(--bt-hub-sidebar-width)'
    );
  });

  it('gives the drawer its own opener rather than borrowing the header icon', () => {
    setViewport(false);
    renderShell();

    const button = screen.getByTestId('creator-hub-menu-button');

    fireEvent.click(button);

    expect(getSidebarState().mobileOpen).toBe(true);
  });
});
