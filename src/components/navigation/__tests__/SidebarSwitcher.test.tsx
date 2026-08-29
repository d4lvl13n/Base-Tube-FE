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
});
