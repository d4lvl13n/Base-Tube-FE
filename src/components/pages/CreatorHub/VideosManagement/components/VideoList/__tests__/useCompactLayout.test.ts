import { renderHook } from '@testing-library/react';
import { useCompactLayout } from '../useCompactLayout';

type Listener = (event: { matches: boolean }) => void;

function stubMatchMedia(matches: boolean, modern = true) {
  const listeners: Listener[] = [];
  const list = {
    matches,
    media: '(max-width: 767px)',
    onchange: null,
    ...(modern
      ? {
          addEventListener: (_: string, listener: Listener) => listeners.push(listener),
          removeEventListener: () => undefined,
        }
      : {
          addListener: (listener: Listener) => listeners.push(listener),
          removeListener: () => undefined,
        }),
    dispatchEvent: () => false,
  };
  Object.defineProperty(window, 'matchMedia', { writable: true, value: () => list });
  return { list, listeners };
}

afterEach(() => {
  Object.defineProperty(window, 'matchMedia', { writable: true, value: undefined });
});

describe('useCompactLayout', () => {
  it('answers on the very first render, with no frame of the wrong layout', () => {
    stubMatchMedia(true);
    expect(renderHook(() => useCompactLayout()).result.current).toBe(true);

    stubMatchMedia(false);
    expect(renderHook(() => useCompactLayout()).result.current).toBe(false);
  });

  // A missing `matchMedia` — jsdom without the stub, an old embedded browser,
  // any server-side render — must give the desktop table, not a crash.
  it('falls back to the table when the browser cannot be asked', () => {
    Object.defineProperty(window, 'matchMedia', { writable: true, value: undefined });

    expect(() => renderHook(() => useCompactLayout())).not.toThrow();
    expect(renderHook(() => useCompactLayout()).result.current).toBe(false);
  });

  it('subscribes through whichever spelling the browser has', () => {
    const modern = stubMatchMedia(false, true);
    renderHook(() => useCompactLayout());
    expect(modern.listeners).toHaveLength(1);

    const legacy = stubMatchMedia(false, false);
    renderHook(() => useCompactLayout());
    expect(legacy.listeners).toHaveLength(1);
  });
});
