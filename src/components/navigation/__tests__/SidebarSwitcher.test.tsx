import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SidebarSwitcher from '../SidebarSwitcher';
import { SidebarViewContext } from '../SidebarViewContext';
import { resetSidebarState } from '../sidebarState';

const OPTIONS = [
  { id: '1', name: 'Base Tube', handle: 'basetube', imageUrl: null },
  { id: '2', name: 'Side Project', handle: 'side', imageUrl: null },
];

const onSelect = jest.fn();

const renderSwitcher = (collapsed = false) => {
  render(
    <MemoryRouter>
      <SidebarViewContext.Provider value={{ collapsed }}>
        <SidebarSwitcher
          options={OPTIONS}
          activeId="1"
          onSelect={onSelect}
          action={{ label: 'Create channel', to: '/create-channel' }}
        />
      </SidebarViewContext.Provider>
    </MemoryRouter>
  );
};

const openMenu = () => {
  fireEvent.keyDown(screen.getByTestId('sidebar-switcher'), { key: 'Enter' });
};

/**
 * How a mouse opens a Radix menu: pointerdown with the primary button.
 *
 * jsdom has no `PointerEvent`, and Testing Library then builds a bare `Event`
 * with no `button`, which Radix ignores. A `MouseEvent` named `pointerdown`
 * carries the property React's `onPointerDown` is handed.
 */
const pointerOpenMenu = () => {
  fireEvent(
    screen.getByTestId('sidebar-switcher'),
    new MouseEvent('pointerdown', { bubbles: true, cancelable: true, button: 0 })
  );
};

beforeEach(() => {
  onSelect.mockClear();
  act(() => resetSidebarState());
});

describe('SidebarSwitcher', () => {
  it('shows the selected channel', () => {
    renderSwitcher();
    expect(screen.getByText('Base Tube')).toBeInTheDocument();
  });

  it('lists every channel plus the create action', () => {
    renderSwitcher();
    openMenu();

    const menu = screen.getByRole('menu');
    expect(menu).toHaveTextContent('Base Tube');
    expect(menu).toHaveTextContent('@basetube');
    expect(menu).toHaveTextContent('Side Project');
    expect(menu).toHaveTextContent('Create channel');
  });

  it('reports the channel that was picked', () => {
    renderSwitcher();
    openMenu();

    fireEvent.click(screen.getByText('Side Project'));

    expect(onSelect).toHaveBeenCalledWith('2');
  });

  it('is an avatar with no text in the rail', () => {
    renderSwitcher(true);

    const trigger = screen.getByTestId('sidebar-switcher');
    expect(trigger.textContent).toBe('');
    expect(trigger).toHaveAccessibleName('Base Tube');
    expect(trigger.className).toMatch(/(^|\s)h-9(\s|$)/);
    expect(trigger.className).toMatch(/(^|\s)w-9(\s|$)/);
  });

  it('shows a placeholder before the channels arrive', () => {
    render(
      <MemoryRouter>
        <SidebarSwitcher options={[]} onSelect={jest.fn()} loading />
      </MemoryRouter>
    );
    expect(screen.getByTestId('sidebar-switcher-loading')).toBeInTheDocument();
  });

  it('says which channel is selected, not just which one is bright', () => {
    renderSwitcher();
    openMenu();

    const items = screen.getAllByRole('menuitemradio');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveAccessibleName(/Base Tube/);
    expect(items[0]).toHaveAttribute('aria-checked', 'true');
    expect(items[1]).toHaveAttribute('aria-checked', 'false');
  });

  describe('while collapsed', () => {
    it('opens from the keyboard', () => {
      renderSwitcher(true);
      openMenu();

      expect(screen.getByRole('menu')).toHaveTextContent('Side Project');
    });

    it('opens from a pointer', () => {
      // The tooltip used to be the Radix trigger. It forwards neither ref nor
      // handlers, so the rail's switcher rendered a menu nothing could open.
      renderSwitcher(true);
      pointerOpenMenu();

      expect(screen.getByRole('menu')).toHaveTextContent('Side Project');
    });

    it('still reports the channel that was picked', () => {
      renderSwitcher(true);
      openMenu();

      fireEvent.click(screen.getByText('Side Project'));

      expect(onSelect).toHaveBeenCalledWith('2');
    });
  });
});
