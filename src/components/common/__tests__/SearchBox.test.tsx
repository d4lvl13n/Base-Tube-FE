import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { searchApi } from '../../../api/search';
import SearchBox, { SEARCH_PLACEHOLDER } from '../SearchBox';

jest.mock('../../../api/search', () => ({
  searchApi: { suggest: jest.fn(), search: jest.fn() },
}));

const suggest = searchApi.suggest as jest.MockedFunction<typeof searchApi.suggest>;

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
}

function renderBox() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <SearchBox />
      <LocationProbe />
    </MemoryRouter>
  );
}

const box = () => screen.getByPlaceholderText(SEARCH_PLACEHOLDER);
const here = () => screen.getByTestId('location').textContent;

/** Types into the box and lets the debounce and the response settle. */
async function type(value: string) {
  fireEvent.focus(box());
  fireEvent.change(box(), { target: { value } });
  await act(async () => {
    jest.advanceTimersByTime(200);
  });
}

describe('<SearchBox />', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    suggest.mockReset();
    suggest.mockResolvedValue({
      success: true,
      data: {
        titles: ['Marrakech en 4K', 'Marrakech street food'],
        channels: [
          { id: 66, name: 'tyest', handle: 'tyest.base' },
          // The index can hold a channel with no handle; the API types it null.
          { id: 91, name: 'handleless', handle: null },
        ],
      },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('asks for nothing and shows nothing on an empty box', async () => {
    renderBox();
    fireEvent.focus(box());
    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(suggest).not.toHaveBeenCalled();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('opens a dropdown of titles and channels once there is something to match', async () => {
    renderBox();
    await type('marra');

    const options = await screen.findAllByRole('option');
    expect(options).toHaveLength(4);
    expect(screen.getByText('Marrakech en 4K')).toBeInTheDocument();
    expect(screen.getByText('@tyest.base')).toBeInTheDocument();
  });

  it('runs the typed query on Enter when nothing is highlighted', async () => {
    renderBox();
    await type('marrakech');
    fireEvent.keyDown(box(), { key: 'Enter' });

    expect(here()).toBe('/search?query=marrakech');
  });

  it('walks the list with the arrow keys and opens the highlighted title', async () => {
    renderBox();
    await type('marra');
    await screen.findAllByRole('option');

    fireEvent.keyDown(box(), { key: 'ArrowDown' });
    fireEvent.keyDown(box(), { key: 'ArrowDown' });
    expect(screen.getAllByRole('option')[1]).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(box(), { key: 'ArrowUp' });
    expect(screen.getAllByRole('option')[0]).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(box(), { key: 'Enter' });
    expect(here()).toBe('/search?query=Marrakech+en+4K');
  });

  it('wraps around at the ends of the list', async () => {
    renderBox();
    await type('marra');
    await screen.findAllByRole('option');

    fireEvent.keyDown(box(), { key: 'ArrowUp' });
    expect(screen.getAllByRole('option')[3]).toHaveAttribute('aria-selected', 'true');
  });

  it('goes to the channel when a channel row is chosen', async () => {
    renderBox();
    await type('marra');
    await screen.findAllByRole('option');

    fireEvent.click(screen.getByText('tyest'));
    expect(here()).toBe('/channel/tyest.base');
  });

  it('searches for the title when a title row is clicked', async () => {
    renderBox();
    await type('marra');
    await screen.findAllByRole('option');

    fireEvent.click(screen.getByText('Marrakech street food'));
    expect(here()).toBe('/search?query=Marrakech+street+food');
  });

  it('closes on Escape without leaving the page', async () => {
    renderBox();
    await type('marra');
    await screen.findAllByRole('option');

    fireEvent.keyDown(box(), { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    expect(here()).toBe('/');
  });

  it('encodes a hashtag query rather than leaving it as a fragment', async () => {
    renderBox();
    await type('#marrakech');
    fireEvent.keyDown(box(), { key: 'Enter' });

    expect(here()).toBe('/search?query=%23marrakech');
  });

  // /channel/:identifier takes a numeric id as well as a handle, so a channel
  // without one is still reachable rather than linking to /channel/null.
  it('falls back to the channel id when the channel has no handle', async () => {
    renderBox();
    await type('marra');
    await screen.findAllByRole('option');

    fireEvent.click(screen.getByText('handleless'));
    expect(here()).toBe('/channel/91');
  });

  it('shows the handle only when there is one', async () => {
    renderBox();
    await type('marra');
    await screen.findAllByRole('option');

    expect(screen.getByText('@tyest.base')).toBeInTheDocument();
    expect(screen.queryByText('@null')).not.toBeInTheDocument();
    expect(screen.queryByText(/@undefined/)).not.toBeInTheDocument();
  });

  // A role="option" with a button inside is not announced as a choice: the
  // combobox input owns focus and the keyboard, the row only owns the click.
  it('puts no interactive element inside an option', async () => {
    renderBox();
    await type('marra');
    const options = await screen.findAllByRole('option');

    options.forEach((option) => {
      expect(option.querySelector('button')).toBeNull();
      expect(option.querySelector('a')).toBeNull();
      expect(option.querySelector('[tabindex]')).toBeNull();
    });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
