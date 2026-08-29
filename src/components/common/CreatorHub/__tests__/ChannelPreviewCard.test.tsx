import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Channel } from '../../../../types/channel';
import ChannelPreviewCard from '../ChannelPreviewCard';

// The card's edit and delete surfaces pull in the whole channel form; this
// test is about what the card itself renders.
jest.mock('../../../pages/CreatorHub/ChannelManagement/components/EditChannelModal', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('../../../pages/CreatorHub/ChannelManagement/components/DeleteChannel', () => ({
  __esModule: true,
  default: () => null,
}));

const LOG_DUMP =
  '2026-08-01T10:00:00Z INFO starting encoder '.repeat(20);

const channel = (overrides: Partial<Channel> = {}): Channel =>
  ({
    id: 1,
    name: 'test channel',
    handle: 'test',
    description: 'A short line.',
    channel_image_url: 'https://cdn.example.com/cover.jpg',
    subscribers_count: 12,
    videos_count: 3,
    ...overrides,
  }) as unknown as Channel;

/** jsdom lays nothing out, so the clamp has to be told whether it is clamping. */
const setOverflowing = (overflowing: boolean) => {
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
    configurable: true,
    get: () => (overflowing ? 400 : 20),
  });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get: () => 20,
  });
};

// `resetMocks` wipes the shared `matchMedia` jest.fn() between tests, and
// framer-motion reads it on mount. A plain function survives the reset.
beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
});

afterEach(() => {
  // @ts-expect-error restoring the jsdom defaults
  delete HTMLElement.prototype.scrollHeight;
  // @ts-expect-error restoring the jsdom defaults
  delete HTMLElement.prototype.clientHeight;
});

const renderCard = (overrides: Partial<Channel> = {}) =>
  render(
    <MemoryRouter>
      <ChannelPreviewCard channel={channel(overrides)} />
    </MemoryRouter>
  );

describe('ChannelPreviewCard', () => {
  describe('the cover image', () => {
    it('carries no alt text that could land on the title', () => {
      renderCard();

      const cover = screen.getByRole('img', { hidden: true });
      expect(cover).toHaveAttribute('alt', '');
      expect(screen.queryByText(/test channel cover/i)).not.toBeInTheDocument();
    });

    it('falls back to a plain surface when it fails to load', () => {
      renderCard();

      fireEvent.error(screen.getByRole('img', { hidden: true }));

      expect(screen.getByTestId('channel-cover-placeholder')).toBeInTheDocument();
      expect(screen.queryByRole('img', { hidden: true })).not.toBeInTheDocument();
      expect(screen.queryByText(/cover/i)).not.toBeInTheDocument();
      expect(screen.getByText('test channel')).toBeInTheDocument();
    });
  });

  describe('the description', () => {
    it('clamps a wall of text to two lines and offers to open it', () => {
      setOverflowing(true);
      renderCard({ description: LOG_DUMP });

      expect(screen.getByTestId('channel-description').className).toContain('line-clamp-2');

      fireEvent.click(screen.getByRole('button', { name: 'More' }));

      expect(screen.getByTestId('channel-description').className).not.toContain('line-clamp-2');
      expect(screen.getByRole('button', { name: 'Less' })).toBeInTheDocument();
    });

    it('offers nothing to open when the text already fits', () => {
      setOverflowing(false);
      renderCard();

      expect(screen.queryByRole('button', { name: 'More' })).not.toBeInTheDocument();
    });

    it('re-measures when the card is resized', () => {
      // Collapsing the sidebar widens this card, and text that needed three
      // lines at 240px may well fit in two at 60px.
      const observers: Array<() => void> = [];
      const original = global.ResizeObserver;
      class CapturingResizeObserver {
        constructor(callback: () => void) {
          observers.push(callback);
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      }
      global.ResizeObserver = CapturingResizeObserver as unknown as typeof ResizeObserver;

      try {
        setOverflowing(false);
        renderCard({ description: LOG_DUMP });
        expect(screen.queryByRole('button', { name: 'More' })).not.toBeInTheDocument();

        setOverflowing(true);
        act(() => observers.forEach((notify) => notify()));

        expect(screen.getByRole('button', { name: 'More' })).toBeInTheDocument();
      } finally {
        global.ResizeObserver = original;
      }
    });
  });
});
